import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: 'Foresight - Survival of the Brightest',
  description: 'Focused on building the best prediction market services.',
  icons: {
    icon: '/logoF2_2_updated.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen w-full">
        <SpeedInsights />
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}