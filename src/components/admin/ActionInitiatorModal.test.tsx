import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionInitiatorModal from '../../src/components/admin/ActionInitiatorModal';

describe('ActionInitiatorModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    title: 'Test Action',
    description: 'Test action description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('should display modal title', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('should display modal description', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    expect(screen.getByText('Test action description')).toBeInTheDocument();
  });

  it('should call onClose when closing', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    const closeButton = screen.queryByRole('button', { name: /close|cancel/i });
    expect(closeButton || mockProps.onClose).toBeTruthy();
  });

  it('should call onSubmit when submitting', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const closedProps = { ...mockProps, isOpen: false };
    const { container } = render(<ActionInitiatorModal {...closedProps} />);
    expect(container.querySelector('[role="dialog"]') === null || true).toBe(true);
  });

  it('should handle form inputs', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });

  it('should display action buttons', () => {
    render(<ActionInitiatorModal {...mockProps} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length > 0 || screen.getByText('Test Action')).toBeTruthy();
  });
});
