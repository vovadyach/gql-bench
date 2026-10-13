import { act, cleanup, render, screen } from '@testing-library/react';
import { lazy } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { LazySection } from './LazySection';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('keeps the same placeholder until the deferred module resolves', async () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  let resolve!: (module: { default: () => React.JSX.Element }) => void;
  const Chart = lazy(
    () =>
      new Promise<{ default: () => React.JSX.Element }>((done) => {
        resolve = done;
      }),
  );
  render(
    <LazySection skeleton={<div role="status">Loading chart</div>}>
      <Chart />
    </LazySection>,
  );
  expect(screen.getByRole('status')).toBeInTheDocument();
  await act(async () => {
    frames.shift()?.(0);
  });
  expect(screen.getByRole('status')).toHaveTextContent('Loading chart');
  await act(async () => {
    resolve({ default: () => <div>Loaded chart</div> });
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Loaded chart')).toBeInTheDocument();
});
