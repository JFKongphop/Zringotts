/**
 * ZK proof generation for Zringotts deposit/borrow/repay/withdraw.
 *
 * Circuit: Main(LEVEL=2), compiled to zringotts.wasm + zringotts.zkey
 *
 * Merkle tree constants (from MerkleTreeWithHistory.sol):
 *   ZERO_VALUE = 0
 *   Z_1 = Poseidon(0, 0)
 *   Z_2 = Poseidon(Z_1, Z_1)  ← initial root for a level-2 tree
 *
 * For a FRESH deposit (no prior note), the prover uses:
 *   prev_hash         = 0 (Z_0)
 *   prev_index_bits   = [0, 0]
 *   prev_hash_path    = [0, Z_1]
 *   root              = Z_2  (consistent with above path)
 *   old_nullifier     = 0    (contract skips root check when this is 0)
 */

// Z constants from MerkleTreeWithHistory.sol (level 0–2 are enough for LEVEL=2)
const Z_0 = BigInt(0);
const Z_1 = BigInt('14744269619966411208579211824598458697587494354926760081771325075741142829156');
const Z_2 = BigInt('7423237065226347324353380772367382631490014989348495481811164164159255474657');

/** The initial/empty Merkle root (level-2 tree) */
export const INITIAL_ROOT = Z_2;

export interface ZKNote {
  lendAmt: bigint;
  borrowAmt: bigint;
  willLiqPrice: bigint;
  timestamp: bigint;
  nullifier: bigint;
  nonce: bigint;
  noteHash: bigint;
}

export interface DepositProofResult {
  /** Solidity-ready Groth16 proof components */
  pA: readonly [bigint, bigint];
  pB: readonly [[bigint, bigint], [bigint, bigint]];
  pC: readonly [bigint, bigint];
  /** The new note commitment (bytes32 on-chain) */
  noteHash: bigint;
  /** The Merkle root used in the proof (always Z_2 for fresh deposits) */
  root: bigint;
  /** The timestamp embedded in the note */
  timestamp: bigint;
  /** Note secret: needed to spend the commitment later */
  note: ZKNote;
}

/** Generate a cryptographically random field element (< BN128 field size) */
function randomFieldElement(): bigint {
  const bytes = new Uint8Array(31); // 248 bits — safely below the BN128 field
  crypto.getRandomValues(bytes);
  return bytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);
}

/**
 * Generate a Groth16 deposit proof for a FRESH position (no prior note).
 *
 * @param lendAmt          Amount to deposit (raw, already parsed to bigint with decimals)
 * @param liquidatedPrices Array of 10 liquidation prices from the contract
 * @param liquidatedTimes  Array of 10 liquidation timestamps from the contract
 */
export async function generateDepositProof(
  lendAmt: bigint,
  liquidatedPrices: bigint[],
  liquidatedTimes: bigint[],
): Promise<DepositProofResult> {
  if (liquidatedPrices.length !== 10 || liquidatedTimes.length !== 10) {
    throw new Error('Liquidation array must have exactly 10 entries');
  }

  // --- Dynamic imports (not available server-side / too large for static bundling) ---
  const [{ buildPoseidon }, { groth16 }] = await Promise.all([
    import('circomlibjs'),
    import('snarkjs'),
  ]);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // --- Note fields ---
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const nullifier = randomFieldElement();
  const nonce = randomFieldElement();
  const willLiqPrice = 0n; // Pure deposit: no borrow, no liquidation price needed

  // Compute new_note_hash = Poseidon(lendAmt, 0, willLiqPrice, timestamp, nullifier, nonce)
  const noteHashField = poseidon([lendAmt, 0n, willLiqPrice, timestamp, nullifier, nonce]);
  const noteHash = F.toObject(noteHashField) as bigint;

  // --- Witness inputs ---
  const inputs = {
    // New note (mostly private)
    new_lend_amt:       lendAmt.toString(),
    new_borrow_amt:     '0',
    new_will_liq_price: '0',
    new_timestamp:      timestamp.toString(),
    new_nullifier:      nullifier.toString(),
    new_nonce:          nonce.toString(),

    // Public: new note hash + Merkle root
    new_note_hash:      noteHash.toString(),
    root:               Z_2.toString(),

    // Previous note — all zero (fresh deposit)
    prev_lend_amt:      '0',
    prev_borrow_amt:    '0',
    prev_will_liq_price:'0',
    prev_timestamp:     '0',
    prev_nullifier:     '0',
    prev_nonce:         '0',
    prev_hash:          '0',          // Z_0 = 0; consistent with path below
    prev_index_bits:    ['0', '0'],   // leaf index 0
    prev_hash_path:     ['0', Z_1.toString()], // sibling path for index 0 in empty tree

    // Public: liquidation array (10 entries each)
    liq_price:     liquidatedPrices.map(String),
    liq_timestamp: liquidatedTimes.map(String),

    // Public: token movement — deposit only, no borrow
    lend_token_out:   '0',
    borrow_token_out: '0',
    lend_token_in:    lendAmt.toString(),
    borrow_token_in:  '0',
  };

  console.log('[zkproof] Generating proof… this may take 10–30 seconds.');
  const { proof, publicSignals } = await groth16.fullProve(
    inputs,
    '/zringotts.wasm',
    '/zringotts.zkey',
  );
  console.log('[zkproof] Proof generated.', { publicSignals });

  // --- Format for Solidity (pB coordinates are reversed per BN128 convention) ---
  const pA: readonly [bigint, bigint] = [
    BigInt(proof.pi_a[0]),
    BigInt(proof.pi_a[1]),
  ] as const;
  const pB: readonly [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ] as const;
  const pC: readonly [bigint, bigint] = [
    BigInt(proof.pi_c[0]),
    BigInt(proof.pi_c[1]),
  ] as const;

  const note: ZKNote = {
    lendAmt,
    borrowAmt: 0n,
    willLiqPrice,
    timestamp,
    nullifier,
    nonce,
    noteHash,
  };

  return { pA, pB, pC, noteHash, root: Z_2, timestamp, note };
}

/**
 * Generate a borrow proof to add debt to an existing position.
 * 
 * @param oldNote          The existing note (from local storage)
 * @param borrowAmt        Amount to borrow
 * @param willLiqPrice     New liquidation price for the updated position
 * @param merkleRoot       Current Merkle root from contract
 * @param merkleIndex      Leaf index of old commitment (from event logs or local tracking)
 * @param merklePath       Sibling path for old commitment
 * @param liquidatedPrices Array of 10 liquidation prices
 * @param liquidatedTimes  Array of 10 liquidation timestamps
 */
export async function generateBorrowProof(
  oldNote: ZKNote,
  borrowAmt: bigint,
  willLiqPrice: bigint,
  merkleRoot: bigint,
  merkleIndex: number,
  merklePath: bigint[],
  liquidatedPrices: bigint[],
  liquidatedTimes: bigint[],
): Promise<DepositProofResult> {
  const [{ buildPoseidon }, { groth16 }] = await Promise.all([
    import('circomlibjs'),
    import('snarkjs'),
  ]);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // New note with increased borrow
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const newNullifier = randomFieldElement();
  const newNonce = randomFieldElement();
  const newBorrowAmt = oldNote.borrowAmt + borrowAmt;

  const noteHashField = poseidon([
    oldNote.lendAmt,
    newBorrowAmt,
    willLiqPrice,
    timestamp,
    newNullifier,
    newNonce,
  ]);
  const noteHash = F.toObject(noteHashField) as bigint;

  // Convert merkle index to bits
  const indexBits = merkleIndex.toString(2).padStart(merklePath.length, '0').split('').map(String);

  const inputs = {
    new_lend_amt:       oldNote.lendAmt.toString(),
    new_borrow_amt:     newBorrowAmt.toString(),
    new_will_liq_price: willLiqPrice.toString(),
    new_timestamp:      timestamp.toString(),
    new_nullifier:      newNullifier.toString(),
    new_nonce:          newNonce.toString(),
    new_note_hash:      noteHash.toString(),
    root:               merkleRoot.toString(),

    prev_lend_amt:      oldNote.lendAmt.toString(),
    prev_borrow_amt:    oldNote.borrowAmt.toString(),
    prev_will_liq_price: oldNote.willLiqPrice.toString(),
    prev_timestamp:     oldNote.timestamp.toString(),
    prev_nullifier:     oldNote.nullifier.toString(),
    prev_nonce:         oldNote.nonce.toString(),
    prev_hash:          oldNote.noteHash.toString(),
    prev_index_bits:    indexBits,
    prev_hash_path:     merklePath.map(String),

    liq_price:     liquidatedPrices.map(String),
    liq_timestamp: liquidatedTimes.map(String),

    lend_token_out:   '0',
    borrow_token_out: '0',
    lend_token_in:    '0',
    borrow_token_in:  borrowAmt.toString(),
  };

  console.log('[zkproof] Generating borrow proof…');
  const { proof } = await groth16.fullProve(inputs, '/zringotts.wasm', '/zringotts.zkey');
  console.log('[zkproof] Borrow proof generated.');

  const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as const;
  const pB = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ] as const;
  const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as const;

  const note: ZKNote = {
    lendAmt: oldNote.lendAmt,
    borrowAmt: newBorrowAmt,
    willLiqPrice,
    timestamp,
    nullifier: newNullifier,
    nonce: newNonce,
    noteHash,
  };

  return { pA, pB, pC, noteHash, root: merkleRoot, timestamp, note };
}

/**
 * Generate a repay proof to reduce debt on an existing position.
 */
export async function generateRepayProof(
  oldNote: ZKNote,
  repayAmt: bigint,
  willLiqPrice: bigint,
  merkleRoot: bigint,
  merkleIndex: number,
  merklePath: bigint[],
  liquidatedPrices: bigint[],
  liquidatedTimes: bigint[],
): Promise<DepositProofResult> {
  const [{ buildPoseidon }, { groth16 }] = await Promise.all([
    import('circomlibjs'),
    import('snarkjs'),
  ]);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const newNullifier = randomFieldElement();
  const newNonce = randomFieldElement();
  const newBorrowAmt = oldNote.borrowAmt - repayAmt;

  if (newBorrowAmt < 0n) {
    throw new Error('Cannot repay more than borrowed amount');
  }

  const noteHashField = poseidon([
    oldNote.lendAmt,
    newBorrowAmt,
    willLiqPrice,
    timestamp,
    newNullifier,
    newNonce,
  ]);
  const noteHash = F.toObject(noteHashField) as bigint;

  const indexBits = merkleIndex.toString(2).padStart(merklePath.length, '0').split('').map(String);

  const inputs = {
    new_lend_amt:       oldNote.lendAmt.toString(),
    new_borrow_amt:     newBorrowAmt.toString(),
    new_will_liq_price: willLiqPrice.toString(),
    new_timestamp:      timestamp.toString(),
    new_nullifier:      newNullifier.toString(),
    new_nonce:          newNonce.toString(),
    new_note_hash:      noteHash.toString(),
    root:               merkleRoot.toString(),

    prev_lend_amt:      oldNote.lendAmt.toString(),
    prev_borrow_amt:    oldNote.borrowAmt.toString(),
    prev_will_liq_price: oldNote.willLiqPrice.toString(),
    prev_timestamp:     oldNote.timestamp.toString(),
    prev_nullifier:     oldNote.nullifier.toString(),
    prev_nonce:         oldNote.nonce.toString(),
    prev_hash:          oldNote.noteHash.toString(),
    prev_index_bits:    indexBits,
    prev_hash_path:     merklePath.map(String),

    liq_price:     liquidatedPrices.map(String),
    liq_timestamp: liquidatedTimes.map(String),

    lend_token_out:   '0',
    borrow_token_out: repayAmt.toString(),
    lend_token_in:    '0',
    borrow_token_in:  '0',
  };

  console.log('[zkproof] Generating repay proof…');
  const { proof } = await groth16.fullProve(inputs, '/zringotts.wasm', '/zringotts.zkey');
  console.log('[zkproof] Repay proof generated.');

  const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as const;
  const pB = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ] as const;
  const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as const;

  const note: ZKNote = {
    lendAmt: oldNote.lendAmt,
    borrowAmt: newBorrowAmt,
    willLiqPrice,
    timestamp,
    nullifier: newNullifier,
    nonce: newNonce,
    noteHash,
  };

  return { pA, pB, pC, noteHash, root: merkleRoot, timestamp, note };
}

/**
 * Generate a withdraw proof to reduce collateral on an existing position.
 */
export async function generateWithdrawProof(
  oldNote: ZKNote,
  withdrawAmt: bigint,
  willLiqPrice: bigint,
  merkleRoot: bigint,
  merkleIndex: number,
  merklePath: bigint[],
  liquidatedPrices: bigint[],
  liquidatedTimes: bigint[],
): Promise<DepositProofResult> {
  const [{ buildPoseidon }, { groth16 }] = await Promise.all([
    import('circomlibjs'),
    import('snarkjs'),
  ]);

  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const newNullifier = randomFieldElement();
  const newNonce = randomFieldElement();
  const newLendAmt = oldNote.lendAmt - withdrawAmt;

  if (newLendAmt < 0n) {
    throw new Error('Cannot withdraw more than deposited amount');
  }

  const noteHashField = poseidon([
    newLendAmt,
    oldNote.borrowAmt,
    willLiqPrice,
    timestamp,
    newNullifier,
    newNonce,
  ]);
  const noteHash = F.toObject(noteHashField) as bigint;

  const indexBits = merkleIndex.toString(2).padStart(merklePath.length, '0').split('').map(String);

  const inputs = {
    new_lend_amt:       newLendAmt.toString(),
    new_borrow_amt:     oldNote.borrowAmt.toString(),
    new_will_liq_price: willLiqPrice.toString(),
    new_timestamp:      timestamp.toString(),
    new_nullifier:      newNullifier.toString(),
    new_nonce:          newNonce.toString(),
    new_note_hash:      noteHash.toString(),
    root:               merkleRoot.toString(),

    prev_lend_amt:      oldNote.lendAmt.toString(),
    prev_borrow_amt:    oldNote.borrowAmt.toString(),
    prev_will_liq_price: oldNote.willLiqPrice.toString(),
    prev_timestamp:     oldNote.timestamp.toString(),
    prev_nullifier:     oldNote.nullifier.toString(),
    prev_nonce:         oldNote.nonce.toString(),
    prev_hash:          oldNote.noteHash.toString(),
    prev_index_bits:    indexBits,
    prev_hash_path:     merklePath.map(String),

    liq_price:     liquidatedPrices.map(String),
    liq_timestamp: liquidatedTimes.map(String),

    lend_token_out:   withdrawAmt.toString(),
    borrow_token_out: '0',
    lend_token_in:    '0',
    borrow_token_in:  '0',
  };

  console.log('[zkproof] Generating withdraw proof…');
  const { proof } = await groth16.fullProve(inputs, '/zringotts.wasm', '/zringotts.zkey');
  console.log('[zkproof] Withdraw proof generated.');

  const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as const;
  const pB = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ] as const;
  const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as const;

  const note: ZKNote = {
    lendAmt: newLendAmt,
    borrowAmt: oldNote.borrowAmt,
    willLiqPrice,
    timestamp,
    nullifier: newNullifier,
    nonce: newNonce,
    noteHash,
  };

  return { pA, pB, pC, noteHash, root: merkleRoot, timestamp, note };
}
