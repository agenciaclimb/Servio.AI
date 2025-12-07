import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../../components/Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando totalPages <= 1', () => {
    render(<Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />);
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('renderiza botões anterior e próxima', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('desabilita botão anterior na primeira página', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    const prevButton = screen.getByTestId('prev-button');
    expect(prevButton).toBeDisabled();
  });

  it('desabilita botão próxima na última página', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
  });

  it('chama onPageChange ao clicar em anterior', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByTestId('prev-button'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('chama onPageChange ao clicar em próxima', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByTestId('next-button'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('renderiza páginas visíveis com maxVisible=5 (default)', () => {
    render(<Pagination currentPage={3} totalPages={10} onPageChange={mockOnPageChange} />);

    // Deve mostrar páginas 1, 2, 3, 4, 5
    expect(screen.getByTestId('page-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();
    expect(screen.getByTestId('page-3')).toBeInTheDocument();
    expect(screen.getByTestId('page-4')).toBeInTheDocument();
    expect(screen.getByTestId('page-5')).toBeInTheDocument();
  });

  it('destaca página atual', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    const currentPageButton = screen.getByTestId('page-3');
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('chama onPageChange ao clicar em página específica', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByTestId('page-3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('exibe reticências quando há páginas ocultas no início', () => {
    render(<Pagination currentPage={8} totalPages={10} onPageChange={mockOnPageChange} />);

    // Deve mostrar: 1 ... 6 7 8 9 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('exibe botão para primeira página quando fora do range visível', () => {
    render(<Pagination currentPage={8} totalPages={10} onPageChange={mockOnPageChange} />);

    const firstPageButton = screen.getByText('1');
    fireEvent.click(firstPageButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('exibe botão para última página quando fora do range visível', () => {
    render(<Pagination currentPage={2} totalPages={10} onPageChange={mockOnPageChange} />);

    const lastPageButton = screen.getByText('10');
    fireEvent.click(lastPageButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(10);
  });

  it('respeita maxVisible customizado', () => {
    render(
      <Pagination currentPage={2} totalPages={10} onPageChange={mockOnPageChange} maxVisible={3} />
    );

    // Com maxVisible=3 e currentPage=2, deve mostrar páginas 1, 2, 3
    expect(screen.getByTestId('page-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();
    expect(screen.getByTestId('page-3')).toBeInTheDocument();
    expect(screen.queryByTestId('page-4')).not.toBeInTheDocument();
  });
});
