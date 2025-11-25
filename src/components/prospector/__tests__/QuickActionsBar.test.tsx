/**
 * Testes para QuickActionsBar - Barra de Ações Rápidas
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuickActionsBar from '../QuickActionsBar';
import * as smartActionsService from '../../../services/smartActionsService';

// Mock do smartActionsService
vi.mock('../../../services/smartActionsService', () => ({
  generateSmartActions: vi.fn()
}));

describe('QuickActionsBar', () => {
  const mockProps = {
    prospectorId: 'prospector-123',
    prospectorName: 'Maria Santos',
    referralLink: 'https://servio.ai/ref/123',
    unreadNotifications: 3,
    onAddLead: vi.fn(),
    onOpenNotifications: vi.fn()
  };

  const mockNextAction = {
    id: 'action-1',
    icon: '📞',
    title: 'Contatar João Silva',
    description: 'Lead inativo há 7 dias',
    priority: 'high' as const,
    actionType: 'follow_up' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(smartActionsService.generateSmartActions).mockResolvedValue([mockNextAction]);
    
    // Mock window.innerWidth para desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  it('deve renderizar barra desktop corretamente', async () => {
    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Compartilhar')).toBeInTheDocument();
      expect(screen.getByText('Novo Lead')).toBeInTheDocument();
      expect(screen.getByText('Alertas')).toBeInTheDocument();
    });
  });

  it('deve renderizar FAB mobile corretamente', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    const { rerender } = render(<QuickActionsBar {...mockProps} />);
    
    // Force re-render para aplicar resize
    fireEvent(window, new Event('resize'));
    rerender(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  it('deve carregar próxima ação IA', async () => {
    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(smartActionsService.generateSmartActions).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Contatar João Silva')).toBeInTheDocument();
    });
  });

  it('deve exibir badge de notificações', () => {
    render(<QuickActionsBar {...mockProps} />);

    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500');
  });

  it('deve exibir 9+ quando notificações > 9', () => {
    render(<QuickActionsBar {...mockProps} unreadNotifications={15} />);

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('deve abrir WhatsApp ao compartilhar link', () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<QuickActionsBar {...mockProps} />);

    const shareButton = screen.getByText('Compartilhar').closest('button');
    fireEvent.click(shareButton!);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank'
    );
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(mockProps.referralLink)),
      '_blank'
    );
  });

  it('deve chamar onAddLead ao clicar em Novo Lead', () => {
    render(<QuickActionsBar {...mockProps} />);

    const addButton = screen.getByText('Novo Lead').closest('button');
    fireEvent.click(addButton!);

    expect(mockProps.onAddLead).toHaveBeenCalled();
  });

  it('deve chamar onOpenNotifications ao clicar em Alertas', () => {
    render(<QuickActionsBar {...mockProps} />);

    const notifButton = screen.getByText('Alertas').closest('button');
    fireEvent.click(notifButton!);

    expect(mockProps.onOpenNotifications).toHaveBeenCalled();
  });

  it('deve executar próxima ação ao clicar', async () => {
    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Contatar João Silva')).toBeInTheDocument();
    });

    const actionButton = screen.getByText('Contatar João Silva').closest('button');
    fireEvent.click(actionButton!);

    // Verifica se tentou redirecionar ou executar ação
    expect(window.location.hash).toContain('crm');
  });

  it('deve exibir prioridade alta com cor vermelha', async () => {
    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      const actionButton = screen.getByText('Contatar João Silva').closest('button');
      expect(actionButton).toHaveClass('from-red-500');
    });
  });

  it('deve exibir alerta urgente para ações de alta prioridade', async () => {
    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Urgente:')).toBeInTheDocument();
      expect(screen.getByText('Lead inativo há 7 dias')).toBeInTheDocument();
    });
  });

  it('deve auto-refresh a cada 5 minutos', async () => {
    vi.useFakeTimers();

    render(<QuickActionsBar {...mockProps} />);

    // Primeira chamada na montagem
    expect(smartActionsService.generateSmartActions).toHaveBeenCalledTimes(1);

    // Avançar 5 minutos e processar todos os timers
    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    // Aguardar segunda chamada
    await waitFor(() => {
      expect(smartActionsService.generateSmartActions).toHaveBeenCalledTimes(2);
    }, { timeout: 1000 });

    vi.useRealTimers();
  });

  it('deve expandir FAB mobile ao clicar', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(<QuickActionsBar {...mockProps} />);
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      const fab = screen.getByText('⚡').closest('button');
      expect(fab).toBeInTheDocument();
    });

    const fab = screen.getByText('⚡').closest('button');
    fireEvent.click(fab!);

    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument();
    });
  });

  it('deve fechar FAB mobile ao clicar no overlay', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(<QuickActionsBar {...mockProps} />);
    fireEvent(window, new Event('resize'));

    const fab = screen.getByText('⚡').closest('button');
    fireEvent.click(fab!);

    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simular clique no overlay
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/30');
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByText('✕')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  }, 30000);

  it('deve vibrar ao clicar em ação (mobile)', async () => {
    const mockVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: mockVibrate
    });

    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Contatar João Silva')).toBeInTheDocument();
    });

    const actionButton = screen.getByText('Contatar João Silva').closest('button');
    fireEvent.click(actionButton!);

    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  }, 30000);

  it('deve lidar com erro ao carregar ação', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(smartActionsService.generateSmartActions).mockRejectedValue(
      new Error('Network error')
    );

    render(<QuickActionsBar {...mockProps} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[QuickActions] Erro ao carregar próxima ação:',
        expect.any(Error)
      );
    }, { timeout: 3000 });

    consoleError.mockRestore();
  }, 30000);

  it('não deve exibir badge quando unreadNotifications = 0', () => {
    render(<QuickActionsBar {...mockProps} unreadNotifications={0} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
