import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { Providers } from '@/app/providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GraphQL Bench — NestJS Express vs Fastify vs Mercurius',
  description: 'Interactive benchmark dashboard comparing NestJS GraphQL frameworks with real data',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
