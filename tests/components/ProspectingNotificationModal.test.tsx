import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProspectingNotificationModal from '../../components/ProspectingNotificationModal';
import type { Prospect } from '../../types';

// Mock a11y helpers
vi.mock('../../components/utils/a11yHelpers', () => ({
  getModalOverlayProps: (onClose: () => void) => ({
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    'data-testid': 'modal-overlay',
  }),
  getModalContentProps: () => ({
    role: 'dialog',
    'aria-modal': true,
    'data-testid': 'modal-content',
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  }),
}));

describe('ProspectingNotificationModal', () => {
  const mockOnClose = vi.fn();

  const mockProspects: Prospect[] = [
    { name: 'João Silva', specialty: 'Eletricista' },
    { name: 'Maria Santos', specialty: 'Encanadora' },
    { name: 'Carlos Oliveira', specialty: 'Pintor' },
  ];

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders modal with title', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    expect(screen.getByText('Estamos Buscando por Você!')).toBeInTheDocument();
  });

  it('renders informative message about search', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    expect(
      screen.getByText(/Não encontramos um profissional 100% compatível/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Nossa equipe foi notificada/i)).toBeInTheDocument();
  });

  it('renders list of suggested prospects', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    expect(screen.getByText(/João Silva \(Eletricista\)/)).toBeInTheDocument();
    expect(screen.getByText(/Maria Santos \(Encanadora\)/)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Oliveira \(Pintor\)/)).toBeInTheDocument();
  });

  it('renders "Entendido" button', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByTestId('modal-overlay'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders modal content with dialog role', () => {
    render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    expect(screen.getByTestId('modal-content')).toHaveAttribute('role', 'dialog');
    expect(screen.getByTestId('modal-content')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders with empty prospects array', () => {
    render(<ProspectingNotificationModal prospects={[]} onClose={mockOnClose} />);

    expect(screen.getByText('Estamos Buscando por Você!')).toBeInTheDocument();
    expect(screen.getByText(/A IA sugeriu os seguintes perfis/)).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const { container } = render(
      <ProspectingNotificationModal prospects={mockProspects} onClose={mockOnClose} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
