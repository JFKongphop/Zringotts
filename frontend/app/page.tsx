'use client';

import { MarketSection } from '@/components/MarketSection';
import { AccountSection } from '@/components/AccountSection';
import { PositionSection } from '@/components/PositionSection';

export default function Home() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MarketSection />
          <PositionSection />
        </div>
        {/* Right column */}
        <AccountSection />
      </div>
    </div>
  );
}
