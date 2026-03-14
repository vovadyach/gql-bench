import { Header } from '@/components/layout/Header/Header';
import { mockMeta } from '@/components/layout/Header/Header.mocks';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Header', () => {
  it('renders title', () => {
    render(<Header meta={mockMeta} />);
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<Header meta={mockMeta} />);
    expect(screen.getByText('NestJS — Express vs Fastify vs Mercurius')).toBeInTheDocument();
  });

  it('renders machine info', () => {
    render(<Header meta={mockMeta} />);
    expect(screen.getByText('Apple M1 Max · 10 cores')).toBeInTheDocument();
  });

  it('renders methodology button', () => {
    render(<Header meta={mockMeta} />);
    expect(screen.getByText('◎ Methodology')).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(<Header meta={mockMeta} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
