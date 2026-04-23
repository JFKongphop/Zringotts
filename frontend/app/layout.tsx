import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Zringotts | ZK Lending on Initia',
  description: 'Privacy-preserving ZK lending protocol on Initia evm-1.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#111111', colorScheme: 'dark' }}>
      <body style={{ background: '#111111', color: '#ffffff' }}>
        <Providers>
          <Navbar />
          <main style={{ paddingTop: 72 }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
