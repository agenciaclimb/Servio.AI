import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza o spinner SVG', () => {
    const { container } = render(<LoadingSpinner />);
    
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });

  it('mostra a primeira mensagem de loading', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Analisando sua solicitação...')).toBeInTheDocument();
  });

  it('alterna as mensagens após o intervalo', () => {
    render(<LoadingSpinner />);
    
    // Primeira mensagem
    expect(screen.getByText('Analisando sua solicitação...')).toBeInTheDocument();
    
    // Avança 2.5 segundos
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    
    // Segunda mensagem
    expect(screen.getByText('Buscando os melhores profissionais...')).toBeInTheDocument();
    
    // Avança mais 2.5 segundos
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    
    // Terceira mensagem
    expect(screen.getByText('Avaliando compatibilidade com IA...')).toBeInTheDocument();
  });

  it('retorna ao início após a última mensagem', () => {
    render(<LoadingSpinner />);
    
    // Avança 5 mensagens (12.5 segundos)
    act(() => {
      vi.advanceTimersByTime(12500);
    });
    
    // Deve voltar à primeira mensagem
    expect(screen.getByText('Analisando sua solicitação...')).toBeInTheDocument();
  });

  it('tem as classes de estilo corretas', () => {
    const { container } = render(<LoadingSpinner />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('text-center');
    expect(wrapper).toHaveClass('py-10');
  });
});
