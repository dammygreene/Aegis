import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aegis — Autonomous Liquidity & Risk Agent',
  description: 'AI agent managing liquidity across Uniswap V4 & Definitive Flash, authorized via Dynamic server wallets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080c14] text-[#f8fafc] antialiased">
        {children}
      </body>
    </html>
  );
}
