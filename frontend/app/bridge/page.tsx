'use client';

import { useInterwovenKit } from '@initia/interwovenkit-react';
import { useEffect } from 'react';
import Link from 'next/link';

const bridgeDenom = process.env.NEXT_PUBLIC_INTERWOVEN_BRIDGE_DENOM ?? 'uinit';

export default function BridgePage() {
  const { openBridge } = useInterwovenKit();

  useEffect(() => {
    openBridge({ srcChainId: 'initiation-2', srcDenom: bridgeDenom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div className="glass" style={{ padding: '40px 48px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p className="label" style={{ marginBottom: 16 }}>Interwoven Bridge</p>
        <h2 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
          Bridge to evm-1
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
          Transfer INIT from Initia testnet (initiation-2) to Initia evm-1 before depositing into Zringotts.
        </p>

        {/* Steps */}
        <div style={{ textAlign: 'left', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', text: 'Connect your wallet above' },
            { step: '2', text: 'Click "Open Bridge" to bridge INIT from L1 → evm-1' },
            { step: '3', text: 'Return to the main market to deposit or borrow' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0,
              }}>{step}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{text}</span>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
          onClick={() => openBridge({ srcChainId: 'initiation-2', srcDenom: bridgeDenom })}
        >
          Open Bridge →
        </button>
        <Link href="/" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          ← Back to Market
        </Link>
      </div>
    </div>
  );
}
