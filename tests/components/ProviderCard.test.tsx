import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProviderCard from '../../components/ProviderCard';
import * as API from '../../services/api';

describe('ProviderCard Component', () => {
  const mockProvider: API.Provider = {
    id: 'provider1',
    name: 'João Silva',
    email: 'joao@test.com',
    headline: 'Encanador Profissional',
    location: 'São Paulo, SP',
    completionRate: 0.9,
    bio: 'Experiência de 10 anos',
    skills: ['encanamento', 'reparos'],
  };

  const mockResult: API.MatchingProvider = {
    provider: mockProvider,
    score: 0.92,
    reason: 'Alta taxa de conclusão e avaliação excelente',
  };

  it('renderiza nome do prestador', () => {
    render(<ProviderCard result={mockResult} />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('renderiza headline do prestador', () => {
    render(<ProviderCard result={mockResult} />);
    
    expect(screen.getByText('Encanador Profissional')).toBeInTheDocument();
  });

  it('renderiza localização', () => {
    render(<ProviderCard result={mockResult} />);
    
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
  });

  it('mostra score de compatibilidade', () => {
    render(<ProviderCard result={mockResult} />);
    
    // 0.92 * 100 = 92%
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it('renderiza 5 estrelas baseado no completionRate', () => {
    render(<ProviderCard result={mockResult} />);
    
    // completionRate 0.9 * 5 = 4.5 estrelas
    expect(screen.getByText(/4.5 de 5 estrelas/)).toBeInTheDocument();
  });

  it('mostra razão da boa escolha', () => {
    render(<ProviderCard result={mockResult} />);
    
    expect(screen.getByText(/Alta taxa de conclusão/)).toBeInTheDocument();
  });

  it('aplica classe verde para score > 0.85', () => {
    render(<ProviderCard result={mockResult} />);
    
    const scoreElement = screen.getByText(/92%/).closest('div');
    expect(scoreElement).toHaveClass('bg-green-100');
  });

  it('aplica classe amarela para score entre 0.7 e 0.85', () => {
    const mediumResult = { ...mockResult, score: 0.75 };
    render(<ProviderCard result={mediumResult} />);
    
    const scoreElement = screen.getByText(/75%/).closest('div');
    expect(scoreElement).toHaveClass('bg-yellow-100');
  });

  it('aplica classe vermelha para score < 0.7', () => {
    const lowResult = { ...mockResult, score: 0.65 };
    render(<ProviderCard result={lowResult} />);
    
    const scoreElement = screen.getByText(/65%/).closest('div');
    expect(scoreElement).toHaveClass('bg-red-100');
  });

  it('renderiza botão "Convidar para o Job" quando onInvite está presente', () => {
    const onInvite = vi.fn();
    render(<ProviderCard result={mockResult} onInvite={onInvite} />);
    
    expect(screen.getByText('Convidar para o Job')).toBeInTheDocument();
  });

  it('chama onInvite com email do prestador ao clicar', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    render(<ProviderCard result={mockResult} onInvite={onInvite} />);
    
    await user.click(screen.getByText('Convidar para o Job'));
    
    expect(onInvite).toHaveBeenCalledWith('joao@test.com');
  });

  it('desabilita botão e mostra "Convite Enviado" quando isInvited=true', () => {
    const onInvite = vi.fn();
    render(<ProviderCard result={mockResult} onInvite={onInvite} isInvited={true} />);
    
    const button = screen.getByText(/Convite Enviado/);
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('mostra botão "Ver Perfil" quando onInvite não está presente', () => {
    render(<ProviderCard result={mockResult} />);
    
    expect(screen.getByText('Ver Perfil')).toBeInTheDocument();
  });

  it('aplica transformação hover ao card', () => {
    const { container } = render(<ProviderCard result={mockResult} />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('transform');
    expect(card).toHaveClass('hover:scale-105');
  });
});
