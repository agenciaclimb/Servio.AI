import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '../../components/Spinner';

describe('Spinner', () => {
  it('renderiza spinner', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('possui atributos de acessibilidade', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('aplica tamanho small', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-4', 'h-4');
  });

  it('aplica tamanho medium (default)', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-8', 'h-8');
  });

  it('aplica tamanho large', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-12', 'h-12');
  });

  it('aplica cor blue (default)', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-blue-600');
  });

  it('aplica cor white', () => {
    render(<Spinner color="white" />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-white');
  });

  it('aplica cor gray', () => {
    render(<Spinner color="gray" />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-gray-500');
  });

  it('possui classe de animação spin', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
  });
});
