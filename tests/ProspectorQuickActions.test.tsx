import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProspectorQuickActions from '../src/components/ProspectorQuickActions';
import type { ProspectorStats } from '../services/api';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('ProspectorQuickActions', () => {
  const mockStats: ProspectorStats = {
    prospectorId: 'test@prospector.com',
    totalRecruits: 12,
    activeRecruits: 10,
    totalCommissionsEarned: 2450.75,
    pendingCommissions: 320.00,
    averageCommissionPerRecruit: 204.23,
    currentBadge: 'Ouro',
    nextBadge: 'Platina',
    progressToNextBadge: 13,
    badgeTiers: [
      { name: 'Bronze', min: 0 },
      { name: 'Prata', min: 5 },
      { name: 'Ouro', min: 10 },
      { name: 'Platina', min: 25 },
      { name: 'Diamante', min: 50 },
    ],
  };

  const defaultProps = {
    prospectorId: 'test@prospector.com',
    referralLink: 'https://servio-ai.com?ref=TEST123',
    stats: mockStats,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render quick actions bar with all buttons', () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    expect(screen.getByText(/Ações Rápidas/)).toBeInTheDocument();
    expect(screen.getByLabelText('Copiar link de indicação')).toBeInTheDocument();
    expect(screen.getByLabelText('Copiar template WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Copiar template Email')).toBeInTheDocument();
  });

  it('should display stats inline', () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    expect(screen.getByText('12')).toBeInTheDocument(); // recrutas
    expect(screen.getByText(/R\$ 245/)).toBeInTheDocument(); // comissões (arredondadas)
    expect(screen.getByTitle('Badge atual: Ouro')).toBeInTheDocument();
  });

  it('should copy referral link to clipboard', async () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    const copyLinkButton = screen.getByLabelText('Copiar link de indicação');
    fireEvent.click(copyLinkButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://servio-ai.com?ref=TEST123');
    });

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });

  it('should copy WhatsApp template with referral link', async () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    const whatsappButton = screen.getByLabelText('Copiar template WhatsApp');
    fireEvent.click(whatsappButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://servio-ai.com?ref=TEST123')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Servio.AI')
      );
    });
  });

  it('should copy Email template with referral link', async () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    const emailButton = screen.getByLabelText('Copiar template Email');
    fireEvent.click(emailButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://servio-ai.com?ref=TEST123')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Olá')
      );
    });
  });

  it('should show feedback after copy', async () => {
    render(<ProspectorQuickActions {...defaultProps} />);

    const copyLinkButton = screen.getByLabelText('Copiar link de indicação');
    fireEvent.click(copyLinkButton);

    await waitFor(() => {
      expect(screen.getByText('Copiado!')).toBeInTheDocument();
    });

    // Feedback mostrado corretamente
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should call onShareClick when share button is clicked', () => {
    const onShareClick = vi.fn();
    render(<ProspectorQuickActions {...defaultProps} onShareClick={onShareClick} />);

    // Share button só aparece em lg+ screens, precisa forçar render
    const shareButton = screen.getByLabelText('Compartilhar link');
    fireEvent.click(shareButton);

    expect(onShareClick).toHaveBeenCalledTimes(1);
  });

  it('should render correctly without stats', () => {
    render(
      <ProspectorQuickActions
        prospectorId="test@prospector.com"
        referralLink="https://servio-ai.com?ref=TEST123"
        stats={null}
      />
    );

    expect(screen.getByText(/Ações Rápidas/)).toBeInTheDocument();
    expect(screen.queryByText('12')).not.toBeInTheDocument(); // stats não mostradas
  });

  it('should have sticky positioning class', () => {
    const { container } = render(<ProspectorQuickActions {...defaultProps} />);
    
    const quickActionsBar = container.querySelector('.quick-actions-bar');
    expect(quickActionsBar).toHaveClass('sticky');
    expect(quickActionsBar).toHaveClass('top-0');
    expect(quickActionsBar).toHaveClass('z-50');
  });

  it('should display correct badge icon', () => {
    const statsWithDifferentBadge = { ...mockStats, currentBadge: 'Diamante' };
    render(<ProspectorQuickActions {...defaultProps} stats={statsWithDifferentBadge} />);

    expect(screen.getByTitle('Badge atual: Diamante')).toBeInTheDocument();
    expect(screen.getByText('👑')).toBeInTheDocument(); // Diamante icon
  });

  it('should handle clipboard write failure gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard failed'));

    render(<ProspectorQuickActions {...defaultProps} />);

    const copyLinkButton = screen.getByLabelText('Copiar link de indicação');
    
    // Click e aguardar processamento assíncrono
    await fireEvent.click(copyLinkButton);
    
    // Aguardar um pouco para async error handler executar
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
