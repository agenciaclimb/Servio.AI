import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisputeModal from '../../components/DisputeModal';
import type { Job, User, Dispute } from '../../types';

const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'client',
  createdAt: new Date().toISOString(),
};

const mockOtherParty: User = {
  id: '2',
  name: 'Provider User',
  email: 'provider@example.com',
  role: 'provider',
  createdAt: new Date().toISOString(),
};

const mockJob: Job = {
  id: '1',
  category: 'Encanador',
  description: 'Fix leak',
  status: 'in_dispute',
  clientId: '1',
  providerId: '2',
  price: 100,
  createdAt: new Date().toISOString(),
};

const mockDispute: Dispute = {
  id: '1',
  jobId: '1',
  raisedBy: '1',
  reason: 'Service not completed',
  status: 'open',
  messages: [
    {
      id: 'm1',
      senderId: '1',
      text: 'Initial dispute message',
      timestamp: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
};

describe('DisputeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dispute modal', () => {
    const { container } = render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  it('displays existing messages', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Initial dispute message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Close button
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows user to type a message', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New message' } });
    expect(input.value).toBe('New message');
  });

  it('sends message when form is submitted', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    }
  });

  it('does not send empty message', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={mockOtherParty}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    }
  });

  it('does not send message when otherParty is undefined', () => {
    render(
      <DisputeModal
        user={mockUser}
        job={mockJob}
        dispute={mockDispute}
        otherParty={undefined}
        onClose={mockOnClose}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    }
  });
});
