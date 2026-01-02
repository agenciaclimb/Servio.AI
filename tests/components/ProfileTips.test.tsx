import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileTips from '../../components/ProfileTips';
import { User } from '../../types';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  generateProfileTip: vi.fn(),
}));

describe('ProfileTips Component', () => {
  const mockUser: User = {
    id: '1',
    email: 'teste@example.com',
    name: 'Teste User',
    tipo: 'prestador',
    status: 'ativo',
    fotoPerfil: '',
    bio: '',
    servicosPrestados: [],
    tags: [],
    telefone: '',
    endereco: '',
  };

  const mockOnEditProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título', () => {
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Dica de teste');
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    expect(screen.getByText('Dica Rápida da IA')).toBeInTheDocument();
  });

  it('mostra loading durante busca da dica', () => {
    vi.mocked(geminiService.generateProfileTip).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    expect(screen.getByText('Analisando seu perfil para uma dica...')).toBeInTheDocument();
  });

  it('mostra a dica gerada pela IA', async () => {
    const mockTip = 'Adicione mais fotos ao seu portfólio para aumentar suas chances!';
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue(mockTip);
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Adicione mais fotos/)).toBeInTheDocument();
    });
  });

  it('mostra dica padrão quando há erro', async () => {
    vi.mocked(geminiService.generateProfileTip).mockRejectedValue(new Error('AI failed'));
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Complete seu perfil/)).toBeInTheDocument();
    });
  });

  it('tem ícone de lâmpada (💡)', () => {
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Dica');
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('tem classes de gradiente azul para roxo', () => {
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Dica');
    
    const { container } = render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-gradient-to-r');
    expect(card).toHaveClass('from-blue-500');
    expect(card).toHaveClass('to-purple-600');
  });

  it('chama generateProfileTip com o usuário correto', async () => {
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Dica');
    
    render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    await waitFor(() => {
      expect(geminiService.generateProfileTip).toHaveBeenCalledWith(mockUser);
    });
  });

  it('re-busca dica quando usuário muda', async () => {
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Dica inicial');
    
    const { rerender } = render(<ProfileTips user={mockUser} onEditProfile={mockOnEditProfile} />);
    
    await waitFor(() => {
      expect(geminiService.generateProfileTip).toHaveBeenCalledTimes(1);
    });
    
    const updatedUser = { ...mockUser, bio: 'Nova bio' };
    vi.mocked(geminiService.generateProfileTip).mockResolvedValue('Nova dica');
    
    rerender(<ProfileTips user={updatedUser} onEditProfile={mockOnEditProfile} />);
    
    await waitFor(() => {
      expect(geminiService.generateProfileTip).toHaveBeenCalledTimes(2);
    });
  });
});
