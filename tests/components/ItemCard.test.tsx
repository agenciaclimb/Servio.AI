import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemCard from '../../components/ItemCard';
import { MaintainedItem } from '../../types';

const mockItem: MaintainedItem = {
  id: '1',
  ownerId: 'user@example.com',
  name: 'Ar Condicionado Samsung',
  category: 'Eletrônico',
  imageUrl: 'https://example.com/ac.jpg',
  description: 'Ar split 12000 BTUs',
  lastMaintenance: '2024-01-15',
  maintenanceFrequency: 6,
  createdAt: new Date().toISOString(),
};

describe('ItemCard', () => {
  it('renderiza item com imagem', () => {
    const onClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={onClick} />);

    expect(screen.getByAltText('Ar Condicionado Samsung')).toBeInTheDocument();
    expect(screen.getByText('Ar Condicionado Samsung')).toBeInTheDocument();
    // CSS uppercase transforma visualmente, mas texto DOM mantém original
    expect(screen.getByText('Eletrônico')).toBeInTheDocument();
  });

  it('renderiza placeholder quando imageUrl é null', () => {
    const onClick = vi.fn();
    const itemSemImagem = { ...mockItem, imageUrl: undefined };
    const { container } = render(<ItemCard item={itemSemImagem} onClick={onClick} />);

    const svgPlaceholder = container.querySelector('svg');
    expect(svgPlaceholder).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('aciona onClick quando clicado', () => {
    const onClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={onClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exibe categoria com classe uppercase', () => {
    const onClick = vi.fn();
    const { container } = render(<ItemCard item={mockItem} onClick={onClick} />);

    // CSS uppercase transforma visualmente, texto DOM mantém original
    const categoryElement = container.querySelector('.uppercase');
    expect(categoryElement).toBeInTheDocument();
    expect(categoryElement?.textContent).toBe('Eletrônico');
  });

  it('trunca nome longo com line-clamp-2', () => {
    const onClick = vi.fn();
    const itemNomeLongo = {
      ...mockItem,
      name: 'Este é um nome extremamente longo que deveria ser truncado pelo line-clamp-2 aplicado no h3 dentro do ItemCard',
    };
    const { container } = render(<ItemCard item={itemNomeLongo} onClick={onClick} />);

    const heading = container.querySelector('h3.line-clamp-2');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Este é um nome extremamente longo');
  });
});
