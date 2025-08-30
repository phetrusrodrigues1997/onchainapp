import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: 'PrediWin.com - Predict, Win, Repeat',
  description: 'Focused on building the best prediction market services.',
  icons: {
    icon: '/favicon.jpg',
  },
  themeColor: '#ffffff', // <-- this controls the status bar color
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default', // try "black-translucent" or "white-translucent"
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