import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders without crashing', () => {
    render(<AnimatedNumber value={1000} />);
    expect(screen.getByText(/\d/)).toBeInTheDocument();
  });

  it('starts at 0', () => {
    render(<AnimatedNumber value={5000} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('reaches final value', async () => {
    vi.useFakeTimers();
    render(<AnimatedNumber value={1000} duration={100} />);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('1,000')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('updates when value changes', () => {
    const { rerender } = render(<AnimatedNumber value={100} />);
    rerender(<AnimatedNumber value={200} />);
    // Animation restarts with new target
    expect(screen.getByText(/\d/)).toBeInTheDocument();
  });

  it('handles zero', () => {
    render(<AnimatedNumber value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
