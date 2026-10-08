import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GraphQL Bench — NestJS vs direct GraphQL servers',
  description:
    'Interactive k6 benchmark dashboard comparing NestJS with direct Express, Fastify and Node.js HTTP setups running Apollo, Mercurius and Yoga',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        {/* Fades wait for hydration; without JS, run them anyway */}
        <noscript>
          <style>{`.fade-in { animation-play-state: running !important; }`}</style>
        </noscript>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
