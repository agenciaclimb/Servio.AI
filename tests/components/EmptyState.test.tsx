import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renderiza com título e descrição', () => {
    render(
      <EmptyState
        title="Nenhum resultado"
        description="Não encontramos nada com esses critérios"
      />
    );

    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
    expect(screen.getByText('Não encontramos nada com esses critérios')).toBeInTheDocument();
  });

  it('renderiza ícone quando fornecido', () => {
    const icon = <svg data-testid="custom-icon"><circle /></svg>;
    
    render(
      <EmptyState
        icon={icon}
        title="Vazio"
        description="Lista vazia"
      />
    );

    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('não renderiza ícone quando não fornecido', () => {
    render(
      <EmptyState
        title="Vazio"
        description="Lista vazia"
      />
    );

    expect(screen.queryByTestId('empty-state-icon')).not.toBeInTheDocument();
  });

  it('renderiza botão de ação quando actionLabel e onAction fornecidos', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState
        title="Nenhum item"
        description="Adicione o primeiro"
        actionLabel="Adicionar Item"
        onAction={mockAction}
      />
    );

    const button = screen.getByTestId('empty-state-action');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Adicionar Item');
  });

  it('chama onAction quando botão é clicado', () => {
    const mockAction = vi.fn();
    
    render(
      <EmptyState
        title="Nenhum item"
        description="Adicione o primeiro"
        actionLabel="Adicionar"
        onAction={mockAction}
      />
    );

    const button = screen.getByTestId('empty-state-action');
    fireEvent.click(button);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('não renderiza botão quando actionLabel não fornecido', () => {
    render(
      <EmptyState
        title="Vazio"
        description="Sem dados"
        onAction={vi.fn()}
      />
    );

    expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
  });

  it('não renderiza botão quando onAction não fornecido', () => {
    render(
      <EmptyState
        title="Vazio"
        description="Sem dados"
        actionLabel="Ação"
      />
    );

    expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
  });
});
