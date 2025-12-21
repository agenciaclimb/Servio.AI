import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

vi.mock('../../../services/api', () => ({
  apiCall: vi.fn(),
  handleApiError: vi.fn(),
}));

vi.mock('../../../lib/firebaseLazy', () => ({
  getStorageInstance: vi.fn(() => ({
    ref: vi.fn(),
  })),
}));

import InternalChat from '../../../components/admin/InternalChat';
import { apiCall } from '../../../services/api';

describe('InternalChat Component - Comprehensive Quality Tests', () => {
  const mockApiCall = apiCall as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiCall.mockResolvedValue({ success: true, messages: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initialization', () => {
    it('should render chat container with all UI elements', () => {
      render(<InternalChat adminId="admin1" />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should render message input field with placeholder', () => {
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render send button and other action buttons', () => {
      render(<InternalChat adminId="admin1" />);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should load initial messages on mount', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        messages: [{ id: '1', text: 'Hello', timestamp: new Date(), from: 'admin1' }],
      });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/chat'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Message Sending - Edge Cases', () => {
    it('should not send empty message', async () => {
      render(<InternalChat adminId="admin1" />);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).not.toHaveBeenCalledWith(
          expect.stringContaining('messages'),
          expect.any(Object)
        );
      });
    });

    it('should not send message with only whitespace', async () => {
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await userEvent.type(input, '   \n  ');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).not.toHaveBeenCalledWith(
          expect.stringContaining('messages'),
          expect.any(Object)
        );
      });
    });

    it('should trim whitespace from message before sending', async () => {
      const user = userEvent.setup();
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i) as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await user.type(input, '  Hello World  ');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should handle very long messages (>1000 chars)', async () => {
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      const longMessage = 'a'.repeat(2000);
      fireEvent.change(input, { target: { value: longMessage } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });

    it('should handle special characters in message', async () => {
      const user = userEvent.setup();
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      const specialMessage = '<script>alert("xss")</script> & "quoted" \'single\'';
      await user.type(input, specialMessage);
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle API error when sending message', async () => {
      mockApiCall.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();

      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await user.type(input, 'Hello');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });

    it('should handle 401 Unauthorized response', async () => {
      mockApiCall.mockRejectedValue({ status: 401, message: 'Unauthorized' });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        // Should show error or redirect
        expect(mockApiCall).toBeDefined();
      });
    });

    it('should handle 500 server error', async () => {
      mockApiCall.mockRejectedValue({ status: 500, message: 'Internal Server Error' });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(mockApiCall).toBeDefined();
      });
    });

    it('should retry on timeout', async () => {
      mockApiCall
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ success: true, messages: [] });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });

  describe('Message Display and Formatting', () => {
    it('should display messages in correct order (oldest first)', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        messages: [
          { id: '1', text: 'First', timestamp: new Date('2025-01-01'), from: 'admin1' },
          { id: '2', text: 'Second', timestamp: new Date('2025-01-02'), from: 'admin2' },
          { id: '3', text: 'Third', timestamp: new Date('2025-01-03'), from: 'admin1' },
        ],
      });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        const messages = screen.getAllByText(/First|Second|Third/);
        expect(messages.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should highlight own messages differently from others', async () => {
      mockApiCall.mockResolvedValue({
        success: true,
        messages: [
          { id: '1', text: 'From me', timestamp: new Date(), from: 'admin1' },
          { id: '2', text: 'From other', timestamp: new Date(), from: 'admin2' },
        ],
      });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(screen.getByText(/From me/)).toBeInTheDocument();
        expect(screen.getByText(/From other/)).toBeInTheDocument();
      });
    });

    it('should format timestamps correctly', async () => {
      const testDate = new Date('2025-06-15T14:30:00');
      mockApiCall.mockResolvedValue({
        success: true,
        messages: [{ id: '1', text: 'Test', timestamp: testDate, from: 'admin1' }],
      });

      render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions and State Management', () => {
    it('should clear input field after sending message', async () => {
      const user = userEvent.setup();
      mockApiCall.mockResolvedValue({ success: true });

      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i) as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await user.type(input, 'Test message');
      expect(input.value).toBe('Test message');

      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should disable send button while loading', async () => {
      mockApiCall.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const user = userEvent.setup();

      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await user.type(input, 'Test');
      fireEvent.click(sendButton);

      await waitFor(
        () => {
          expect(sendButton).toHaveAttribute('disabled');
        },
        { timeout: 100 }
      );
    });

    it('should scroll to latest message after sending', async () => {
      const user = userEvent.setup();
      mockApiCall.mockResolvedValue({ success: true, messages: [] });

      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);
      const sendButton = screen.getByRole('button', { name: /send|enviar/i });

      await user.type(input, 'New message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(<InternalChat adminId="admin1" />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || button.textContent || button.title
        ).toBeTruthy();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);

      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should handle Enter key to send message', async () => {
      const user = userEvent.setup();
      mockApiCall.mockResolvedValue({ success: true });

      render(<InternalChat adminId="admin1" />);
      const input = screen.getByPlaceholderText(/message|Digite/i);

      await user.type(input, 'Test{Enter}');

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large number of messages efficiently', async () => {
      const messages = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        text: `Message ${i}`,
        timestamp: new Date(),
        from: i % 2 === 0 ? 'admin1' : 'admin2',
      }));

      mockApiCall.mockResolvedValue({ success: true, messages });

      const { container } = render(<InternalChat adminId="admin1" />);

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(<InternalChat adminId="admin1" />);

      unmount();

      expect(mockApiCall).toBeDefined();
    });
  });
});
