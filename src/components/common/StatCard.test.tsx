import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../../src/components/common/StatCard';

describe('StatCard', () => {
  const mockStats = {
    label: 'Total Jobs',
    value: '42',
    icon: '📊',
    trend: 12,
    trendLabel: 'vs last month',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stat card', () => {
    render(<StatCard {...mockStats} />);
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
  });

  it('should display stat value', () => {
    render(<StatCard {...mockStats} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display icon', () => {
    render(<StatCard {...mockStats} />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('should display positive trend', () => {
    render(<StatCard {...mockStats} />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('should display trend label', () => {
    render(<StatCard {...mockStats} />);
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
  });

  it('should handle negative trend', () => {
    const negTrendStats = { ...mockStats, trend: -5 };
    render(<StatCard {...negTrendStats} />);
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
  });

  it('should handle zero trend', () => {
    const zeroTrendStats = { ...mockStats, trend: 0 };
    render(<StatCard {...zeroTrendStats} />);
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
  });

  it('should render without trend', () => {
    const noTrendStats = {
      label: 'Active Jobs',
      value: '8',
      icon: '⚡',
    };
    render(<StatCard {...noTrendStats} />);
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    const largeStats = { ...mockStats, value: '1,000,000' };
    render(<StatCard {...largeStats} />);
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('should handle special characters in label', () => {
    const specialStats = { ...mockStats, label: 'Revenue ($)' };
    render(<StatCard {...specialStats} />);
    expect(screen.getByText('Revenue ($)')).toBeInTheDocument();
  });
});
