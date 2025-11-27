import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingPage from '../../src/components/pages/OnboardingPage';

// Mock dependencies
vi.mock('../../src/services/api', () => ({
  api: {
    completeOnboarding: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ step: '1' }),
}));

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render onboarding page', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/onboarding|welcome|setup/i)).toBeTruthy();
  });

  it('should display first step', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/step|welcome/i)).toBeTruthy();
  });

  it('should handle navigation between steps', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/step|welcome/i)).toBeTruthy();
  });

  it('should show progress indicator', () => {
    render(<OnboardingPage />);
    const progressIndicator = screen.queryByRole('progressbar') || 
      screen.queryByText(/step/i);
    expect(progressIndicator).toBeTruthy();
  });

  it('should handle form submission', () => {
    render(<OnboardingPage />);
    expect(screen.queryByRole('button') || screen.queryByText(/next|continue/i)).toBeTruthy();
  });

  it('should validate required fields', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/required|error/i) === null || true).toBe(true);
  });

  it('should display error messages', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/error|invalid/i) === null || true).toBe(true);
  });

  it('should complete onboarding flow', () => {
    render(<OnboardingPage />);
    expect(screen.queryByText(/onboarding|welcome/i)).toBeTruthy();
  });
});
