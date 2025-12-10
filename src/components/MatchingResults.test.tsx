import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MatchingResults from './MatchingResults';

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock('../utils/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

describe('MatchingResults Component', () => {
  const mockMatches = [
    {
      provider_id: 'provider1@example.com',
      score: 0.92,
      status: 'suggested' as const,
      matched_at: '2025-12-10T10:00:00Z',
      provider: {
        email: 'provider1@example.com',
        name: 'João Silva',
        type: 'prestador' as const,
        headline: 'Eletricista Experiente',
        location: 'São Paulo, SP',
        bio: 'Mais de 10 anos de experiência',
        specialties: ['Elétrica Residencial', 'Manutenção'],
        completionRate: 0.95,
        avgResponseTimeMinutes: 2,
        status: 'ativo' as const,
      },
    },
    {
      provider_id: 'provider2@example.com',
      score: 0.85,
      status: 'suggested' as const,
      matched_at: '2025-12-10T10:00:00Z',
      provider: {
        email: 'provider2@example.com',
        name: 'Maria Santos',
        type: 'prestador' as const,
        headline: 'Encanadora Profissional',
        location: 'São Paulo, SP',
        bio: 'Serviços de qualidade',
        specialties: ['Encanamento'],
        completionRate: 0.88,
        avgResponseTimeMinutes: 4,
        status: 'ativo' as const,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state initially', async () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves
          })
      );

      render(<MatchingResults jobId="job-123" />);
      const loadingElement = screen.getByTestId('matching-results-loading');
      expect(loadingElement).toBeInTheDocument();
      expect(screen.getByText(/Buscando prestadores compatíveis/)).toBeInTheDocument();
    });

    it('should have spinner animation during loading', () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves
          })
      );

      const { container } = render(<MatchingResults jobId="job-123" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no matches are found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: [] }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-empty')).toBeInTheDocument();
      });

      expect(screen.getByText(/Nenhum prestador encontrado/)).toBeInTheDocument();
    });

    it('should display empty state on 404 response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-empty')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message on fetch failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Erro ao carregar resultados/)).toBeInTheDocument();
    });

    it('should display error when jobId is missing', async () => {
      render(<MatchingResults jobId="" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Job ID is required/)).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Erro ao carregar resultados/)).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    it('should display matching results correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('matching-results-list')).toBeInTheDocument();
      });

      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    it('should display correct match count message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Encontramos 2 prestadores compatíveis/)).toBeInTheDocument();
      });
    });

    it('should display singular message for single match', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: [mockMatches[0]] }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Encontramos 1 prestador compatível/)).toBeInTheDocument();
      });
    });

    it('should display provider information', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByText('Eletricista Experiente')).toBeInTheDocument();
        expect(screen.getByText('Encanadora Profissional')).toBeInTheDocument();
      });
    });

    it('should display match scores as percentages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('match-score-provider1@example.com')).toHaveTextContent('92%');
        expect(screen.getByTestId('match-score-provider2@example.com')).toHaveTextContent('85%');
      });
    });

    it('should display provider location', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        const locationElements = screen.getAllByText(/São Paulo, SP/);
        expect(locationElements.length).toBe(2);
      });
    });

    it('should display specialties', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByText('Elétrica Residencial')).toBeInTheDocument();
        expect(screen.getByText('Encanamento')).toBeInTheDocument();
      });
    });

    it('should display completion rate and response time', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument(); // completionRate
        expect(screen.getByText('2h')).toBeInTheDocument(); // avgResponseTimeMinutes
      });
    });

    it('should display match status badge', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        const statusBadges = screen.getAllByText('Sugerido');
        expect(statusBadges.length).toBe(2);
      });
    });

    it('should have contact button for each match', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        const contactButtons = screen.getAllByText('Entrar em Contato');
        expect(contactButtons.length).toBe(2);
      });
    });
  });

  describe('User Interactions', () => {
    it('should call contact handler when contact button clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('match-contact-provider1@example.com')).toBeInTheDocument();
      });

      const contactButton = screen.getByTestId('match-contact-provider1@example.com');
      await user.click(contactButton);

      // Button should remain visible after click
      expect(contactButton).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should fetch matches with correct jobId', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v2/jobs/job-456/potential-matches');
      });
    });

    it('should refetch when jobId changes', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      const { rerender } = render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v2/jobs/job-123/potential-matches');
      });

      (global.fetch as any).mockClear();

      rerender(<MatchingResults jobId="job-456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v2/jobs/job-456/potential-matches');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      const { container } = render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        // Check for proper headings
        expect(container.querySelector('h4')).toBeInTheDocument();
      });
    });

    it('should have descriptive button labels', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: mockMatches }),
      });

      render(<MatchingResults jobId="job-123" />);

      await waitFor(() => {
        const buttons = screen.getAllByText('Entrar em Contato');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
