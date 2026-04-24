'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, toHex, padHex } from 'viem';
import { WETH_ADDRESS, USDC_ADDRESS, ZRINGOTTS_ADDRESS, ERC20_ABI, ZRINGOTTS_ABI } from '@/lib/contracts';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { usePositionStore } from '@/hooks/usePositionStore';
import { generateDepositProof } from '@/lib/zkproof';
import { switchToInitiaNetwork } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Token = 'WETH' | 'USDC';

export function NewPositionDialog({ open, onClose }: Props) {
  const { address } = useAccount();
  const { weth, usdc, refetch } = useTokenBalances();
  const { addPosition } = usePositionStore();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [depositToken, setDepositToken] = useState<Token>('WETH');
  const [depositAmt, setDepositAmt] = useState('');
  const [borrowToken, setBorrowToken] = useState<Token>('USDC');
  const [borrowAmt, setBorrowAmt] = useState('');
  const [step, setStep] = useState<'input' | 'approving' | 'proving' | 'depositing' | 'done' | 'error'>('input');
  const [errorMsg, setErrorMsg] = useState('');

  // Read liquidation array from contract (needed for ZK proof inputs)
  const { data: liqArrayRaw } = useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'flatten_liquidated_array',
  });

  if (!open) return null;

  const depositDecimals = depositToken === 'WETH' ? 18 : 6;
  const tokenAddress    = (t: Token) => t === 'WETH' ? WETH_ADDRESS : USDC_ADDRESS;

  async function handleSubmit() {
    if (!address || !depositAmt) return;
    setStep('approving');
    setErrorMsg('');

    try {
      // 0. Switch to Initia network in MetaMask
      await switchToInitiaNetwork();

      const depositParsed = parseUnits(depositAmt, depositDecimals);

      // 1. Approve ERC-20 transfer
      await writeContractAsync({
        address: tokenAddress(depositToken) as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ZRINGOTTS_ADDRESS as `0x${string}`, depositParsed],
      });

      // 2. Generate ZK proof (Groth16, ~15-30 seconds in browser)
      setStep('proving');

      // Parse liquidation array: [price0, ts0, price1, ts1 ...] (20 elements)
      const flat: bigint[] = liqArrayRaw
        ? (liqArrayRaw as bigint[]).map(BigInt)
        : Array.from({ length: 20 }, (_, i) => i % 2 === 0 ? BigInt(i / 2 + 1) : 0n);

      const liqPrices = flat.filter((_, i) => i % 2 === 0);     // even indices
      const liqTimes  = flat.filter((_, i) => i % 2 !== 0);  // odd indices

      const proofResult = await generateDepositProof(depositParsed, liqPrices, liqTimes);

      // 3. Submit deposit transaction with real proof
      setStep('depositing');
      const noteHashBytes32 = padHex(toHex(proofResult.noteHash), { size: 32 });
      const rootBytes32     = padHex(toHex(proofResult.root), { size: 32 });
      const zeroBytes32     = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
      
      // willLiqPrice for deposit-only (no borrow yet) can be 0
      const willLiqPriceBytes32 = padHex(toHex(proofResult.note.willLiqPrice), { size: 32 });

      const txHash = await writeContractAsync({
        address: ZRINGOTTS_ADDRESS as `0x${string}`,
        abi: ZRINGOTTS_ABI,
        functionName: 'deposit',
        args: [
          noteHashBytes32,
          willLiqPriceBytes32,                      // _new_will_liq_price (0 for deposit-only)
          proofResult.timestamp,
          rootBytes32,
          zeroBytes32,                              // old_nullifier = 0 (fresh note)
          [proofResult.pA[0], proofResult.pA[1]] as [bigint, bigint],
          proofResult.pB as [[bigint, bigint], [bigint, bigint]],
          [proofResult.pC[0], proofResult.pC[1]] as [bigint, bigint],
          depositParsed,
          tokenAddress(depositToken) as `0x${string}`,
        ],
      });

      console.log('[NewPositionDialog] Transaction hash:', txHash);
      console.log('[NewPositionDialog] Waiting for transaction receipt...');
      
      // Wait for transaction to be mined and check if it succeeded
      if (!publicClient) throw new Error('Public client not available');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      console.log('[NewPositionDialog] Transaction receipt:', receipt);
      console.log('[NewPositionDialog] Transaction status:', receipt.status);
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction reverted! Check transaction: ${txHash}`);
      }

      // Parse CommitmentAdded event to get the merkle index
      // Event: CommitmentAdded(bytes32 indexed commitment, uint32 indexed leafIndex)
      const COMMITMENT_ADDED_SIG = '0x12bc1b1892df9b3d59874d647be2cef182be9c84524d357d59dbb7dc561f6843';
      const commitmentAddedEvent = receipt.logs.find(
        (log) => log.topics[0] === COMMITMENT_ADDED_SIG
      );
      
      // For CommitmentAdded(bytes32 indexed commitment, uint32 indexed leafIndex)
      // Topic 0: event signature
      // Topic 1: commitment (indexed)
      // Topic 2: leafIndex (indexed uint32, padded to bytes32)
      let merkleIndex = 0;
      if (commitmentAddedEvent && commitmentAddedEvent.topics[2]) {
        // Extract uint32 from indexed bytes32 topic
        merkleIndex = Number(BigInt(commitmentAddedEvent.topics[2]));
        console.log('[NewPositionDialog] Parsed merkle index from event:', merkleIndex);
      } else {
        console.warn('[NewPositionDialog] Could not parse CommitmentAdded event, using nextIndex from contract');
        // Fallback: query nextIndex-1 from contract
        const nextIdx = await publicClient.readContract({
          address: ZRINGOTTS_ADDRESS as `0x${string}`,
          abi: ZRINGOTTS_ABI,
          functionName: 'nextIndex',
        }) as number;
        merkleIndex = nextIdx - 1;
      }

      // 4. Store note locally (needed to spend it later)
      const commitment = noteHashBytes32;
      addPosition({
        depositToken,
        depositAmount: depositParsed.toString(),
        borrowToken,
        borrowAmount: '0',
        commitment,
        merkleIndex, // Store the actual Merkle tree index
        createdAt: Date.now(),
        status: 'active',
        note: {
          lendAmt:      proofResult.note.lendAmt.toString(),
          borrowAmt:    proofResult.note.borrowAmt.toString(),
          willLiqPrice: proofResult.note.willLiqPrice.toString(),
          timestamp:    proofResult.note.timestamp.toString(),
          nullifier:    proofResult.note.nullifier.toString(),
          nonce:        proofResult.note.nonce.toString(),
          noteHash:     proofResult.note.noteHash.toString(),
        },
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
    setDepositAmt('');
    setBorrowAmt('');
    setErrorMsg('');
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="glass" style={{ width: '100%', maxWidth: 440, padding: 28, position: 'relative' }}>
        {/* Close */}
        <button
          onClick={handleClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20 }}
        >✕</button>

        <p className="panel-title" style={{ marginBottom: 24 }}>New Position</p>

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Position Opened!</p>
            <p className="label" style={{ color: 'var(--text-dim)', marginBottom: 20 }}>
              Your ZK commitment has been recorded on-chain.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Deposit */}
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Deposit Collateral</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="card"
                  style={{ padding: '10px 12px', fontSize: 14, cursor: 'pointer', minWidth: 90, background: 'var(--bg-elevated)' }}
                  value={depositToken}
                  onChange={(e) => setDepositToken(e.target.value as Token)}
                  disabled={step !== 'input'}
                >
                  <option value="WETH">WETH</option>
                  <option value="USDC">USDC</option>
                </select>
                <input
                  className="card"
                  type="number"
                  placeholder="0.0"
                  min="0"
                  step="any"
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value)}
                  disabled={step !== 'input'}
                  style={{ flex: 1, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)' }}
                />
              </div>
            </div>

            {/* Borrow */}
            <div style={{ marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 8 }}>Borrow (optional)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="card"
                  style={{ padding: '10px 12px', fontSize: 14, cursor: 'pointer', minWidth: 90, background: 'var(--bg-elevated)' }}
                  value={borrowToken}
                  onChange={(e) => setBorrowToken(e.target.value as Token)}
                  disabled={step !== 'input'}
                >
                  <option value="USDC">USDC</option>
                  <option value="WETH">WETH</option>
                </select>
                <input
                  className="card"
                  type="number"
                  placeholder="0.0"
                  min="0"
                  step="any"
                  value={borrowAmt}
                  onChange={(e) => setBorrowAmt(e.target.value)}
                  disabled={step !== 'input'}
                  style={{ flex: 1, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)' }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                Max LTV: 75% • Liquidation: 80%
              </p>
            </div>

            {step === 'error' && (
              <div className="card" style={{ padding: '10px 14px', marginBottom: 16, borderColor: 'var(--red)', color: 'var(--red)', fontSize: 12 }}>
                {errorMsg}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={!depositAmt || (step !== 'input' && step !== 'error')}
              onClick={handleSubmit}
            >
              {step === 'approving'  ? 'Approving…'       :
               step === 'proving'    ? 'Generating proof…' :
               step === 'depositing' ? 'Depositing…'       : 'Open Position'}
            </button>

            {step === 'proving' && (
              <p style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 8, textAlign: 'center' }}>
                ⏳ ZK proof generation can take 15–30 seconds in the browser…
              </p>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10, textAlign: 'center' }}>
              A Groth16 ZK commitment is generated client-side and stored on-chain.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
