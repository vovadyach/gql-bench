import { AnimatedNumberProps } from '@/components/shared/AnimatedNumber/AnimatedNumber.types';
import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({ value, duration = 900 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current !== null) {
        cancelAnimationFrame(ref.current);
      }
    };
  }, [value, duration]);

  return <>{Math.round(display).toLocaleString()}</>;
}
