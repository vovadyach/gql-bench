import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FadeIn } from './FadeIn';

describe('FadeIn', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('holds the fade until hydration so counters start with it', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { container } = render(<FadeIn delay={250}>content</FadeIn>);
    const fade = container.querySelector<HTMLElement>('.fade-in');
    expect(fade?.style.animationPlayState).toBe('paused');
    expect(fade?.dataset.fadeDelay).toBe('250');
    act(() => frames.forEach((frame) => frame(0)));
    expect(fade?.style.animationPlayState).toBe('running');
  });

  it('starts immediate fades at first paint', () => {
    // The header uses this so first paint never waits for JS (fast LCP)
    const { container } = render(<FadeIn immediate>content</FadeIn>);
    const fade = container.querySelector<HTMLElement>('.fade-in');
    expect(fade?.style.animationPlayState).toBe('');
  });
});
