'use client';

import { FadeInProps } from '@/components/shared/FadeIn/FadeIn.types';
import { useEffect, useRef } from 'react';

export function FadeIn({ children, delay = 0, immediate = false }: FadeInProps) {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (immediate) return;
    // Start after child effects have prepared their counters.
    const frame = requestAnimationFrame(() => {
      if (element.current) element.current.style.animationPlayState = 'running';
    });
    return () => cancelAnimationFrame(frame);
  }, [immediate]);

  return (
    <div
      ref={element}
      className="fade-in"
      data-fade-delay={delay}
      style={{ animationDelay: `${delay}ms`, animationPlayState: immediate ? undefined : 'paused' }}
    >
      {children}
    </div>
  );
}
