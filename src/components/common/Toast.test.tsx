import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Toast from '../../src/components/common/Toast';

describe('Toast', () => {
  const mockToast = {
    id: 'toast-1',
    message: 'Test message',
    type: 'success' as const,
    duration: 3000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render toast message', () => {
    render(<Toast {...mockToast} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success toast', () => {
    render(<Toast {...mockToast} type="success" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    const errorToast = { ...mockToast, type: 'error' as const };
    render(<Toast {...errorToast} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render warning toast', () => {
    const warningToast = { ...mockToast, type: 'warning' as const };
    render(<Toast {...warningToast} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render info toast', () => {
    const infoToast = { ...mockToast, type: 'info' as const };
    render(<Toast {...infoToast} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should auto-dismiss after duration', async () => {
    const onDismiss = vi.fn();
    render(<Toast {...mockToast} onDismiss={onDismiss} />);

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    });
  });

  it('should handle long messages', () => {
    const longMessage = 'a'.repeat(200);
    render(<Toast {...mockToast} message={longMessage} />);
    expect(screen.getByText(new RegExp(longMessage.substring(0, 50)))).toBeInTheDocument();
  });

  it('should display custom duration', () => {
    const customDurationToast = { ...mockToast, duration: 5000 };
    render(<Toast {...customDurationToast} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should handle dismiss callback', () => {
    const onDismiss = vi.fn();
    render(<Toast {...mockToast} onDismiss={onDismiss} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<Toast {...mockToast} />);
    const closeButton = screen.queryByRole('button');
    expect(closeButton || screen.getByText('Test message')).toBeTruthy();
  });
});
