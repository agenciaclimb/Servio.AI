import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileTips from '../components/ProfileTips';
import * as gemini from '../services/geminiService';

vi.mock('../services/geminiService');

const mockUser = {
  email: 'user@test.com',
  name: 'João Silva',
  type: 'prestador' as const,
  location: 'São Paulo, SP',
  status: 'ativo' as const,
  verificationStatus: 'verificado' as const,
  memberSince: '2024-01-01T00:00:00Z',
};

describe('ProfileTips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe loading e depois a dica gerada pela IA', async () => {
    (gemini.generateProfileTip as any).mockResolvedValue('Preencha sua bio para gerar confiança.');

    render(<ProfileTips user={mockUser as any} onEditProfile={vi.fn()} />);

    // Loading
    expect(screen.getByText(/Analisando seu perfil/i)).toBeInTheDocument();

    // Dica gerada
    await waitFor(() => {
      expect(screen.getByText(/Preencha sua bio/i)).toBeInTheDocument();
    });
  });

  it('mostra mensagem padrão em caso de erro', async () => {
    (gemini.generateProfileTip as any).mockRejectedValue(new Error('network'));

    render(<ProfileTips user={mockUser as any} onEditProfile={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Complete seu perfil/i)).toBeInTheDocument();
    });
  });

  it('dispara onEditProfile ao clicar em Editar Perfil', async () => {
    const onEdit = vi.fn();
    (gemini.generateProfileTip as any).mockResolvedValue('Dica qualquer');

    render(<ProfileTips user={mockUser as any} onEditProfile={onEdit} />);

    const user = userEvent.setup({ delay: null });
    const btn = await screen.findByRole('button', { name: /Editar Perfil/i });
    await user.click(btn);

    expect(onEdit).toHaveBeenCalled();
  });
});
