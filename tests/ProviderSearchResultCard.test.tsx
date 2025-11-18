import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ProviderSearchResultCard from '../components/ProviderSearchResultCard';

describe('ProviderSearchResultCard', () => {
  const provider = {
    id: 'ana@ex.com',
    name: 'Ana Eletricista',
    service: 'Eletricista',
    location: 'São Paulo',
    rating: 4.3,
    jobsCompleted: 27,
    bio: 'Profissional com 10 anos de experiência',
    headline: 'Especialista em instalações',
  };

  it('renderiza infos e estrelas e dispara callbacks', () => {
    const onViewProfile = vi.fn();
    const onContact = vi.fn();

    render(
      <ProviderSearchResultCard
        provider={provider as any}
        onViewProfile={onViewProfile}
        onContact={onContact}
      />
    );

    expect(screen.getByText('Eletricista')).toBeInTheDocument();
    expect(screen.getByText('Ana Eletricista')).toBeInTheDocument();
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
  // rating formatado
  expect(screen.getByText('4.3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver Perfil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Contatar' }));

    expect(onViewProfile).toHaveBeenCalledTimes(1);
    expect(onContact).toHaveBeenCalledTimes(1);
  });
});
