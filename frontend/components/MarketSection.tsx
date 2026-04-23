'use client';

import { useContractState } from '@/hooks/useContractState';
import { usePrices } from '@/hooks/useOraclePrice';
import { formatUsd, formatAmount } from '@/lib/utils';
import { currencies } from '@/lib/contracts';

export function MarketSection() {
  const { data, isLoading } = useContractState();
  const { ETH, USDC, isLive } = usePrices();

  const wethDeposit = data ? Number(data.weth_deposit_amount) : 0;
  const wethBorrow  = data ? Number(data.weth_borrow_amount)  : 0;
  const usdcDeposit = data ? Number(data.usdc_deposit_amount) : 0;
  const usdcBorrow  = data ? Number(data.usdc_borrow_amount)  : 0;

  // Use oracle prices
  const ETH_PRICE  = ETH;
  const USDC_PRICE = USDC;

  const wethDepositUsd = (wethDeposit / 1e18) * ETH_PRICE;
  const wethBorrowUsd  = (wethBorrow  / 1e18) * ETH_PRICE;
  const usdcDepositUsd = (usdcDeposit / 1e6)  * USDC_PRICE;
  const usdcBorrowUsd  = (usdcBorrow  / 1e6)  * USDC_PRICE;

  const totalDeposits = wethDepositUsd + usdcDepositUsd;
  const totalBorrowed = wethBorrowUsd  + usdcBorrowUsd;
  const tvl           = totalDeposits - totalBorrowed;

  const assets = [
    {
      symbol: 'WETH',
      icon: currencies.weth.icon,
      deposit: wethDeposit / 1e18,
      borrow:  wethBorrow  / 1e18,
      depositUsd: wethDepositUsd,
      borrowUsd:  wethBorrowUsd,
      utilization: wethDeposit > 0 ? wethBorrow / wethDeposit : 0,
      decimals: 18,
    },
    {
      symbol: 'USDC',
      icon: currencies.usdc.icon,
      deposit: usdcDeposit / 1e6,
      borrow:  usdcBorrow  / 1e6,
      depositUsd: usdcDepositUsd,
      borrowUsd:  usdcBorrowUsd,
      utilization: usdcDeposit > 0 ? usdcBorrow / usdcDeposit : 0,
      decimals: 6,
    },
  ];

  // Calculate APY based on utilization (simple linear model)
  // Base rate: 2%, Slope: 10% at 80% utilization
  const calculateAPY = (utilization: number): number => {
    const baseRate = 2; // 2%
    const optimalUtil = 0.8;
    const slope = 10 / optimalUtil; // 12.5% per utilization point
    
    if (utilization <= optimalUtil) {
      return baseRate + (slope * utilization);
    } else {
      // Steep increase after optimal utilization
      const excessUtil = utilization - optimalUtil;
      return baseRate + (slope * optimalUtil) + (excessUtil * 50); // 50% per excess point
    }
  };

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="panel-title" style={{ marginBottom: 0 }}>Main Market</p>
        {!isLive && (
          <span style={{ fontSize: 11, color: 'var(--yellow)' }} title="Oracle not configured, using fallback prices">
            ⚠️ Demo Prices
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Deposits', value: formatUsd(totalDeposits) },
          { label: 'Total Borrowed', value: formatUsd(totalBorrowed) },
          { label: 'TVL', value: formatUsd(tvl) },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div className="label" style={{ marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {isLoading ? '—' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Asset table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Deposits</th>
              <th>Borrowed</th>
              <th>Utilization</th>
              <th>APY</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.symbol}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.icon} alt={a.symbol} width={28} height={28} style={{ borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{a.symbol}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {isLoading ? '—' : a.deposit.toFixed(4)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {isLoading ? '' : formatUsd(a.depositUsd)}
                  </div>
                </td>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {isLoading ? '—' : a.borrow.toFixed(4)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {isLoading ? '' : formatUsd(a.borrowUsd)}
                  </div>
                </td>
                <td>
                  {isLoading ? '—' : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, maxWidth: 80 }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(a.utilization * 100, 100)}%`,
                          background: a.utilization > 0.8 ? 'var(--red)' : 'var(--green)',
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {(a.utilization * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {isLoading ? '—' : (
                    <span className={`tag ${calculateAPY(a.utilization) < 5 ? 'tag-green' : calculateAPY(a.utilization) < 15 ? '' : 'tag-red'}`}>
                      {calculateAPY(a.utilization).toFixed(2)}% APY
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
