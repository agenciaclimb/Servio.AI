import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FindProvidersPage from '../../components/FindProvidersPage';

const users = [
  { uid: 'u1', email: 'p1@example.com', name: 'Prestador 1', type: 'prestador', status: 'ativo' },
  { uid: 'u2', email: 'p2@example.com', name: 'Prestador 2', type: 'prestador', status: 'ativo' },
  { uid: 'u3', email: 'c1@example.com', name: 'Cliente 1', type: 'cliente', status: 'ativo' },
];

const jobs = [
  { id: 'j1', clientId: 'c1@example.com', providerId: 'p1@example.com', status: 'concluido', review: { rating: 4, comment: 'Bom' }, description: 'Elétrica' },
  { id: 'j2', clientId: 'c1@example.com', providerId: 'p2@example.com', status: 'concluido', review: { rating: 5, comment: 'Ótimo' }, description: 'Hidráulica' },
];

describe('FindProvidersPage smoke', () => {
  it('renderiza e permite buscar com IA', () => {
    render(
      <FindProvidersPage
        allUsers={users as any}
        allJobs={jobs as any}
        onViewProfile={() => {}}
        onContact={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Descreva o que precisa/i);
    const button = screen.getByRole('button', { name: /Buscar com IA/i });

    // Buscar por "Eletricista"
    fireEvent.change(input, { target: { value: 'eletricista em são paulo' } });
    fireEvent.click(button);

    // Deve mostrar contagem de profissionais encontrados
    expect(screen.getByText(/profissionais encontrados/i)).toBeInTheDocument();
  });
});
