import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando isOpen é false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Confirmar"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('renderiza quando isOpen é true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirmar Exclusão"
        message="Esta ação não pode ser desfeita"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    expect(screen.getByText('Esta ação não pode ser desfeita')).toBeInTheDocument();
  });

  it('usa labels padrão quando não fornecidos', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('usa labels customizados quando fornecidos', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        confirmLabel="Deletar"
        cancelLabel="Voltar"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Deletar')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  it('chama onConfirm quando botão confirmar é clicado', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-button'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('chama onCancel quando botão cancelar é clicado', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('aplica estilo danger quando variant é danger', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        variant="danger"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('aplica estilo warning quando variant é warning', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        variant="warning"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-yellow-600');
  });

  it('aplica estilo info (default) quando variant não fornecido', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('possui atributos de acessibilidade corretos', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Título"
        message="Mensagem"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dialog = screen.getByTestId('confirm-dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  });
});
