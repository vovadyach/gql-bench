'use client';

import { FadeInProps } from '@/components/shared/FadeIn/FadeIn.types';
import { useEffect, useRef, useState } from 'react';

export function FadeIn({ children, delay = 0, onScroll = false }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (onScroll) {
      // Scroll: use observer
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
      // Page load: trigger immediately
      requestAnimationFrame(() => setVisible(true));
    }
  }, [onScroll]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
