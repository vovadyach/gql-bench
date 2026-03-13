'use client';

import { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
