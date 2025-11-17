import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemCard from '../components/ItemCard';

const baseItem = {
  id: 'item-1',
  clientId: 'client@test.com',
  name: 'Geladeira Brastemp',
  category: 'Eletrodomésticos',
  brand: 'Brastemp',
  model: 'FrostFree 400L',
  serialNumber: 'ABC123',
  imageUrl: '',
  notes: 'Manutenção anual',
  createdAt: '2025-11-01T10:00:00.000Z',
  maintenanceHistory: [],
};

describe('ItemCard', () => {
  it('renderiza com imagem quando imageUrl está presente', () => {
    const itemWithImage = { ...baseItem, imageUrl: 'https://example.com/img.jpg' };

    render(<ItemCard item={itemWithImage as any} onClick={vi.fn()} />);

    const img = screen.getByRole('img', { name: /Geladeira Brastemp/i });
    expect(img).toBeInTheDocument();
  });

  it('renderiza fallback quando não há imagem', () => {
    render(<ItemCard item={baseItem as any} onClick={vi.fn()} />);
    // fallback tem um SVG; não tem role direto, então validamos pelo texto do título e ausência da imagem
    expect(screen.getByText(/Geladeira Brastemp/i)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Geladeira Brastemp/i })).not.toBeInTheDocument();
  });

  it('aciona onClick ao clicar', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(<ItemCard item={baseItem as any} onClick={onClick} />);

    const button = screen.getByRole('button', { name: /Ver detalhes/i });
    await user.click(button);

    expect(onClick).toHaveBeenCalled();
  });
});
