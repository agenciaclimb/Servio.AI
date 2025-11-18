import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioGallery from '../../components/PortfolioGallery';
import type { PortfolioItem } from '../../types';

const items: PortfolioItem[] = [
  { id: '1', imageUrl: 'data:image/png;base64,xx', title: 'Obra 1', description: 'Antes/Depois 1' },
  { id: '2', imageUrl: 'data:image/png;base64,yy', title: 'Obra 2', description: 'Antes/Depois 2' },
];

describe('PortfolioGallery', () => {
  it('renders all items with images', () => {
    const { container } = render(<PortfolioGallery items={items} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByAltText('Obra 1')).toBeInTheDocument();
    expect(screen.getByAltText('Obra 2')).toBeInTheDocument();
  });

  it('opens lightbox on click and closes on overlay click', () => {
    render(<PortfolioGallery items={items} />);
    const card = screen.getByRole('button', { name: /Abrir Obra 1/i });
    fireEvent.click(card);

    // Lightbox should be visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByAltText('Obra 1')[0]).toBeInTheDocument();

    // Click overlay (outer dialog container) to close
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
