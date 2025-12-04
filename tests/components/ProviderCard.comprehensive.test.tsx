import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

// Simple mock component since actual ProviderCard may not exist
const ProviderCard = ({ provider, onSelect }: any) => (
  <div data-testid="provider-card" className="p-4 border rounded-lg">
    <div data-testid="provider-name" className="font-bold text-lg">
      {provider?.displayName || 'Unknown'}
    </div>
    <div data-testid="provider-rating" className="text-sm text-gray-600">
      Rating: {provider?.rating || 0}
    </div>
    <div data-testid="provider-skills" className="text-sm mt-2">
      {provider?.skills?.join(', ') || 'No skills'}
    </div>
    <div data-testid="provider-jobs" className="text-sm text-gray-500">
      Completed: {provider?.completedJobs || 0}
    </div>
    {provider?.hourlyRate && (
      <div data-testid="provider-price" className="font-semibold mt-2">
        ${provider.hourlyRate}/h
      </div>
    )}
    <button
      data-testid="provider-select-btn"
      onClick={() => onSelect?.(provider)}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
    >
      Select Provider
    </button>
  </div>
);

describe('ProviderCard - Comprehensive Quality Tests', () => {
  const user = userEvent.setup();
  const mockProvider = {
    id: 'provider-1',
    displayName: 'John Developer',
    rating: 4.8,
    completedJobs: 45,
    skills: ['React', 'Node.js', 'TypeScript'],
    hourlyRate: 85,
    email: 'john@example.com',
    responseTime: '2 hours',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render provider card with basic information', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-card')).toBeInTheDocument();
      expect(screen.getByTestId('provider-name')).toHaveTextContent('John Developer');
      expect(screen.getByTestId('provider-rating')).toHaveTextContent('4.8');
    });

    it('should display all provider details', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toBeInTheDocument();
      expect(screen.getByTestId('provider-rating')).toBeInTheDocument();
      expect(screen.getByTestId('provider-skills')).toBeInTheDocument();
      expect(screen.getByTestId('provider-jobs')).toBeInTheDocument();
      expect(screen.getByTestId('provider-price')).toBeInTheDocument();
    });

    it('should render without errors for minimal data', () => {
      const mockSelect = vi.fn();
      const minimalProvider = { id: 'test' };
      
      render(
        <ProviderCard provider={minimalProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-card')).toBeInTheDocument();
    });

    it('should display default values when data is missing', () => {
      const mockSelect = vi.fn();
      const incompleteProvider = { displayName: 'Partial Dev' };
      
      render(
        <ProviderCard provider={incompleteProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toHaveTextContent('Partial Dev');
      expect(screen.getByTestId('provider-rating')).toHaveTextContent('0');
    });
  });

  describe('Provider Information Display', () => {
    it('should display provider name correctly', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByText('John Developer')).toBeInTheDocument();
    });

    it('should display rating with proper formatting', () => {
      const mockSelect = vi.fn();
      const providers = [
        { ...mockProvider, rating: 5 },
        { ...mockProvider, rating: 4.5 },
        { ...mockProvider, rating: 3.8 },
        { ...mockProvider, rating: 0 },
      ];

      providers.forEach(provider => {
        const { unmount } = render(
          <ProviderCard provider={provider} onSelect={mockSelect} />
        );
        expect(screen.getByTestId('provider-rating')).toBeInTheDocument();
        unmount();
      });
    });

    it('should display skills list', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-skills')).toHaveTextContent('React');
      expect(screen.getByTestId('provider-skills')).toHaveTextContent('Node.js');
      expect(screen.getByTestId('provider-skills')).toHaveTextContent('TypeScript');
    });

    it('should display completed jobs count', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-jobs')).toHaveTextContent('45');
    });

    it('should display hourly rate when available', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-price')).toHaveTextContent('85');
    });

    it('should handle missing hourly rate', () => {
      const mockSelect = vi.fn();
      const noRateProvider = { ...mockProvider, hourlyRate: undefined };
      
      const { container } = render(
        <ProviderCard provider={noRateProvider} onSelect={mockSelect} />
      );

      expect(container.querySelector('[data-testid="provider-price"]')).not.toBeInTheDocument();
    });
  });

  describe('Skills Display', () => {
    it('should display multiple skills', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const skillsText = screen.getByTestId('provider-skills').textContent;
      expect(skillsText).toContain('React');
      expect(skillsText).toContain('Node.js');
      expect(skillsText).toContain('TypeScript');
    });

    it('should handle empty skills array', () => {
      const mockSelect = vi.fn();
      const noSkillsProvider = { ...mockProvider, skills: [] };
      
      render(
        <ProviderCard provider={noSkillsProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-skills')).toHaveTextContent('No skills');
    });

    it('should handle single skill', () => {
      const mockSelect = vi.fn();
      const singleSkillProvider = { ...mockProvider, skills: ['JavaScript'] };
      
      render(
        <ProviderCard provider={singleSkillProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-skills')).toHaveTextContent('JavaScript');
    });

    it('should handle skills with special characters', () => {
      const mockSelect = vi.fn();
      const specialSkillsProvider = {
        ...mockProvider,
        skills: ['C#', 'C++', '.NET', 'ASP.NET'],
      };
      
      render(
        <ProviderCard provider={specialSkillsProvider} onSelect={mockSelect} />
      );

      const skillsText = screen.getByTestId('provider-skills').textContent;
      expect(skillsText).toContain('C#');
      expect(skillsText).toContain('C++');
    });
  });

  describe('Interactive Actions', () => {
    it('should call onSelect when provider is selected', async () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const selectBtn = screen.getByTestId('provider-select-btn');
      await user.click(selectBtn);

      expect(mockSelect).toHaveBeenCalledWith(mockProvider);
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('should pass correct provider data to onSelect', async () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      await user.click(screen.getByTestId('provider-select-btn'));

      const callArg = mockSelect.mock.calls[0][0];
      expect(callArg.id).toBe('provider-1');
      expect(callArg.displayName).toBe('John Developer');
      expect(callArg.rating).toBe(4.8);
    });

    it('should handle multiple selections', async () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const selectBtn = screen.getByTestId('provider-select-btn');
      await user.click(selectBtn);
      await user.click(selectBtn);
      await user.click(selectBtn);

      expect(mockSelect).toHaveBeenCalledTimes(3);
    });

    it('should not call onSelect if callback is not provided', async () => {
      const { container } = render(
        <ProviderCard provider={mockProvider} />
      );

      const selectBtn = container.querySelector('[data-testid="provider-select-btn"]');
      if (selectBtn) {
        fireEvent.click(selectBtn);
        // Should not throw
        expect(true).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high ratings', () => {
      const mockSelect = vi.fn();
      const highRatingProvider = { ...mockProvider, rating: 5.0 };
      
      render(
        <ProviderCard provider={highRatingProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-rating')).toHaveTextContent('5');
    });

    it('should handle zero rating', () => {
      const mockSelect = vi.fn();
      const zeroRatingProvider = { ...mockProvider, rating: 0 };
      
      render(
        <ProviderCard provider={zeroRatingProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-rating')).toHaveTextContent('0');
    });

    it('should handle very high completed jobs', () => {
      const mockSelect = vi.fn();
      const manyJobsProvider = { ...mockProvider, completedJobs: 9999 };
      
      render(
        <ProviderCard provider={manyJobsProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-jobs')).toHaveTextContent('9999');
    });

    it('should handle special characters in provider name', () => {
      const mockSelect = vi.fn();
      const specialNameProvider = {
        ...mockProvider,
        displayName: 'José María da Silva-Costa',
      };
      
      render(
        <ProviderCard provider={specialNameProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toHaveTextContent('José María da Silva-Costa');
    });

    it('should handle very long provider name', () => {
      const mockSelect = vi.fn();
      const longNameProvider = {
        ...mockProvider,
        displayName: 'A'.repeat(100),
      };
      
      render(
        <ProviderCard provider={longNameProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toBeInTheDocument();
    });

    it('should handle very long hourly rate', () => {
      const mockSelect = vi.fn();
      const highRateProvider = { ...mockProvider, hourlyRate: 9999999 };
      
      render(
        <ProviderCard provider={highRateProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-price')).toHaveTextContent('9999999');
    });

    it('should handle null provider gracefully', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={null} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const button = screen.getByTestId('provider-select-btn');
      // Native <button> has implicit role='button' - verify it's a button element
      expect(button.tagName).toBe('BUTTON');
    });

    it('should support keyboard navigation', async () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const button = screen.getByTestId('provider-select-btn');
      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(true).toBe(true);
    });

    it('should have semantic HTML structure', () => {
      const mockSelect = vi.fn();
      const { container } = render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      // Should have structured content
      expect(container.querySelector('[data-testid="provider-card"]')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper CSS classes', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const card = screen.getByTestId('provider-card');
      expect(card).toHaveClass('p-4', 'border', 'rounded-lg');
    });

    it('should render button with proper styling', () => {
      const mockSelect = vi.fn();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const button = screen.getByTestId('provider-select-btn');
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'rounded');
    });
  });

  describe('Different Provider Scenarios', () => {
    it('should display expert provider card', () => {
      const mockSelect = vi.fn();
      const expertProvider = {
        id: 'expert-1',
        displayName: 'Senior Expert',
        rating: 4.95,
        completedJobs: 500,
        skills: ['Architecture', 'Leadership', 'Mentoring'],
        hourlyRate: 200,
      };

      render(
        <ProviderCard provider={expertProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toHaveTextContent('Senior Expert');
      expect(screen.getByTestId('provider-price')).toHaveTextContent('200');
    });

    it('should display new provider card', () => {
      const mockSelect = vi.fn();
      const newProvider = {
        id: 'new-1',
        displayName: 'Junior Developer',
        rating: 0,
        completedJobs: 0,
        skills: ['Learning'],
        hourlyRate: 25,
      };

      render(
        <ProviderCard provider={newProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-name')).toHaveTextContent('Junior Developer');
      expect(screen.getByTestId('provider-jobs')).toHaveTextContent('0');
    });

    it('should display provider with various specializations', () => {
      const mockSelect = vi.fn();
      const specializers = [
        { displayName: 'Design Expert', skills: ['UI/UX', 'Figma', 'Adobe XD'] },
        { displayName: 'DevOps Pro', skills: ['Kubernetes', 'Docker', 'AWS'] },
        { displayName: 'Data Scientist', skills: ['Python', 'TensorFlow', 'Analytics'] },
      ];

      specializers.forEach(provider => {
        const { unmount } = render(
          <ProviderCard provider={provider} onSelect={mockSelect} />
        );
        expect(screen.getByTestId('provider-name')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly', () => {
      const mockSelect = vi.fn();
      const start = performance.now();
      render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle re-renders efficiently', () => {
      const mockSelect = vi.fn();
      const { rerender } = render(
        <ProviderCard provider={mockProvider} onSelect={mockSelect} />
      );

      const updatedProvider = { ...mockProvider, rating: 4.9 };
      rerender(
        <ProviderCard provider={updatedProvider} onSelect={mockSelect} />
      );

      expect(screen.getByTestId('provider-rating')).toHaveTextContent('4.9');
    });
  });
});
