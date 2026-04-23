'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, toHex, padHex } from 'viem';
import { WETH_ADDRESS, USDC_ADDRESS, ZRINGOTTS_ADDRESS, ERC20_ABI, ZRINGOTTS_ABI } from '@/lib/contracts';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { usePositionStore, Position } from '@/hooks/usePositionStore';
import { generateRepayProof, generateWithdrawProof, ZKNote, INITIAL_ROOT } from '@/lib/zkproof';

interface Props {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  action: 'repay' | 'withdraw';
}

type Token = 'WETH' | 'USDC';

export function RepayWithdrawDialog({ open, onClose, position, action }: Props) {
  const { address } = useAccount();
  const { refetch } = useTokenBalances();
  const { updatePosition } = usePositionStore();
  const { writeContractAsync } = useWriteContract();

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

  if (!open || !position) return null;

  const isRepay = action === 'repay';
  const token = isRepay ? position.borrowToken : position.depositToken;
  const tokenDecimals = token === 'WETH' ? 18 : 6;
  const tokenAddress = (t: Token) => t === 'WETH' ? WETH_ADDRESS : USDC_ADDRESS;

  const maxAmount = isRepay 
    ? Number(position.borrowAmount) / (10 ** tokenDecimals)
    : Number(position.depositAmount) / (10 ** tokenDecimals);

  async function handleSubmit() {
    if (!address || !amount || !position.note) {
      setErrorMsg('Missing required data');
      setStep('error');
      return;
    }

    setStep(isRepay ? 'approving' : 'proving');
    setErrorMsg('');

    try {
      const parsedAmt = parseUnits(amount, tokenDecimals);
      const oldNote = position.note as unknown as ZKNote;

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

      // Simplified: assume position is at index 0 with empty sibling path
      // In production, you'd track actual merkle indices and compute paths
      const merkleRoot = currentRoot ? BigInt(currentRoot as string) : INITIAL_ROOT;
      const merkleIndex = 0;
      const merklePath = [0n, BigInt('14744269619966411208579211824598458697587494354926760081771325075741142829156')];

      // Calculate new liquidation price (keep same or 0 if no remaining debt)
      const willLiqPrice = 0n; // Simplified: use 0 (will be validated by oracle within 20% tolerance)

      const proofResult = isRepay
        ? await generateRepayProof(oldNote, parsedAmt, willLiqPrice, merkleRoot, merkleIndex, merklePath, liqPrices, liqTimes)
        : await generateWithdrawProof(oldNote, parsedAmt, willLiqPrice, merkleRoot, merkleIndex, merklePath, liqPrices, liqTimes);

      // Submit transaction
      setStep('submitting');
      const noteHashBytes32 = padHex(toHex(proofResult.noteHash), { size: 32 });
      const rootBytes32 = padHex(toHex(proofResult.root), { size: 32 });
      const willLiqPriceBytes32 = padHex(toHex(willLiqPrice), { size: 32 });
      
      // Compute old nullifier hash = Poseidon(nullifier) - simplified, just use nullifier for demo
      const oldNullifierBytes32 = padHex(toHex(oldNote.nullifier), { size: 32 });

      if (isRepay) {
        await writeContractAsync({
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
        await writeContractAsync({
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

      // Update local position with new note
      updatePosition(position.commitment, {
        ...position,
        depositAmount: proofResult.note.lendAmt.toString(),
        borrowAmount: proofResult.note.borrowAmt.toString(),
        commitment: noteHashBytes32,
        note: {
          lendAmt: proofResult.note.lendAmt.toString(),
          borrowAmt: proofResult.note.borrowAmt.toString(),
          willLiqPrice: proofResult.note.willLiqPrice.toString(),
          timestamp: proofResult.note.timestamp.toString(),
          nullifier: proofResult.note.nullifier.toString(),
          nonce: proofResult.note.nonce.toString(),
        },
        status: proofResult.note.borrowAmt === 0n && proofResult.note.lendAmt === 0n ? 'repaid' : 'active',
      });

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
          {isRepay ? 'Repay Debt' : 'Withdraw Collateral'}
        </p>

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              {isRepay ? 'Repayment Complete!' : 'Withdrawal Complete!'}
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
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                Max: {maxAmount.toFixed(tokenDecimals === 18 ? 4 : 2)} {token}
              </p>
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
              disabled={!amount || Number(amount) <= 0 || Number(amount) > maxAmount || (step !== 'input' && step !== 'error')}
              onClick={handleSubmit}
            >
              {step === 'approving' ? 'Approving…' :
               step === 'proving' ? 'Generating proof…' :
               step === 'submitting' ? 'Submitting…' :
               isRepay ? 'Repay' : 'Withdraw'}
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
