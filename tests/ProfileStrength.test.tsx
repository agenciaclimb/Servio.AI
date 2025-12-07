import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileStrength from '../components/ProfileStrength';

const baseUser = {
  email: 'user@test.com',
  name: 'João Silva',
  type: 'prestador' as const,
  location: 'São Paulo, SP',
  status: 'ativo' as const,
  verificationStatus: 'verificado' as const,
  memberSince: '2024-01-01T00:00:00Z',
};

describe('ProfileStrength', () => {
  it('renderiza indicador de força do perfil', () => {
    render(<ProfileStrength user={baseUser as any} onEditProfile={vi.fn()} />);

    expect(screen.getByText(/Força do Perfil/i)).toBeInTheDocument();
  });

  it('mostra botão para completar perfil quando incompleto', async () => {
    const onEdit = vi.fn();
    const incomplete = {
      ...baseUser,
      // faltam vários campos do checklist
    };

    render(<ProfileStrength user={incomplete as any} onEditProfile={onEdit} />);

    const user = userEvent.setup({ delay: null });
    const btn = screen.getByRole('button', { name: /Completar Perfil Agora/i });
    await user.click(btn);
    expect(onEdit).toHaveBeenCalled();
  });

  it('exibe 100% quando todos os itens estão completos e não mostra botão', () => {
    const completeUser = {
      ...baseUser,
      headline: 'Eletricista Nível Sênior',
      bio: 'Profissional experiente',
      address: 'Rua A, 123',
      cpf: '123.456.789-00',
      specialties: ['Eletricista'],
      hasCertificates: true,
      hasCriminalRecordCheck: true,
    };

    render(<ProfileStrength user={completeUser as any} onEditProfile={vi.fn()} />);

    expect(screen.getByText(/100%/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Completar Perfil Agora/i })
    ).not.toBeInTheDocument();
  });
});
