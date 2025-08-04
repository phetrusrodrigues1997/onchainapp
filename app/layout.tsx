import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Foresight - Survival of the Brightest',
  description: 'Focused on building the best stablecoin products and services.',
  icons: {
    icon: '/favicon.jpg',
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