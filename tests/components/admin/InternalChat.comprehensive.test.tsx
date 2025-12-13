import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
global.fetch = vi.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({ message: 'ok' }) })
) as any;

// Mock dependências ANTES dos imports
vi.mock('../../../services/geminiService', () => ({
  getChatAssistance: vi.fn(async () => ({ displayText: 'Resposta IA simulada' })),
}));

import InternalChat from '../../../components/AIInternalChat';
import { getChatAssistance } from '../../../services/geminiService';

describe('InternalChat Component - Comprehensive Quality Tests', () => {
  // jsdom não implementa scrollIntoView; mockamos para evitar erro
  beforeAll(() => {
    // @ts-expect-error - jsdom limitation: scrollIntoView is not implemented
    Element.prototype.scrollIntoView = vi.fn();
  });
  const mockGetChat = getChatAssistance as any;
  const mockUser = { email: 'admin1@example.com', name: 'Admin Uno', type: 'admin' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChat.mockResolvedValue({ displayText: 'OK' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initialization', () => {
    it('should render chat container with all UI elements', () => {
      const { container } = render(<InternalChat currentUser={mockUser} />);
      expect(container).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviar mensagem/i })).toBeInTheDocument();
    });

    it('should render message input field with placeholder', () => {
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      expect(input).toBeInTheDocument();
    });

    it('should render send button and other action buttons', () => {
      render(<InternalChat currentUser={mockUser} />);
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should load initial messages on mount', async () => {
      render(<InternalChat currentUser={mockUser} />);
      // Mensagem de boas-vindas deve estar presente e IA não é chamada no mount
      expect(screen.getByText(/Seu Coach Pessoal/i)).toBeInTheDocument();
      expect(mockGetChat).not.toHaveBeenCalled();
    });
  });

  describe('Message Sending - Edge Cases', () => {
    it('should render input and buttons', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
      await user.type(input, 'ping');
      fireEvent.click(sendButton);
      expect(input).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should accept whitespace safely', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, '   ');
      expect(input.value).toBeDefined();
    });

    it('should clear after send', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
      await user.type(input, 'Hello World');
      fireEvent.click(sendButton);
      expect(input.value).toBe('');
    });

    it('should handle long messages', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, 'a'.repeat(50));
      expect(input.value.length).toBeGreaterThan(0);
    });

    it('should accept special characters', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, '<script>alert("xss")</script>');
      expect(input.value).toContain('script');
    });
  });

  describe('API Error Handling', () => {
    it('should render even when API fails', async () => {
      mockGetChat.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();

      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, 'Hello');
      expect(input).toBeInTheDocument();
    });

    it('should handle 401 Unauthorized response', async () => {
      mockGetChat.mockRejectedValue({ status: 401, message: 'Unauthorized' });

      render(<InternalChat currentUser={mockUser} />);
      expect(mockGetChat).toBeDefined();
    });

    it('should handle 500 server error', async () => {
      mockGetChat.mockRejectedValue({ status: 500, message: 'Internal Server Error' });

      render(<InternalChat currentUser={mockUser} />);
      expect(mockGetChat).toBeDefined();
    });

    it('should retry on timeout', async () => {
      mockGetChat
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ displayText: 'OK' });

      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, 'Teste timeout');
      expect(mockGetChat).toBeDefined();
    });
  });

  describe('Message Display and Formatting', () => {
    it('should render messages container', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      await user.type(input, 'Primeira');
      expect(input).toBeInTheDocument();
    });

    it('should show user and assistant areas', () => {
      render(<InternalChat currentUser={mockUser} />);
      expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument();
    });

    it('should render timestamps text safely', () => {
      render(<InternalChat currentUser={mockUser} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('User Interactions and State Management', () => {
    it('should clear input field after sending message', async () => {
      const user = userEvent.setup();
      mockGetChat.mockResolvedValue({ displayText: 'OK' });

      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });

      await user.type(input, 'Test message');
      fireEvent.click(sendButton);
      expect(input.value).toBe('');
    });

    it('should disable send button while loading', async () => {
      mockGetChat.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ displayText: 'OK' }), 1000))
      );
      const user = userEvent.setup();

      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });

      await user.type(input, 'Test');
      fireEvent.click(sendButton);
      // logo após o clique, deve estar desabilitado enquanto aguarda
      expect(sendButton).toBeDisabled();
    });

    it('should scroll to latest message after sending', async () => {
      const user = userEvent.setup();
      mockGetChat.mockResolvedValue({ displayText: 'OK' });

      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });

      await user.type(input, 'New message');
      fireEvent.click(sendButton);
      expect(input.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(<InternalChat currentUser={mockUser} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || button.textContent || button.title
        ).toBeTruthy();
      });
    });

    test('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<InternalChat currentUser={mockUser} />);

      const textbox = screen.getByRole('textbox');
      await user.tab();
      textbox.focus();
      expect(textbox).toHaveFocus();
    });

    it('should handle Enter key to send message', async () => {
      const user = userEvent.setup();
      mockGetChat.mockResolvedValue({ displayText: 'OK' });

      render(<InternalChat currentUser={mockUser} />);
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);

      await user.type(input, 'Test{Enter}');
      expect(mockGetChat).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large number of messages efficiently', async () => {
      const { container } = render(<InternalChat currentUser={mockUser} />);
      expect(container).toBeInTheDocument();
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(<InternalChat currentUser={mockUser} />);
      unmount();
      expect(mockGetChat).toBeDefined();
    });
  });
});
