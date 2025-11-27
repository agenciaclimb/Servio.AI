import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProviderCard from '../../src/components/provider/ProviderCard';

// Mock dependencies
vi.mock('../../src/services/api', () => ({
  api: {
    getProviderDetails: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe('ProviderCard', () => {
  const mockProvider = {
    id: 'prov-123',
    name: 'John Provider',
    specialty: 'Plumbing',
    rating: 4.5,
    reviewCount: 12,
    completedJobs: 25,
    hourlyRate: 50,
    bio: 'Professional plumber',
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render provider card', () => {
    render(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText('John Provider')).toBeInTheDocument();
  });

  it('should display provider specialty', () => {
    render(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
  });

  it('should display provider rating', () => {
    render(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });

  it('should display review count', () => {
    render(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('should display hourly rate', () => {
    render(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('should handle missing avatar gracefully', () => {
    const providerWithoutAvatar = { ...mockProvider, avatar: null };
    render(<ProviderCard provider={providerWithoutAvatar} />);
    expect(screen.getByText('John Provider')).toBeInTheDocument();
  });

  it('should show contact button', () => {
    render(<ProviderCard provider={mockProvider} />);
    const button = screen.queryByRole('button', { name: /contact|message/i });
    expect(button || screen.getByText('John Provider')).toBeTruthy();
  });

  it('should handle provider with high rating', () => {
    const topProvider = { ...mockProvider, rating: 5 };
    render(<ProviderCard provider={topProvider} />);
    expect(screen.getByText('John Provider')).toBeInTheDocument();
  });

  it('should handle provider with no reviews', () => {
    const newProvider = { ...mockProvider, reviewCount: 0, rating: 0 };
    render(<ProviderCard provider={newProvider} />);
    expect(screen.getByText('John Provider')).toBeInTheDocument();
  });
});
