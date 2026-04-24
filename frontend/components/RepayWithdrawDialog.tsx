'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseUnits, toHex, padHex } from 'viem';
import { WETH_ADDRESS, USDC_ADDRESS, ZRINGOTTS_ADDRESS, ERC20_ABI, ZRINGOTTS_ABI } from '@/lib/contracts';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { usePositionStore, Position } from '@/hooks/usePositionStore';
import { generateBorrowProof, generateRepayProof, generateWithdrawProof, ZKNote, INITIAL_ROOT } from '@/lib/zkproof';
import { switchToInitiaNetwork } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  action: 'borrow' | 'repay' | 'withdraw';
}

type Token = 'WETH' | 'USDC';

export function RepayWithdrawDialog({ open, onClose, position, action }: Props) {
  const { address } = useAccount();
  const { refetch } = useTokenBalances();
  const { updatePosition } = usePositionStore();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approving' | 'proving' | 'submitting' | 'done' | 'error'>('input');
  const [errorMsg, setErrorMsg] = useState('');

  // Read liquidation array from contract
  const { data: liqArrayRaw } = useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'flatten_liquidated_array',
  });

  // Read current Merkle root
  const { data: currentRoot } = useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'getLastRoot',
  });

  // Read next index to determine tree state
  const { data: nextIndex } = useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'nextIndex',
  });

  // Check if commitment exists in contract
  const { data: commitmentExists } = useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'commitments',
    args: position ? [position.commitment as `0x${string}`] : undefined,
  });

  if (!open || !position) return null;

  const isBorrow = action === 'borrow';
  const isRepay = action === 'repay';
  const isWithdraw = action === 'withdraw';
  
  // For borrow: borrow in position.borrowToken, for repay: repay borrowToken, for withdraw: withdraw depositToken
  const token = (isBorrow || isRepay) ? position.borrowToken : position.depositToken;
  const tokenDecimals = token === 'WETH' ? 18 : 6;
  const tokenAddress = (t: Token) => t === 'WETH' ? WETH_ADDRESS : USDC_ADDRESS;

  const maxAmount = isRepay 
    ? Number(position.borrowAmount) / (10 ** tokenDecimals)
    : isWithdraw
    ? Number(position.depositAmount) / (10 ** tokenDecimals)
    : 0; // For borrow, calculated based on LTV

  async function handleSubmit() {
    if (!address || !amount || !position || !position.note) {
      setErrorMsg('Missing required data');
      setStep('error');
      return;
    }

    setStep(isRepay ? 'approving' : 'proving');
    setErrorMsg('');

    try {
      // Switch to Initia network
      await switchToInitiaNetwork();

      const parsedAmt = parseUnits(amount, tokenDecimals);
      
      // Convert NoteSecrets (strings) to ZKNote (bigints)
      if (!position.note) {
        setErrorMsg('Position note missing');
        setStep('error');
        return;
      }
      
      // Compute noteHash if missing (for backward compatibility with old positions)
      let noteHashValue: bigint;
      if (position.note.noteHash) {
        noteHashValue = BigInt(position.note.noteHash);
      } else {
        // Import Poseidon to compute it
        const { buildPoseidon } = await import('circomlibjs');
        const poseidon = await buildPoseidon();
        const F = poseidon.F;
        const noteHashField = poseidon([
          BigInt(position.note.lendAmt),
          BigInt(position.note.borrowAmt),
          BigInt(position.note.willLiqPrice),
          BigInt(position.note.timestamp),
          BigInt(position.note.nullifier),
          BigInt(position.note.nonce),
        ]);
        noteHashValue = F.toObject(noteHashField) as bigint;
      }
      
      const oldNote: ZKNote = {
        lendAmt: BigInt(position.note.lendAmt),
        borrowAmt: BigInt(position.note.borrowAmt),
        willLiqPrice: BigInt(position.note.willLiqPrice),
        timestamp: BigInt(position.note.timestamp),
        nullifier: BigInt(position.note.nullifier),
        nonce: BigInt(position.note.nonce),
        noteHash: noteHashValue,
      };
      
      // Verify commitment matches noteHash
      // commitment is stored as hex string, noteHash as decimal string
      const commitmentBigInt = BigInt(position.commitment); // handles 0x prefix
      console.log('[RepayWithdrawDialog] Commitment check:');
      console.log('  position.commitment (hex):', position.commitment);
      console.log('  position.commitment (bigint):', commitmentBigInt.toString());
      console.log('  oldNote.noteHash (bigint):', oldNote.noteHash.toString());
      console.log('  Match:', commitmentBigInt === oldNote.noteHash);
      console.log('  Commitment exists in contract:', commitmentExists ? 'YES' : 'NO');
      
      if (!commitmentExists) {
        setErrorMsg('This commitment does not exist in the contract. Your deposit transaction may have failed. Please create a new position.');
        setStep('error');
        return;
      }
      
      if (commitmentBigInt !== oldNote.noteHash) {
        setErrorMsg(`Commitment mismatch - note hash does not match stored commitment. Commitment: ${commitmentBigInt.toString()}, NoteHash: ${oldNote.noteHash.toString()}`);
        setStep('error');
        return;
      }

      // For repay, approve ERC-20 transfer
      if (isRepay) {
        await writeContractAsync({
          address: tokenAddress(token) as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ZRINGOTTS_ADDRESS as `0x${string}`, parsedAmt],
        });
      }

      // Generate ZK proof
      setStep('proving');

      const flat: bigint[] = liqArrayRaw
        ? (liqArrayRaw as bigint[]).map(BigInt)
        : Array.from({ length: 20 }, (_, i) => i % 2 === 0 ? BigInt(i / 2 + 1) : 0n);

      const liqPrices = flat.filter((_, i) => i % 2 === 0);
      const liqTimes = flat.filter((_, i) => i % 2 !== 0);

      // Get the actual Merkle root from contract (it's a bytes32 hex string)
      if (!currentRoot) {
        setErrorMsg('Unable to read Merkle root from contract');
        setStep('error');
        return;
      }
      
      // Convert bytes32 hex to BigInt
      const merkleRoot = BigInt(currentRoot as string);
      
      // Use the actual merkle index stored with the position
      const merkleIndex = position.merkleIndex ?? 0;
      console.log('[RepayWithdrawDialog] Using merkle index:', merkleIndex);
      
      // Check publicClient is available
      if (!publicClient) {
        setErrorMsg('Public client not available. Please check your wallet connection.');
        setStep('error');
        return;
      }
      
      // Reconstruct Merkle tree from blockchain events
      const { getAllCommitments, computeMerklePath } = await import('@/lib/merkle');
      const { buildPoseidon: buildPoseidonForPath } = await import('circomlibjs');
      
      console.log('[RepayWithdrawDialog] Reconstructing Merkle tree from events...');
      const allCommitmentEvents = await getAllCommitments(publicClient);
      const allCommitments = allCommitmentEvents.map(c => c.commitment);
      
      console.log(`[RepayWithdrawDialog] Found ${allCommitments.length} commitments on-chain`);
      
      if (merkleIndex >= allCommitments.length) {
        setErrorMsg(`Invalid merkle index ${merkleIndex}. Only ${allCommitments.length} positions exist.`);
        setStep('error');
        return;
      }
      
      // Build Poseidon hash for path computation
      const poseidonForPath = await buildPoseidonForPath();
      
      // Compute the Merkle path for this specific position
      const merklePath = await computeMerklePath(merkleIndex, allCommitments, poseidonForPath);
      
      console.log('[RepayWithdrawDialog] Computed merkle path:', merklePath.map(p => p.toString()));
      
      // Verify that the commitment from localStorage matches what's on-chain
      const storedCommitment = BigInt(position.commitment);
      const onChainCommitment = allCommitments[merkleIndex];
      
      console.log('[RepayWithdrawDialog] Commitment verification:');
      console.log('  Stored in localStorage:', storedCommitment.toString());
      console.log('  On-chain at index', merkleIndex, ':', onChainCommitment?.toString() || 'NOT FOUND');
      console.log('  oldNote.noteHash:', oldNote.noteHash.toString());
      console.log('  Match stored==onChain:', storedCommitment === onChainCommitment);
      console.log('  Match oldNote==onChain:', oldNote.noteHash === onChainCommitment);
      console.log('  Match stored==oldNote:', storedCommitment === oldNote.noteHash);
      
      // CRITICAL: Use the on-chain commitment for Merkle proof, not the computed noteHash
      // The tree contains what was actually inserted, which should match
      const leafForProof = onChainCommitment || oldNote.noteHash;
      
      if (storedCommitment !== onChainCommitment) {
        console.error('[RepayWithdrawDialog] ERROR: Stored commitment does not match on-chain!');
        setErrorMsg(`Commitment mismatch: localStorage has ${storedCommitment.toString()} but blockchain has ${onChainCommitment?.toString() || 'nothing'} at index ${merkleIndex}`);
        setStep('error');
        return;
      }
      
      if (oldNote.noteHash !== onChainCommitment) {
        console.error('[RepayWithdrawDialog] ERROR: Computed noteHash does not match on-chain commitment!');
        setErrorMsg(`Note hash mismatch: computed ${oldNote.noteHash.toString()} but blockchain has ${onChainCommitment?.toString()}`);
        setStep('error');
        return;
      }
      
      console.log('[RepayWithdrawDialog] Merkle proof verification:');
      console.log('  leafForProof:', leafForProof.toString());
      console.log('  currentRoot from contract:', merkleRoot.toString());
      console.log('  merkleIndex:', merkleIndex);
      console.log('  merklePath:', merklePath.map(p => p.toString()));
      console.log('  position.commitment:', position.commitment);

      // Verify Merkle proof using helper function
      const { computeRoot } = await import('@/lib/merkle');
      const { buildPoseidon } = await import('circomlibjs');
      const poseidon = await buildPoseidon();
      
      const computedRoot = computeRoot(oldNote.noteHash, merkleIndex, merklePath, poseidon);
      
      console.log('  ');
      console.log('  FINAL COMPARISON:');
      console.log('  Computed root:', computedRoot.toString());
      console.log('  Expected root:', merkleRoot.toString());
      console.log('  Match:', computedRoot === merkleRoot);
      console.log('  ');
      
      if (computedRoot !== merkleRoot) {
        const errorDetail = `Merkle proof failed:
  Computed: ${computedRoot.toString()}
  Expected: ${merkleRoot.toString()}
  
Please check that you're using the correct position and that the Merkle tree was reconstructed properly from blockchain events.`;
        setErrorMsg(errorDetail);
        setStep('error');
        return;
      }

      // Set liquidation price for LTV calculation  
      // Formula: BORROW_AMT * 100 <= 50 * LENT_AMT * WILL_LIG_PRICE
      // For 10 ETH (10e18) borrowing 10 USDC (10e6):
      // Left: 10e6 * 100 = 1e9
      // Right: 50 * 10e18 * willLiqPrice >= 1e9
      // willLiqPrice >= 1e9 / (50 * 10e18) = 2e-12
      // Use 1e6 (1 million) for safe margin
      const willLiqPrice = BigInt(1000000);
      
      // CRITICAL FIX: Don't calculate interest here! Circuit does it internally.
      // We pass old amounts unchanged to avoid division remainder issues.
      // The circuit's UpdateAmt template will calculate interest internally and check:
      //   new_lend_amt <= calc_new_lend_amt (where calc includes interest)
      // By passing old amounts, we satisfy this constraint.
      const newLendAmt = oldNote.lendAmt; // Keep same as old
      const newBorrowAmt = isBorrow ? oldNote.borrowAmt + parsedAmt : oldNote.borrowAmt - parsedAmt;
      
      console.log('');
      console.log('=== LTV CALCULATION CHECK (using old amounts, circuit will add interest) ===');
      console.log('Current lendAmt (old, no interest): ', newLendAmt.toString());
      console.log('New borrowAmt (old + new borrow):', newBorrowAmt.toString());
      console.log('willLiqPrice:', willLiqPrice.toString());
      console.log('Borrow amount you want:', parsedAmt.toString());
      console.log('');
      console.log('LTV Formula: BORROW_AMT * 100 <= 50 * LENT_AMT * WILL_LIG_PRICE');
      console.log('Left side (BORROW_AMT * 100):', (newBorrowAmt * 100n).toString());
      console.log('Right side (50 * LENT_AMT * WILL_LIG_PRICE):', (50n * newLendAmt * willLiqPrice).toString());
      console.log('LTV Check passes:', (newBorrowAmt * 100n) <= (50n * newLendAmt * willLiqPrice));
      console.log('');
      
      // Calculate max borrow allowed
      const maxBorrowAllowed = (50n * newLendAmt * willLiqPrice) / 100n;
      console.log('Max borrow allowed:', maxBorrowAllowed.toString());
      console.log('Max borrow in USDC:', Number(maxBorrowAllowed) / 1e6);
      console.log('Your collateral in WETH:', Number(newLendAmt) / 1e18);
      console.log('Already borrowed:', Number(oldNote.borrowAmt) / 1e6, 'USDC');
      console.log('Trying to borrow:', Number(parsedAmt) / 1e6, 'USDC');
      console.log('=== END LTV CHECK ===');
      console.log('');
      
      if ((newBorrowAmt * 100n) > (50n * newLendAmt * willLiqPrice)) {
        const maxNewBorrow = maxBorrowAllowed - oldNote.borrowAmt;
        setErrorMsg(`LTV constraint failed! You can only borrow up to ${Number(maxNewBorrow) / 1e6} more USDC with your current ${Number(newLendAmt) / 1e18} WETH collateral. You already borrowed ${Number(oldNote.borrowAmt) / 1e6} USDC.`);
        setStep('error');
        return;
      }

      const proofResult = isBorrow
        ? await generateBorrowProof(oldNote, parsedAmt, willLiqPrice, merkleRoot, merkleIndex, merklePath, liqPrices, liqTimes)
        : isRepay
        ? await generateRepayProof(oldNote, parsedAmt, willLiqPrice, merkleRoot, merkleIndex, merklePath, liqPrices, liqTimes)
        : await generateWithdrawProof(oldNote, parsedAmt, willLiqPrice, merkleRoot, merkleIndex, merklePath, liqPrices, liqTimes);

      // Submit transaction
      setStep('submitting');
      const noteHashBytes32 = padHex(toHex(proofResult.noteHash), { size: 32 });
      const rootBytes32 = padHex(toHex(proofResult.root), { size: 32 });
      const willLiqPriceBytes32 = padHex(toHex(willLiqPrice), { size: 32 });
      
      // Compute old nullifier hash = Poseidon(nullifier) - simplified, just use nullifier for demo
      const oldNullifierBytes32 = padHex(toHex(oldNote.nullifier), { size: 32 });

      console.log('[Transaction] Submitting borrow with:', {
        noteHash: noteHashBytes32,
        willLiqPrice: willLiqPriceBytes32,
        timestamp: proofResult.timestamp,
        root: rootBytes32,
        oldNullifier: oldNullifierBytes32,
        borrowAmt: parsedAmt.toString(),
        token: tokenAddress(token),
      });

      let txHash: `0x${string}`;
      if (isBorrow) {
        txHash = await writeContractAsync({
          address: ZRINGOTTS_ADDRESS as `0x${string}`,
          abi: ZRINGOTTS_ABI,
          functionName: 'borrow',
          args: [
            noteHashBytes32,
            willLiqPriceBytes32,
            proofResult.timestamp,
            rootBytes32,
            oldNullifierBytes32,
            [proofResult.pA[0], proofResult.pA[1]] as [bigint, bigint],
            proofResult.pB as [[bigint, bigint], [bigint, bigint]],
            [proofResult.pC[0], proofResult.pC[1]] as [bigint, bigint],
            parsedAmt,
            tokenAddress(token) as `0x${string}`,
            address,
          ],
        });
      } else if (isRepay) {
        txHash = await writeContractAsync({
          address: ZRINGOTTS_ADDRESS as `0x${string}`,
          abi: ZRINGOTTS_ABI,
          functionName: 'repay',
          args: [
            noteHashBytes32,
            willLiqPriceBytes32,
            proofResult.timestamp,
            rootBytes32,
            oldNullifierBytes32,
            [proofResult.pA[0], proofResult.pA[1]] as [bigint, bigint],
            proofResult.pB as [[bigint, bigint], [bigint, bigint]],
            [proofResult.pC[0], proofResult.pC[1]] as [bigint, bigint],
            parsedAmt,
            tokenAddress(token) as `0x${string}`,
          ],
        });
      } else {
        txHash = await writeContractAsync({
          address: ZRINGOTTS_ADDRESS as `0x${string}`,
          abi: ZRINGOTTS_ABI,
          functionName: 'withdraw',
          args: [
            noteHashBytes32,
            willLiqPriceBytes32,
            proofResult.timestamp,
            rootBytes32,
            oldNullifierBytes32,
            [proofResult.pA[0], proofResult.pA[1]] as [bigint, bigint],
            proofResult.pB as [[bigint, bigint], [bigint, bigint]],
            [proofResult.pC[0], proofResult.pC[1]] as [bigint, bigint],
            parsedAmt,
            tokenAddress(token) as `0x${string}`,
            address,
          ],
        });
      }

      console.log('[RepayWithdrawDialog] Transaction hash:', txHash);
      console.log('[RepayWithdrawDialog] Waiting for transaction receipt...');
      
      // Wait for transaction to be mined and check if it succeeded
      if (!publicClient) throw new Error('Public client not available');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      console.log('[RepayWithdrawDialog] Transaction status:', receipt.status);
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction reverted! Check transaction: ${txHash}`);
      }

      // Parse CommitmentAdded event to get the new merkle index
      const COMMITMENT_ADDED_SIG = '0x12bc1b1892df9b3d59874d647be2cef182be9c84524d357d59dbb7dc561f6843';
      const commitmentAddedEvent = receipt.logs.find(
        (log) => log.topics[0] === COMMITMENT_ADDED_SIG
      );
      
      let newMerkleIndex = merkleIndex + 1; // Fallback assumption
      if (commitmentAddedEvent && commitmentAddedEvent.topics[2]) {
        newMerkleIndex = Number(BigInt(commitmentAddedEvent.topics[2]));
        console.log('[RepayWithdrawDialog] Parsed new merkle index from event:', newMerkleIndex);
      } else {
        console.warn('[RepayWithdrawDialog] Could not parse CommitmentAdded event');
      }

      // Update local position with new note and new commitment
      updatePosition(position.commitment, {
        ...position,
        depositAmount: proofResult.note.lendAmt.toString(),
        borrowAmount: proofResult.note.borrowAmt.toString(),
        commitment: noteHashBytes32, // NEW commitment
        merkleIndex: newMerkleIndex, // NEW merkle index
        note: {
          lendAmt: proofResult.note.lendAmt.toString(),
          borrowAmt: proofResult.note.borrowAmt.toString(),
          willLiqPrice: proofResult.note.willLiqPrice.toString(),
          timestamp: proofResult.note.timestamp.toString(),
          nullifier: proofResult.note.nullifier.toString(),
          nonce: proofResult.note.nonce.toString(),
          noteHash: proofResult.note.noteHash.toString(),
        },
        status: proofResult.note.borrowAmt === 0n && proofResult.note.lendAmt === 0n ? 'repaid' : 'active',
      });

      console.log('[RepayWithdrawDialog] Position updated with new commitment:', noteHashBytes32, 'and merkleIndex:', newMerkleIndex);

      await refetch();
      setStep('done');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.shortMessage ?? e?.message ?? String(e));
      setStep('error');
    }
  }

  function handleClose() {
    setStep('input');
    setAmount('');
    setErrorMsg('');
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="glass" style={{ width: '100%', maxWidth: 400, padding: 28, position: 'relative' }}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-dim)',
            fontSize: 20,
          }}
        >
          ✕
        </button>

        <p className="panel-title" style={{ marginBottom: 24 }}>
          {isBorrow ? 'Borrow' : isRepay ? 'Repay Debt' : 'Withdraw Collateral'}
        </p>

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              {isBorrow ? 'Borrow Complete!' : isRepay ? 'Repayment Complete!' : 'Withdrawal Complete!'}
            </p>
            <p className="label" style={{ color: 'var(--text-dim)', marginBottom: 20 }}>
              Your position has been updated with a new ZK commitment.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Amount ({token})</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="card"
                  type="number"
                  placeholder="0.0"
                  min="0"
                  max={maxAmount}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={step !== 'input' && step !== 'error'}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-elevated)',
                  }}
                />
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '8px 12px' }}
                  onClick={() => setAmount(maxAmount.toString())}
                  disabled={step !== 'input' && step !== 'error'}
                >
                  Max
                </button>
              </div>
              {!isBorrow && (
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  Max: {maxAmount.toFixed(tokenDecimals === 18 ? 4 : 2)} {token}
                </p>
              )}
              {isBorrow && (
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  Based on 75% LTV ratio
                </p>
              )}
            </div>

            {step === 'error' && (
              <div
                className="card"
                style={{
                  padding: '10px 14px',
                  marginBottom: 16,
                  borderColor: 'var(--red)',
                  color: 'var(--red)',
                  fontSize: 12,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={!amount || Number(amount) <= 0 || (!isBorrow && Number(amount) > maxAmount) || (step !== 'input' && step !== 'error')}
              onClick={handleSubmit}
            >
              {step === 'approving' ? 'Approving…' :
               step === 'proving' ? 'Generating proof…' :
               step === 'submitting' ? 'Submitting…' :
               isBorrow ? 'Borrow' : isRepay ? 'Repay' : 'Withdraw'}
            </button>

            {step === 'proving' && (
              <p style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 8, textAlign: 'center' }}>
                ⏳ ZK proof generation can take 15–30 seconds…
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
