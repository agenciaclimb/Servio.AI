import { render, screen } from '@testing-library/react';
import React from 'react';
import CompletedJobCard from '../components/CompletedJobCard';

const baseJob = {
  id: 'job-1',
  clientId: 'client@example.com',
  providerId: 'pro@example.com',
  category: 'reparos',
  description: 'Troca de resistência do chuveiro',
  status: 'concluido',
} as any;

const client = {
  email: 'client@example.com',
  name: 'Cliente Exemplo',
} as any;

describe('CompletedJobCard', () => {
  it('renderiza categoria, descrição e cliente', () => {
    render(<CompletedJobCard job={baseJob} client={client} />);
    expect(screen.getByText('Reparos')).toBeInTheDocument();
    expect(screen.getByText('Troca de resistência do chuveiro')).toBeInTheDocument();
    expect(screen.getByText(/Cliente: Cliente Exemplo/)).toBeInTheDocument();
  });

  it('exibe avaliação com estrelas e nota quando há review', () => {
    const jobWithReview = {
      ...baseJob,
      review: { rating: 4, comment: 'Serviço muito bom' },
    } as any;

    render(<CompletedJobCard job={jobWithReview} client={client} />);

    // Mostra texto "Avaliação Recebida" e a nota (4.0)
    expect(screen.getByText('Avaliação Recebida:')).toBeInTheDocument();
    expect(screen.getByText('(4.0)')).toBeInTheDocument();

    // Comentário do cliente fica visível
    expect(screen.getByText(/Serviço muito bom/)).toBeInTheDocument();
  });
});
