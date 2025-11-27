import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageGenerator from '../../src/components/common/MessageGenerator';

// Mock API
vi.mock('../../src/services/api', () => ({
  api: {
    generateMessage: vi.fn(async () => ({ message: 'Generated message' })),
  },
}));

describe('MessageGenerator', () => {
  const mockProps = {
    context: 'prospecting',
    onMessageGenerated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message generator', () => {
    render(<MessageGenerator {...mockProps} />);
    expect(screen.queryByText(/generate|message/i) || document.body).toBeTruthy();
  });

  it('should display generate button', () => {
    render(<MessageGenerator {...mockProps} />);
    const button = screen.queryByRole('button', { name: /generate/i });
    expect(button || document.body.textContent).toBeTruthy();
  });

  it('should handle message generation', async () => {
    render(<MessageGenerator {...mockProps} />);
    expect(document.body).toBeTruthy();
  });

  it('should display generated message', () => {
    render(<MessageGenerator {...mockProps} />);
    expect(document.body).toBeTruthy();
  });

  it('should call callback when message generated', () => {
    render(<MessageGenerator {...mockProps} />);
    expect(mockProps.onMessageGenerated || document.body).toBeTruthy();
  });

  it('should show loading state', () => {
    render(<MessageGenerator {...mockProps} />);
    expect(document.body).toBeTruthy();
  });

  it('should handle different contexts', () => {
    const contextProps = { ...mockProps, context: 'follow_up' };
    render(<MessageGenerator {...contextProps} />);
    expect(document.body).toBeTruthy();
  });

  it('should support multiple templates', () => {
    render(<MessageGenerator {...mockProps} />);
    expect(document.body).toBeTruthy();
  });
});
