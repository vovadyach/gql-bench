'use client';

import { FadeInProps } from '@/components/shared/FadeIn/FadeIn.types';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function FadeIn({ children, delay = 0, onScroll = false }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!onScroll) {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(ref.current);
      return () => observer.disconnect();
    } else {
      // Page load: trigger after a frame so transition runs
      requestAnimationFrame(() => setVisible(true));
    }
  }, [onScroll]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
