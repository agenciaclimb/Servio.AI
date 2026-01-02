import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileStrength from '../../components/ProfileStrength';
import { User } from '../../types';

describe('ProfileStrength Component', () => {
  const baseUser: User = {
    name: '',
    email: 'user@test.com',
    role: 'prestador',
  };

  it('renderiza título "Força do Perfil"', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('Força do Perfil')).toBeInTheDocument();
  });

  it('calcula 0% para perfil vazio', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calcula 13% para perfil com apenas nome (1/8)', () => {
    const userWithName = { ...baseUser, name: 'João Silva' };
    render(<ProfileStrength user={userWithName} onEditProfile={vi.fn()} />);
    
    // 1/8 = 12.5% arredondado para 13%
    expect(screen.getByText('13%')).toBeInTheDocument();
  });

  it('calcula 50% para perfil com metade dos campos (4/8)', () => {
    const halfCompleteUser = {
      ...baseUser,
      name: 'João Silva',
      headline: 'Encanador',
      bio: 'Experiência de 10 anos',
      address: 'São Paulo',
    };
    render(<ProfileStrength user={halfCompleteUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calcula 100% para perfil completo', () => {
    const completeUser: User = {
      ...baseUser,
      name: 'João Silva',
      headline: 'Encanador',
      bio: 'Experiência de 10 anos',
      address: 'São Paulo',
      cpf: '123.456.789-00',
      specialties: ['encanamento', 'reparos'],
      hasCertificates: true,
      hasCriminalRecordCheck: true,
    };
    render(<ProfileStrength user={completeUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('aplica cor verde para perfil > 80%', () => {
    const almostCompleteUser: User = {
      ...baseUser,
      name: 'João Silva',
      headline: 'Encanador',
      bio: 'Experiência de 10 anos',
      address: 'São Paulo',
      cpf: '123.456.789-00',
      specialties: ['encanamento'],
      hasCertificates: true,
    };
    render(<ProfileStrength user={almostCompleteUser} onEditProfile={vi.fn()} />);
    
    // 7/8 = 88%
    const percentageElement = screen.getByText('88%');
    expect(percentageElement).toHaveClass('text-green-500');
  });

  it('aplica cor amarela para perfil entre 50% e 80%', () => {
    const mediumUser = {
      ...baseUser,
      name: 'João Silva',
      headline: 'Encanador',
      bio: 'Experiência de 10 anos',
      address: 'São Paulo',
      cpf: '123.456.789-00',
    };
    render(<ProfileStrength user={mediumUser} onEditProfile={vi.fn()} />);
    
    // 5/8 = 62.5% arredondado para 63%
    const percentageElement = screen.getByText('63%');
    expect(percentageElement).toHaveClass('text-yellow-500');
  });

  it('aplica cor vermelha para perfil < 50%', () => {
    const weakUser = {
      ...baseUser,
      name: 'João Silva',
      headline: 'Encanador',
    };
    render(<ProfileStrength user={weakUser} onEditProfile={vi.fn()} />);
    
    // 2/8 = 25%
    const percentageElement = screen.getByText('25%');
    expect(percentageElement).toHaveClass('text-red-500');
  });

  it('renderiza todos os 8 itens do checklist', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('Nome Completo')).toBeInTheDocument();
    expect(screen.getByText('Título Profissional')).toBeInTheDocument();
    expect(screen.getByText('Biografia')).toBeInTheDocument();
    expect(screen.getByText('Endereço')).toBeInTheDocument();
    expect(screen.getByText('CPF')).toBeInTheDocument();
    expect(screen.getByText('Especialidades')).toBeInTheDocument();
    expect(screen.getByText('Verificar Certificados')).toBeInTheDocument();
    expect(screen.getByText('Verificar Antecedentes')).toBeInTheDocument();
  });

  it('marca item como completo quando campo existe', () => {
    const userWithName = { ...baseUser, name: 'João Silva' };
    const { container } = render(
      <ProfileStrength user={userWithName} onEditProfile={vi.fn()} />
    );
    
    const checkmarks = container.querySelectorAll('.bg-green-500');
    expect(checkmarks.length).toBe(1); // Só "Nome Completo" está completo
  });

  it('renderiza botão "Completar Perfil Agora" quando perfil incompleto', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('Completar Perfil Agora')).toBeInTheDocument();
  });

  it('chama onEditProfile ao clicar no botão', async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    render(<ProfileStrength user={baseUser} onEditProfile={onEditProfile} />);
    
    await user.click(screen.getByText('Completar Perfil Agora'));
    
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('exibe mensagem motivacional', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText(/Perfis completos recebem mais propostas/)).toBeInTheDocument();
  });

  it('exibe título do checklist', () => {
    render(<ProfileStrength user={baseUser} onEditProfile={vi.fn()} />);
    
    expect(screen.getByText('Como melhorar seu perfil:')).toBeInTheDocument();
  });

  it('valida especialidades como array não vazio', () => {
    const userWithEmptyArray = { ...baseUser, specialties: [] };
    render(<ProfileStrength user={userWithEmptyArray} onEditProfile={vi.fn()} />);
    
    // 0/8 = 0% (array vazio não conta)
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('considera especialidades quando array tem itens', () => {
    const userWithSpecialties = { ...baseUser, specialties: ['encanamento'] };
    render(<ProfileStrength user={userWithSpecialties} onEditProfile={vi.fn()} />);
    
    // 1/8 = 13%
    expect(screen.getByText('13%')).toBeInTheDocument();
  });
});
