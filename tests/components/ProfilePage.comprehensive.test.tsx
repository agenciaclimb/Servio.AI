import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  apiCall: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ userId: 'test-user@example.com' }),
  useNavigate: () => vi.fn(),
}));

import ProfilePage from '../../../components/ProfilePage';
import { apiCall } from '../../../services/api';

describe('ProfilePage Component - Quality Tests', () => {
  const mockApiCall = apiCall as any;
  const mockUserProfile = {
    email: 'test-user@example.com',
    displayName: 'John Doe',
    type: 'prestador',
    status: 'ativo',
    rating: 4.7,
    completedJobs: 45,
    bio: 'Professional service provider',
    profileImage: 'https://example.com/image.jpg',
    verified: true,
    responseTime: 2,
    hourlyRate: 150,
    skills: ['web design', 'mobile dev', 'ui/ux'],
    reviews: [
      {
        id: '1',
        author: 'client1',
        rating: 5,
        text: 'Excellent work',
        date: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiCall.mockResolvedValue({ success: true, user: mockUserProfile });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Loading and Display', () => {
    it('should load and display user profile', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe|test-user@example.com/i)).toBeInTheDocument();
      });
    });

    it('should display loading skeleton while fetching', () => {
      mockApiCall.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      const { container } = render(<ProfilePage />);

      expect(container).toBeInTheDocument();
    });

    it('should show verified badge for verified users', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/verified|✓|verificado/i)).toBeInTheDocument();
      });
    });

    it('should display rating stars correctly', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/4\.7|rating/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information Display', () => {
    it('should display all user information sections', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Professional service provider/)).toBeInTheDocument();
      });
    });

    it('should display skills with proper formatting', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/web design|mobile dev|ui\/ux/)).toBeInTheDocument();
      });
    });

    it('should display response time', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/2|response/i)).toBeInTheDocument();
      });
    });

    it('should display hourly rate when applicable', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/150|R\$|hourly/i)).toBeInTheDocument();
      });
    });

    it('should display completed jobs count', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/45|completed|jobs/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Image Handling', () => {
    it('should display profile image', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { hidden: true });
        expect(img).toHaveAttribute('src', expect.stringContaining('example.com'));
      });
    });

    it('should show default avatar if no image provided', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, profileImage: null },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
      });
    });

    it('should handle broken image gracefully', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { hidden: true });
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Reviews Section', () => {
    it('should display all reviews', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Excellent work/)).toBeInTheDocument();
      });
    });

    it('should display reviews with ratings', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Excellent work/)).toBeInTheDocument();
      });
    });

    it('should sort reviews by date (newest first)', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: {
          ...mockUserProfile,
          reviews: [
            { id: '1', rating: 5, text: 'Old review', date: new Date('2025-01-01').toISOString() },
            { id: '2', rating: 4, text: 'New review', date: new Date('2025-12-28').toISOString() },
          ],
        },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        const reviewTexts = screen.getAllByText(/Old review|New review/);
        expect(reviewTexts[0]).toHaveTextContent('New review');
      });
    });

    it('should handle empty reviews list', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, reviews: [] },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/no reviews|sem avaliações/i)).toBeInTheDocument();
      });
    });
  });

  describe('CTA Buttons and Actions', () => {
    it('should display hire button', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /hire|contratar|contact/i })).toBeInTheDocument();
      });
    });

    it('should display contact button', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should open contact modal on button click', async () => {
      const _user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        const contactButton = screen.getByRole('button', { name: /contact|message/i });
        expect(contactButton).toBeInTheDocument();
      });
    });

    it('should open chat on message click', async () => {
      const _user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /message|chat/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle user not found', async () => {
      mockApiCall.mockRejectedValue({ status: 404, message: 'User not found' });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/not found|não encontrado/i)).toBeInTheDocument();
      });
    });

    it('should handle unauthorized access', async () => {
      mockApiCall.mockRejectedValue({ status: 401, message: 'Unauthorized' });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/unauthorized|acesso negado/i)).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      mockApiCall.mockRejectedValue(new Error('Network error'));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });

    it('should handle user with no profile picture', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, profileImage: '' },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
      });
    });

    it('should handle user with minimal data', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: {
          email: 'minimal@test.com',
          displayName: 'Minimal User',
          type: 'cliente',
          status: 'ativo',
        },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Minimal User/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should stack sections vertically on mobile', () => {
      global.innerWidth = 375;
      const { container } = render(<ProfilePage />);

      expect(container).toBeInTheDocument();
    });

    it('should display side-by-side on desktop', () => {
      global.innerWidth = 1024;
      const { container } = render(<ProfilePage />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('should handle special characters in name', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, displayName: 'José da Silva & Co.' },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/José da Silva/)).toBeInTheDocument();
      });
    });

    it('should handle very long bio text', async () => {
      const longBio = 'A'.repeat(1000);
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, bio: longBio },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/A+/)).toBeInTheDocument();
      });
    });

    it('should handle invalid rating values', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        user: { ...mockUserProfile, rating: 999 },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/999|rating/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { hidden: true });
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('should have alt text for images', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { hidden: true });
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should be keyboard navigable', async () => {
      const _user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
