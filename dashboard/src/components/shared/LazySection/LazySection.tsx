import { Suspense, useEffect, useRef, useState } from 'react';
import { LazySectionProps } from '@/components/shared/LazySection/LazySection.types';
import { FadeIn } from '@/components/shared/FadeIn/FadeIn';
import { SectionSkeleton } from '@/components/shared/SectionSkeleton/SectionSkeleton';

export function LazySection({ children, height = 'min-h-[310px]', skeleton }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number;

    // Near the viewport? Begin loading on the next frame.
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

  const fallback = skeleton ?? <SectionSkeleton height={height} />;

  return (
    <div ref={ref} className="mb-6">
      {isVisible ? (
        <Suspense fallback={fallback}>
          <FadeIn>{children}</FadeIn>
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
