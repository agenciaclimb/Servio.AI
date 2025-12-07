import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renderiza badge com status success', () => {
    render(<StatusBadge status="success" label="Aprovado" />);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Aprovado');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renderiza badge com status warning', () => {
    render(<StatusBadge status="warning" label="Pendente" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Pendente');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renderiza badge com status error', () => {
    render(<StatusBadge status="error" label="Rejeitado" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Rejeitado');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renderiza badge com status info', () => {
    render(<StatusBadge status="info" label="Em análise" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Em análise');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renderiza badge tamanho small', () => {
    render(<StatusBadge status="info" label="Info" size="sm" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('renderiza badge tamanho medium (default)', () => {
    render(<StatusBadge status="info" label="Info" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('renderiza badge tamanho large', () => {
    render(<StatusBadge status="info" label="Info" size="lg" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('possui atributo aria-label correto', () => {
    render(<StatusBadge status="success" label="Completo" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Completo');
  });
});
