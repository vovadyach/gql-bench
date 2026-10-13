import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { AnimatedNumber } from './AnimatedNumber';

describe('AnimatedNumber', () => {
  let reduced: boolean;
  let motionChange: (() => void) | undefined;
  let frames: Map<number, FrameRequestCallback>;
  let nextId: number;

  beforeEach(() => {
    reduced = false;
    frames = new Map();
    nextId = 0;
    motionChange = undefined;
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return reduced;
        },
        addEventListener: (_: string, listener: () => void) => {
          motionChange = listener;
        },
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.set(++nextId, callback);
        return nextId;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => frames.delete(id)),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function tick(time: number) {
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    });
  }

  it('counts up on initial load while exposing the final value to screen readers', () => {
    const { container } = render(<AnimatedNumber value={1000} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent(/^0$/);
    expect(container.querySelector('.sr-only')).toHaveTextContent('1,000');
    tick(450);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('875');
    tick(900);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('1,000');
    expect(frames.size).toBe(0);
  });

  it('runs the initial count-up during the delayed entrance fade', () => {
    const { container } = render(
      <div className="fade-in" data-fade-delay="250">
        <AnimatedNumber value={1000} />
      </div>,
    );
    const number = container.querySelector('[aria-hidden]');
    tick(250);
    expect(number).toHaveTextContent(/^0$/);
    tick(700);
    expect(number).toHaveTextContent('875');
    tick(1150);
    expect(number).toHaveTextContent('1,000');
    expect(frames.size).toBe(0);
  });

  it('tracks the real CSS fade even when its clock differs from JavaScript', () => {
    let currentTime: number | null = null;
    const { container } = render(
      <div
        className="fade-in"
        ref={(node) => {
          if (node)
            node.getAnimations = () => [
              {
                animationName: 'fadeIn',
                get currentTime() {
                  return currentTime;
                },
              } as unknown as Animation,
            ];
        }}
      >
        <AnimatedNumber value={1000} />
      </div>,
    );
    const number = container.querySelector('[aria-hidden]');
    tick(2000);
    expect(number).toHaveTextContent(/^0$/);
    currentTime = 0;
    tick(2100);
    expect(number).toHaveTextContent(/^0$/);
    currentTime = 450;
    tick(2550);
    expect(number).toHaveTextContent('875');
    currentTime = 700; // CSS fade finished; the count-up completes its own easing.
    tick(3000);
    expect(number).toHaveTextContent('1,000');
    expect(frames.size).toBe(0);
  });

  it('animates profile or scenario value changes from the previous value over 900ms', () => {
    const { container, rerender } = render(<AnimatedNumber value={100} />);
    tick(900);
    rerender(<AnimatedNumber value={200} />);
    const number = container.querySelector('[aria-hidden]');
    expect(number).toHaveTextContent('100');
    expect(container.querySelector('.sr-only')).toHaveTextContent('200');
    tick(450);
    expect(number).toHaveTextContent('188');
    tick(900);
    expect(number).toHaveTextContent('200');
    expect(frames.size).toBe(0);
  });

  it('does not restart completed numbers when a server is toggled', () => {
    const { container, rerender } = render(<AnimatedNumber value={1000} />);
    tick(900);
    rerender(<AnimatedNumber value={1000} shouldAnimate={false} />);
    expect(frames.size).toBe(0);
    rerender(<AnimatedNumber value={1000} shouldAnimate />);
    expect(frames.size).toBe(0);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('1,000');
  });

  it('updates disabled numbers immediately, including zero', () => {
    const { container, rerender } = render(<AnimatedNumber value={100} shouldAnimate={false} />);
    rerender(<AnimatedNumber value={0} shouldAnimate={false} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent(/^0$/);
    expect(frames.size).toBe(0);
  });

  it('skips animation for reduced motion', () => {
    reduced = true;
    const { container, rerender } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={200} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('200');
    expect(frames.size).toBe(0);
  });

  it('finishes an active animation when reduced motion is enabled', () => {
    const { container, rerender } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={200} />);
    act(() => {
      reduced = true;
      motionChange?.();
    });
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('200');
    expect(frames.size).toBe(0);
  });

  it('cancels pending animation when disabled or unmounted', () => {
    const { container, rerender, unmount } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={200} />);
    rerender(<AnimatedNumber value={300} shouldAnimate={false} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('300');
    expect(frames.size).toBe(0);
    rerender(<AnimatedNumber value={400} />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });

  it('handles zero duration without scheduling animation', () => {
    const { container, rerender } = render(<AnimatedNumber value={100} duration={0} />);
    rerender(<AnimatedNumber value={200} duration={0} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('200');
    expect(frames.size).toBe(0);
  });

  it('formats with a fixed locale so prerendered and hydrated text match', () => {
    const toLocaleString = Number.prototype.toLocaleString;
    vi.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (
      this: number,
      locales?: Intl.LocalesArgument,
      options?: Intl.NumberFormatOptions,
    ) {
      return toLocaleString.call(this, locales ?? 'de-DE', options);
    });
    const { container } = render(<AnimatedNumber value={4785} shouldAnimate={false} />);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('4,785');
    expect(container.querySelector('.sr-only')).toHaveTextContent('4,785');
  });

  it('uses the duration prop for the initial count-up', () => {
    const { container } = render(<AnimatedNumber value={1000} duration={300} />);
    tick(150);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('875');
    tick(300);
    expect(container.querySelector('[aria-hidden]')).toHaveTextContent('1,000');
    expect(frames.size).toBe(0);
  });
});
