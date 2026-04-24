'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useInterwovenKit } from '@initia/interwovenkit-react';
import { shorten } from '@/lib/utils';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected } = useAccount();
  const { disconnect }           = useDisconnect();
  const { openWallet, openConnect } = useInterwovenKit();

  return (
    <nav className="nav-pill">
      <span className="nav-brand">⚡ Zringotts</span>
      <div className="nav-sep" />
      <Link href="/"       className="nav-link">Market</Link>
      <Link href="/bridge" className="nav-link">Bridge</Link>
      <div className="nav-sep" />

      {mounted && (
        isConnected && address ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              style={{
                fontSize: 12, color: 'var(--text)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: 100, padding: '5px 12px',
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
              onClick={() => openWallet()}
            >
              {shorten(address)}
            </button>
            <button
              style={{
                fontSize: 11, color: 'var(--text-dim)',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 100, padding: '4px 10px',
                cursor: 'pointer',
              }}
              onClick={() => disconnect()}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            style={{
              fontSize: 12, color: '#111111',
              background: '#ffffff', border: 'none',
              borderRadius: 100, padding: '5px 14px',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500,
            }}
            onClick={() => openConnect()}
          >
            Connect
          </button>
        )
      )}
    </nav>
  );
}
