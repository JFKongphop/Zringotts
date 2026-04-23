'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useInterwovenKit } from '@initia/interwovenkit-react';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import {
  WETH_ADDRESS, USDC_ADDRESS, ZRINGOTTS_ADDRESS,
  ERC20_ABI, ZRINGOTTS_ABI,
} from '@/lib/contracts';
import { formatBalance, switchToInitiaNetwork } from '@/lib/utils';

const BRIDGE_DENOM = process.env.NEXT_PUBLIC_INTERWOVEN_BRIDGE_DENOM ?? 'uinit';

export function AccountSection() {
  const { address, isConnected } = useAccount();
  const { openBridge, openConnect } = useInterwovenKit();
  const { weth, usdc, refetch } = useTokenBalances();

  const [minting, setMinting] = useState<'weth' | 'usdc' | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { data: mintTx, isPending: mintPending } = useWaitForTransactionReceipt({ hash: undefined });

  async function handleMint(token: 'weth' | 'usdc') {
    if (!address) return;
    setMinting(token);
    try {
      // Switch to Initia network
      await switchToInitiaNetwork();
      
      const tokenAddress = token === 'weth' ? WETH_ADDRESS : USDC_ADDRESS;
      const amount = token === 'weth' ? parseUnits('1', 18) : parseUnits('1000', 6);
      await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address, amount],
      });
      await refetch();
    } catch (e) {
      console.error('Mint failed', e);
    } finally {
      setMinting(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="glass" style={{ padding: 24, textAlign: 'center' }}>
        <p className="panel-title" style={{ marginBottom: 16 }}>Account</p>
        <p className="label" style={{ marginBottom: 20 }}>Connect your wallet to view balances</p>
        <button className="btn-primary" style={{ width: '100%' }} onClick={openConnect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 24 }}>
      <p className="panel-title">Account</p>

      {/* Address */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label">Wallet</span>
        <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—'}
        </span>
      </div>

      {/* Balances */}
      <p className="label" style={{ marginBottom: 10 }}>Balances</p>
      {[
        { key: 'weth', label: 'WETH', value: weth, decimals: 18 },
        { key: 'usdc', label: 'USDC', value: usdc, decimals: 6 },
      ].map((b) => (
        <div key={b.key} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{b.label}</span>
            <span className="mono" style={{ fontSize: 14 }}>
              {b.value === undefined ? '—' : formatBalance(b.value, b.decimals)}
            </span>
          </div>
          <button
            className="btn-ghost"
            style={{ width: '100%', fontSize: 12, padding: '6px 0' }}
            disabled={minting === b.key}
            onClick={() => handleMint(b.key as 'weth' | 'usdc')}
          >
            {minting === b.key ? 'Minting…' : `Get test ${b.label}`}
          </button>
        </div>
      ))}

      {/* Bridge */}
      <div style={{ marginTop: 24 }}>
        <p className="label" style={{ marginBottom: 10 }}>Bridge</p>
        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={() => openBridge({ srcChainId: 'initiation-2', srcDenom: BRIDGE_DENOM })}
        >
          Bridge INIT → EVM-1
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, textAlign: 'center' }}>
          Powered by Interwoven Bridge
        </p>
      </div>
    </div>
  );
}
