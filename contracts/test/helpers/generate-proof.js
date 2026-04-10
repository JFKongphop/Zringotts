#!/usr/bin/env node

/**
 * Generate real Groth16 proofs for Foundry tests via FFI
 * Usage: node generate-proof.js <command> [args...]
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Import from circuits
const circuitsPath = path.join(__dirname, '../../../circuits');
const { buildPoseidon } = require(path.join(circuitsPath, 'node_modules/circomlibjs'));
const { MerkleTree } = require(path.join(circuitsPath, 'node_modules/fixed-merkle-tree'));
const snarkjs = require(path.join(circuitsPath, 'node_modules/snarkjs'));
const { ethers } = require(path.join(circuitsPath, 'node_modules/ethers'));

const TREE_LEVELS = 2;
const BUILD_PATH = path.join(circuitsPath, 'build');
const TEMP_PATH = path.join(__dirname, '.temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_PATH)) {
  fs.mkdirSync(TEMP_PATH, { recursive: true });
}

async function generateProof() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  
  // Hash functions
  const hash2 = (left, right) => {
    const hash = poseidon([BigInt(left), BigInt(right)]);
    return F.toString(hash);
  };
  
  const hashNote = (lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce) => {
    const hash = poseidon([
      BigInt(lend_amt),
      BigInt(borrow_amt),
      BigInt(will_liq_price),
      BigInt(timestamp),
      BigInt(nullifier),
      BigInt(nonce)
    ]);
    return F.toString(hash);
  };
  
  const command = process.argv[2];
  
  if (command === 'deposit-initial') {
    // Generate proof for initial deposit (no previous note)
    // Args: lend_amt, will_liq_price, timestamp, nullifier, nonce
    const lend_amt = process.argv[3];
    const will_liq_price = process.argv[4];
    const timestamp = process.argv[5];
    const nullifier = process.argv[6];
    const nonce = process.argv[7];
    
    // Calculate new note hash
    const newNoteHash = hashNote(lend_amt, 0, will_liq_price, timestamp, nullifier, nonce);
    
    // For initial deposit, create a tree with the prev_hash (which is '0' for empty note)
    // Even though prev note is empty, circuit still validates Merkle proof structure
    const prevHash = hashNote('0', '0', '0', '0', '0', '0');
    
    // Create tree with the previous note hash
    const tree = new MerkleTree(TREE_LEVELS, [], {
      hashFunction: hash2,
      zeroElement: '0'
    });
    tree.insert(prevHash);
    const treeRoot = tree.root.toString();
    
    // For a 2-level tree with 1 element at index 0:
    // Level 0: [prevHash, 0, 0, 0]
    // Level 1: [hash(prevHash, 0), hash(0, 0)]
    // Root: hash(level1[0], level1[1])
    // So the path siblings are: ['0', hash('0', '0')]
    const zeroHash = hash2('0', '0');
    const merkleProof = {
      pathElements: ['0', zeroHash],
      pathIndices: [0, 0]
    };
    
    // Create circuit input
    const input = {
      // New note
      new_lend_amt: lend_amt,
      new_borrow_amt: '0',
      new_will_liq_price: will_liq_price,
      new_timestamp: timestamp,
      new_nullifier: nullifier,
      new_nonce: nonce,
      new_note_hash: newNoteHash,
      
      // Previous note (empty)
      prev_lend_amt: '0',
      prev_borrow_amt: '0',
      prev_will_liq_price: '0',
      prev_timestamp: '0',
      prev_nullifier: '0',
      prev_nonce: '0',
      prev_hash: prevHash,
      prev_index_bits: merkleProof.pathIndices,
      prev_hash_path: merkleProof.pathElements.map(e => e.toString()),
      
      // Root
      root: treeRoot,
      
      // Liquidated array (10 positions) - matches contract initialization: liq_price = i+1, timestamp = 0
      liq_price: Array.from({length: 10}, (_, i) => String(i + 1)),
      liq_timestamp: Array(10).fill('0'),
      
      // Token movements
      lend_token_out: '0',
      borrow_token_out: '0',
      lend_token_in: lend_amt,
      borrow_token_in: '0'
    };
    
    // Save input
    const inputFile = path.join(TEMP_PATH, 'input.json');
    fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
    
    const wtnsFile = path.join(TEMP_PATH, 'witness.wtns');
    const wasmFile = path.join(BUILD_PATH, 'zringotts_js', 'zringotts.wasm');
    const startWitness = Date.now();
    
    await snarkjs.wtns.calculate(input, wasmFile, wtnsFile);
    
    const zkeyFile = path.join(BUILD_PATH, 'zringotts.zkey');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyFile, wtnsFile);
    
    // Format proof for Solidity (ProofData struct)
    // struct ProofData { uint256[2] pA; uint256[2][2] pB; uint256[2] pC; uint256[26] publicSignals; }
    const pA = [proof.pi_a[0], proof.pi_a[1]];
    const pB = [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ];
    const pC = [proof.pi_c[0], proof.pi_c[1]];
    
    // Ensure we have exactly 26 public signals
    if (publicSignals.length !== 26) {
      throw new Error(`Expected 26 public signals, got ${publicSignals.length}`);
    }
    
    // ABI encode the tuple for Solidity to decode
    const abiCoder = new ethers.utils.AbiCoder();
    const encoded = abiCoder.encode(
      ['tuple(uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256[26] publicSignals)'],
      [[pA, pB, pC, publicSignals]]
    );
    
    // Output hex-encoded data for vm.ffi
    process.stdout.write(encoded);
    process.exit(0);
    
  } else if (command === 'deposit-update') {
    // Generate proof for adding collateral to existing note
    // Args: prev_note (6 fields), prev_root, prev_index, prev_path (2 elements), new_note (6 fields), lend_in
    const prev_lend = process.argv[3];
    const prev_borrow = process.argv[4];
    const prev_liq_price = process.argv[5];
    const prev_timestamp = process.argv[6];
    const prev_nullifier = process.argv[7];
    const prev_nonce = process.argv[8];
    const prev_root = process.argv[9];
    const prev_index = process.argv[10];
    const prev_path_0 = process.argv[11] || '0';
    const prev_path_1 = process.argv[12] || '0';
    
    const new_lend = process.argv[13];
    const new_borrow = process.argv[14];
    const new_liq_price = process.argv[15];
    const new_timestamp = process.argv[16];
    const new_nullifier = process.argv[17];
    const new_nonce = process.argv[18];
    
    const lend_in = process.argv[19];
    
    // Calculate hashes
    const prevHash = hashNote(prev_lend, prev_borrow, prev_liq_price, prev_timestamp, prev_nullifier, prev_nonce);
    const newHash = hashNote(new_lend, new_borrow, new_liq_price, new_timestamp, new_nullifier, new_nonce);
    
    // Convert index to bits
    const indexBits = prev_index.toString(2).padStart(TREE_LEVELS, '0').split('').map(b => b === '1' ? 1 : 0);
    
    const input = {
      // New note
      new_lend_amt: new_lend,
      new_borrow_amt: new_borrow,
      new_will_liq_price: new_liq_price,
      new_timestamp: new_timestamp,
      new_nullifier: new_nullifier,
      new_nonce: new_nonce,
      new_note_hash: newHash,
      
      // Previous note
      prev_lend_amt: prev_lend,
      prev_borrow_amt: prev_borrow,
      prev_will_liq_price: prev_liq_price,
      prev_timestamp: prev_timestamp,
      prev_nullifier: prev_nullifier,
      prev_nonce: prev_nonce,
      prev_hash: prevHash,
      prev_index_bits: indexBits,
      prev_hash_path: [prev_path_0, prev_path_1],
      
      // Root
      root: prev_root,
      
      // Liquidated array
      liq_price: Array(10).fill('1'),
      liq_timestamp: Array(10).fill('0'),
      
      // Token movements
      lend_token_out: '0',
      borrow_token_out: '0',
      lend_token_in: lend_in,
      borrow_token_in: '0'
    };
    
    // Save, generate witness, and prove
    const inputFile = path.join(TEMP_PATH, 'input.json');
    fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
    
    const wtnsFile = path.join(TEMP_PATH, 'witness.wtns');
    const wasmFile = path.join(BUILD_PATH, 'zringotts_js', 'zringotts.wasm');
    
    await snarkjs.wtns.calculate(input, wasmFile, wtnsFile);
    
    const zkeyFile = path.join(BUILD_PATH, 'zringotts.zkey');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyFile, wtnsFile);
    
    const result = {
      pA: [proof.pi_a[0], proof.pi_a[1]],
      pB: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      pC: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals: publicSignals
    };
    
    console.log(JSON.stringify(result));
    
  } else if (command === 'full-flow') {
    // Full lending protocol flow: Deposit → Add Collateral → Borrow → Repay
    // Args: timestamp (block.timestamp from Foundry, must be recent enough for 5-min window)
    const ts = process.argv[3];
    if (!ts) { throw new Error('Usage: node generate-proof.js full-flow <timestamp>'); }

    // Helper: compute witness + proof, return formatted ProofData
    const prove = async (input) => {
      const wtnsFile = path.join(TEMP_PATH, 'witness_flow.wtns');
      const wasmFile = path.join(BUILD_PATH, 'zringotts_js', 'zringotts.wasm');
      await snarkjs.wtns.calculate(input, wasmFile, wtnsFile);
      const zkeyFile = path.join(BUILD_PATH, 'zringotts.zkey');
      const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyFile, wtnsFile);
      if (publicSignals.length !== 26) throw new Error(`Expected 26 signals, got ${publicSignals.length}`);
      return {
        pA: [proof.pi_a[0], proof.pi_a[1]],
        pB: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        pC: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals
      };
    };

    const liqPrice = Array.from({length: 10}, (_, i) => String(i + 1));
    const liqTs    = Array(10).fill('0');

    // Notes matching circuits/quickstart/examples.js
    //   note1: initial deposit  (lend=500,  borrow=0,   liq=2800)
    //   note2: add collateral   (lend=1000, borrow=0,   liq=2800)  +500 lend
    //   note3: borrow           (lend=1000, borrow=500, liq=2800)  +500 borrow
    //   note4: repay            (lend=1000, borrow=0,   liq=2800)  -500 borrow
    const notes = [
      { lend: '500',  borrow: '0',   liq: '2800', nullifier: '112',  nonce: '13'   },
      { lend: '1000', borrow: '0',   liq: '2800', nullifier: '999',  nonce: '888'  },
      { lend: '1000', borrow: '500', liq: '2800', nullifier: '1111', nonce: '2222' },
      { lend: '1000', borrow: '0',   liq: '2800', nullifier: '3333', nonce: '4444' },
    ];
    const hashes = notes.map(n => hashNote(n.lend, n.borrow, n.liq, ts, n.nullifier, n.nonce));

    // ──────────────────────────────────────────────────────────────
    // Step 1: Initial deposit (empty previous note)
    // ──────────────────────────────────────────────────────────────
    const emptyPrevHash = hashNote('0', '0', '0', '0', '0', '0');
    // Circuit tree: the prev_hash (empty note) must be provably in this tree
    const step1CircuitTree = new MerkleTree(TREE_LEVELS, [], { hashFunction: hash2, zeroElement: '0' });
    step1CircuitTree.insert(emptyPrevHash);
    const { pathElements: pe1, pathIndices: pi1 } = step1CircuitTree.path(0);

    const proof1 = await prove({
      new_lend_amt: notes[0].lend, new_borrow_amt: notes[0].borrow, new_will_liq_price: notes[0].liq,
      new_timestamp: ts, new_nullifier: notes[0].nullifier, new_nonce: notes[0].nonce,
      new_note_hash: hashes[0],
      root: step1CircuitTree.root.toString(),
      prev_lend_amt: '0', prev_borrow_amt: '0', prev_will_liq_price: '0',
      prev_timestamp: '0', prev_nullifier: '0', prev_nonce: '0',
      prev_hash: emptyPrevHash,
      prev_index_bits: pi1.map(String),
      prev_hash_path: pe1.map(e => e.toString()),
      liq_price: liqPrice, liq_timestamp: liqTs,
      lend_token_out: '0', borrow_token_out: '0', lend_token_in: notes[0].lend, borrow_token_in: '0'
    });

    // Contract tree: mirrors what the on-chain contract does after each _insert()
    const contractTree = new MerkleTree(TREE_LEVELS, [], { hashFunction: hash2, zeroElement: '0' });
    contractTree.insert(hashes[0]); // note1 at index 0

    // ──────────────────────────────────────────────────────────────
    // Step 2: Add collateral (+500 lend), spend note1, create note2
    // ──────────────────────────────────────────────────────────────
    const { pathElements: pe2, pathIndices: pi2 } = contractTree.path(0); // note1 at index 0

    const proof2 = await prove({
      new_lend_amt: notes[1].lend, new_borrow_amt: notes[1].borrow, new_will_liq_price: notes[1].liq,
      new_timestamp: ts, new_nullifier: notes[1].nullifier, new_nonce: notes[1].nonce,
      new_note_hash: hashes[1],
      root: contractTree.root.toString(),
      prev_lend_amt: notes[0].lend, prev_borrow_amt: notes[0].borrow, prev_will_liq_price: notes[0].liq,
      prev_timestamp: ts, prev_nullifier: notes[0].nullifier, prev_nonce: notes[0].nonce,
      prev_hash: hashes[0],
      prev_index_bits: pi2.map(String),
      prev_hash_path: pe2.map(e => e.toString()),
      liq_price: liqPrice, liq_timestamp: liqTs,
      lend_token_out: '0', borrow_token_out: '0', lend_token_in: '500', borrow_token_in: '0'
    });
    contractTree.insert(hashes[1]); // note2 at index 1

    // ──────────────────────────────────────────────────────────────
    // Step 3: Borrow 500 USDC, spend note2, create note3
    // ──────────────────────────────────────────────────────────────
    const { pathElements: pe3, pathIndices: pi3 } = contractTree.path(1); // note2 at index 1

    const proof3 = await prove({
      new_lend_amt: notes[2].lend, new_borrow_amt: notes[2].borrow, new_will_liq_price: notes[2].liq,
      new_timestamp: ts, new_nullifier: notes[2].nullifier, new_nonce: notes[2].nonce,
      new_note_hash: hashes[2],
      root: contractTree.root.toString(),
      prev_lend_amt: notes[1].lend, prev_borrow_amt: notes[1].borrow, prev_will_liq_price: notes[1].liq,
      prev_timestamp: ts, prev_nullifier: notes[1].nullifier, prev_nonce: notes[1].nonce,
      prev_hash: hashes[1],
      prev_index_bits: pi3.map(String),
      prev_hash_path: pe3.map(e => e.toString()),
      liq_price: liqPrice, liq_timestamp: liqTs,
      lend_token_out: '0', borrow_token_out: '0', lend_token_in: '0', borrow_token_in: '500'
    });
    contractTree.insert(hashes[2]); // note3 at index 2

    // ──────────────────────────────────────────────────────────────
    // Step 4: Repay 500 USDC, spend note3, create note4
    // ──────────────────────────────────────────────────────────────
    const { pathElements: pe4, pathIndices: pi4 } = contractTree.path(2); // note3 at index 2

    const proof4 = await prove({
      new_lend_amt: notes[3].lend, new_borrow_amt: notes[3].borrow, new_will_liq_price: notes[3].liq,
      new_timestamp: ts, new_nullifier: notes[3].nullifier, new_nonce: notes[3].nonce,
      new_note_hash: hashes[3],
      root: contractTree.root.toString(),
      prev_lend_amt: notes[2].lend, prev_borrow_amt: notes[2].borrow, prev_will_liq_price: notes[2].liq,
      prev_timestamp: ts, prev_nullifier: notes[2].nullifier, prev_nonce: notes[2].nonce,
      prev_hash: hashes[2],
      prev_index_bits: pi4.map(String),
      prev_hash_path: pe4.map(e => e.toString()),
      liq_price: liqPrice, liq_timestamp: liqTs,
      lend_token_out: '0', borrow_token_out: '500', lend_token_in: '0', borrow_token_in: '0'
    });

    // ABI-encode all 4 proofs for Solidity abi.decode
    const abiCoder = new ethers.utils.AbiCoder();
    const proofType = 'tuple(uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256[26] publicSignals)';
    const encoded = abiCoder.encode(
      [proofType, proofType, proofType, proofType],
      [proof1, proof2, proof3, proof4]
    );

    process.stdout.write(encoded);
    process.exit(0);

  } else {
    process.stderr.write('Unknown command. Use: deposit-initial, deposit-update, or full-flow\n');
    process.exit(1);
  }
  
  // Cleanup
  try {
    fs.unlinkSync(path.join(TEMP_PATH, 'input.json'));
    fs.unlinkSync(path.join(TEMP_PATH, 'witness.wtns'));
  } catch (e) {
    // Ignore cleanup errors
  }
}

generateProof().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
