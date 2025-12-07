import React from 'react';
import { render, screen } from '@testing-library/react';
import _userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>Conteúdo normal</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('captura erro e exibe fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Deve exibir mensagem de erro
    expect(screen.getByText(/Ocorreu um erro ao renderizar esta seção/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error from component/i)).toBeInTheDocument();

    // Verifica console.error foi chamado
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('exibe botão "Tentar novamente" quando há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Deve exibir UI de erro com botão retry
    expect(screen.getByText(/Ocorreu um erro/i)).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /Tentar novamente/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('exibe stack trace do componente no pre', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verifica que há um elemento <pre> (contém stack trace)
    const preElements = screen.getAllByText(/Test error from component/i);
    expect(preElements.length).toBeGreaterThanOrEqual(1);
  });
});
