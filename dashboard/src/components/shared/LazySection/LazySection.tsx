import { useEffect, useRef, useState } from 'react';
import { LazySectionProps } from '@/components/shared/LazySection/LazySection.types';
import { SectionSkeleton } from '@/components/shared/SectionSkeleton/SectionSkeleton';

export function LazySection({ children, height = 'min-h-[320px]', skeleton }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number;

    // Already in viewport? Show immediately (with fade, no skeleton)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      rafId = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(rafId);
    }

    // Otherwise wait for scroll
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-6">
      {isVisible ? (
        <div className="fade-in">{children}</div>
      ) : (
        (skeleton ?? <SectionSkeleton height={height} />)
      )}
    </div>
  );
}
