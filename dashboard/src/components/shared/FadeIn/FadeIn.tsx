'use client';

import { FadeInProps } from '@/components/shared/FadeIn/FadeIn.types';

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <div className="fade-in" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
