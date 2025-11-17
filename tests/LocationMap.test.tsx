import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocationMap from '../components/LocationMap';

const locations = [
  { id: '1', name: 'São Paulo, SP', type: 'provider' as const },
  { id: '2', name: 'Rio de Janeiro, RJ', type: 'job' as const },
];

describe('LocationMap', () => {
  it('renderiza imagem do mapa', () => {
    render(<LocationMap locations={locations} />);
    expect(screen.getByAltText(/Mapa estilizado do Brasil/i)).toBeInTheDocument();
  });

  it('renderiza marcadores para cada location', () => {
    const { container } = render(<LocationMap locations={locations} />);
    // Marcadores são elementos com a classe do círculo (simplificação: seleciona por estilo inline top/left)
    const markers = container.querySelectorAll('.group > div.w-5');
    expect(markers.length).toBe(2);
  });

  it('renderiza tooltips com os nomes', () => {
    render(<LocationMap locations={locations} />);
    // Tooltips estão sempre no DOM (opacidade 0)
    expect(screen.getByText(/Prestador: São Paulo, SP/i)).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Rio de Janeiro, RJ/i)).toBeInTheDocument();
  });
});
