import { Header } from '@/components/layout/Header/Header';
import { mockMeta } from '@/components/layout/Header/Header.mocks';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Header', () => {
  const defaultProps = {
    meta: mockMeta,
    dark: true,
    showMethodology: false,
    onMethodologyToggle: vi.fn(),
    onThemeToggle: vi.fn(),
  };

  it('renders title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('NestJS — Express vs Fastify vs Mercurius')).toBeInTheDocument();
  });

  it('renders machine info', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Apple M1 Max · 10 cores')).toBeInTheDocument();
  });

  it('shows sun icon in dark mode', () => {
    render(<Header {...defaultProps} dark={true} />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('shows moon icon in light mode', () => {
    render(<Header {...defaultProps} dark={false} />);
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('calls onThemeToggle when theme button clicked', () => {
    const onThemeToggle = vi.fn();
    render(<Header {...defaultProps} onThemeToggle={onThemeToggle} />);
    fireEvent.click(screen.getByText('☀️'));
    expect(onThemeToggle).toHaveBeenCalledOnce();
  });

  it('shows Method button when methodology closed', () => {
    render(<Header {...defaultProps} showMethodology={false} />);
    expect(screen.getByText('◎ Method')).toBeInTheDocument();
  });

  it('shows Close button when methodology open', () => {
    render(<Header {...defaultProps} showMethodology={true} />);
    expect(screen.getByText('✕ Close')).toBeInTheDocument();
  });

  it('calls onMethodologyToggle when method button clicked', () => {
    const onMethodologyToggle = vi.fn();
    render(<Header {...defaultProps} onMethodologyToggle={onMethodologyToggle} />);
    fireEvent.click(screen.getByText('◎ Method'));
    expect(onMethodologyToggle).toHaveBeenCalledOnce();
  });
});
