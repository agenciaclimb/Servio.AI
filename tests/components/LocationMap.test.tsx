import { render } from '@testing-library/react';
import React from 'react';
import LocationMap from '../../components/LocationMap';

describe('LocationMap', () => {
  it('renderiza marcadores com cores por tipo (provider/job)', () => {
    const locations = [
      { id: '1', name: 'São Paulo, SP', type: 'provider' as const },
      { id: '2', name: 'Rio de Janeiro, RJ', type: 'job' as const },
    ];

    const { container, getByText } = render(<LocationMap locations={locations} />);

    // Tooltips existem no DOM com rótulos
    expect(getByText(/Prestador:/)).toBeTruthy();
    expect(getByText(/Cliente:/)).toBeTruthy();

    // Verifica cores dos pontos pelo tipo
    const dots = container.querySelectorAll('div.w-5.h-5');
    expect(dots.length).toBe(2);
    expect(dots[0].className).toContain('bg-blue-600'); // provider
    expect(dots[1].className).toContain('bg-green-500'); // job
  });
});
