import { AnimatedNumberProps } from '@/components/shared/AnimatedNumber/AnimatedNumber.types';
import { formatNumber } from '@/lib/utils';
import { useLayoutEffect, useRef } from 'react';

const isFadeIn = (animation: Animation) =>
  'animationName' in animation && animation.animationName === 'fadeIn';

export function AnimatedNumber({
  value,
  duration = 900,
  shouldAnimate = true,
}: AnimatedNumberProps) {
  const element = useRef<HTMLSpanElement>(null);
  const displayed = useRef(0);
  const initialAnimation = useRef(true);
  const formatted = formatNumber(value);

  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | undefined;
    const update = (next: number) => {
      displayed.current = next;
      const text = formatNumber(next);
      if (node.textContent !== text) node.textContent = text;
    };
    const finish = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      update(value);
      initialAnimation.current = false;
    };
    const onMotionChange = () => {
      if (motion.matches) finish();
    };

    if (!shouldAnimate || motion.matches || duration <= 0 || displayed.current === value) {
      finish();
      return;
    }

    const from = displayed.current;
    // Start with the entrance fade, preserving the original count-up easing.
    const entrance = node.closest<HTMLElement>('.fade-in');
    const delay = initialAnimation.current ? Number(entrance?.dataset.fadeDelay ?? 0) : 0;
    const syncEntrance = initialAnimation.current && entrance !== null;
    let start = performance.now() + delay;
    let entranceStarted = false;
    update(from);
    const animate = (now: number) => {
      const fade = syncEntrance ? entrance.getAnimations?.().find(isFadeIn) : undefined;
      if (fade && !entranceStarted) {
        if (fade.playState === 'paused' || typeof fade.currentTime !== 'number') {
          frame = requestAnimationFrame(animate);
          return;
        }
        start = now - fade.currentTime + delay;
        entranceStarted = true;
      }
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      update(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else initialAnimation.current = false;
    };
    frame = requestAnimationFrame(animate);
    motion.addEventListener('change', onMotionChange);

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      motion.removeEventListener('change', onMotionChange);
    };
  }, [value, duration, shouldAnimate]);

  return (
    <>
      <span ref={element} aria-hidden="true">
        {formatted}
      </span>
      <span className="sr-only">{formatted}</span>
    </>
  );
}
