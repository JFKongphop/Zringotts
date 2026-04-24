'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { NewPositionDialog } from './NewPositionDialog';
import { RepayWithdrawDialog } from './RepayWithdrawDialog';
import { usePositionStore, Position } from '@/hooks/usePositionStore';
import { formatBalance } from '@/lib/utils';

export function PositionSection() {
  const { isConnected } = useAccount();
  const { positions, clearPositions } = usePositionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; position: Position | null; action: 'borrow' | 'repay' | 'withdraw' }>({
    open: false,
    position: null,
    action: 'repay',
  });

  if (!isConnected) {
    return (
      <div className="glass" style={{ padding: 24 }}>
        <p className="panel-title">Your Positions</p>
        <p className="label" style={{ color: 'var(--text-dim)', marginTop: 12 }}>
          Connect wallet to view positions
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p className="panel-title" style={{ marginBottom: 0 }}>Your Positions</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn-ghost" 
              style={{ fontSize: 13, padding: '8px 12px', color: 'var(--danger)' }} 
              onClick={() => {
                if (confirm('Clear all position data from localStorage?')) {
                  clearPositions();
                }
              }}
              title="Clear all positions from localStorage"
            >
              🗑️
            </button>
            <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => setDialogOpen(true)}>
              + New Position
            </button>
          </div>
        </div>

        {positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <p className="label" style={{ color: 'var(--text-dim)', marginBottom: 16 }}>
              No positions yet. Deposit collateral to get started.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setDialogOpen(true)}>
                Open First Position
              </button>
              <button 
                className="btn-ghost" 
                style={{ fontSize: 13, color: 'var(--danger)' }} 
                onClick={() => {
                  if (confirm('Clear all position data from localStorage?')) {
                    clearPositions();
                  }
                }}
              >
                🗑️ Clear Positions
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {positions.map((pos, i) => (
              <PositionCard
                key={i}
                position={pos}
                index={i}
                onBorrow={() => setActionDialog({ open: true, position: pos, action: 'borrow' })}
                onRepay={() => setActionDialog({ open: true, position: pos, action: 'repay' })}
                onWithdraw={() => setActionDialog({ open: true, position: pos, action: 'withdraw' })}
              />
            ))}
          </div>
        )}
      </div>

      <NewPositionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <RepayWithdrawDialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, position: null, action: 'repay' })}
        position={actionDialog.position}
        action={actionDialog.action}
      />
    </>
  );
}

function PositionCard({
  position,
  index,
  onBorrow,
  onRepay,
  onWithdraw,
}: {
  position: Position;
  index: number;
  onBorrow: () => void;
  onRepay: () => void;
  onWithdraw: () => void;
}) {
  const depositDecimals = position.depositToken === 'WETH' ? 18 : 6;
  const healthRatio = (() => {
    const depositVal = position.depositToken === 'WETH'
      ? (Number(position.depositAmount) / 1e18) * 2250
      : (Number(position.depositAmount) / 1e6);
    const borrowVal = position.borrowToken === 'WETH'
      ? (Number(position.borrowAmount) / 1e18) * 2250
      : (Number(position.borrowAmount) / 1e6);
    return borrowVal > 0 ? (depositVal * 0.75) / borrowVal : Infinity;
  })();

  const healthColor = healthRatio >= 1.5 ? 'var(--green)'
    : healthRatio >= 1.1 ? '#FFD60A'
    : 'var(--red)';

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="label" style={{ marginBottom: 4, display: 'block' }}>Position #{index + 1}</span>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Deposit: </span>
            <span className="mono">{formatBalance(BigInt(position.depositAmount), depositDecimals)} {position.depositToken}</span>
          </div>
          <div style={{ fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>Borrow: </span>
            <span className="mono">
              {position.borrowAmount === '0' ? 'None' : `${formatBalance(BigInt(position.borrowAmount), position.borrowToken === 'WETH' ? 18 : 6)} ${position.borrowToken}`}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>Health</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: healthColor, fontFamily: 'var(--font-mono)' }}>
            {healthRatio === Infinity ? '∞' : healthRatio.toFixed(2)}
          </div>
          <div style={{ marginTop: 8 }}>
            <span className={`tag ${position.status === 'active' ? 'tag-green' : 'tag-gray'}`}>
              {position.status}
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Commitment: {position.commitment.slice(0, 16)}…
          </span>
          {position.status === 'active' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={onBorrow}
              >
                Borrow
              </button>
              {Number(position.borrowAmount) > 0 && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={onRepay}
                >
                  Repay
                </button>
              )}
              {Number(position.depositAmount) > 0 && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={onWithdraw}
                >
                  Withdraw
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

