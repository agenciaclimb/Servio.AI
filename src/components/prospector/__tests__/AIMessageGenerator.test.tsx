/**
 * Testes para AIMessageGenerator - Geração Automática de Mensagens
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIMessageGenerator from '../AIMessageGenerator';
import type { ProspectLead } from '../../ProspectorCRM';

// Mock do fetch global
global.fetch = vi.fn();

describe('AIMessageGenerator', () => {
  const mockLead: ProspectLead = {
    id: 'lead-123',
    prospectorId: 'prospector-456',
    name: 'João Silva',
    phone: '11999999999',
    email: 'joao@example.com',
    category: 'Eletricista',
    source: 'referral',
    stage: 'new',
    score: 75,
    temperature: 'hot',
    priority: 'high',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    activities: []
  };

  const mockOnSendSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o componente corretamente', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    expect(screen.getByText(`Mensagem para ${mockLead.name}`)).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('deve selecionar canal WhatsApp por padrão', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const whatsappButton = screen.getByText('WhatsApp').closest('button');
    expect(whatsappButton).toHaveClass('bg-green-500');
  });

  it('deve trocar entre canais ao clicar', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const emailButton = screen.getByText('E-mail').closest('button');
    fireEvent.click(emailButton!);

    expect(emailButton).toHaveClass('bg-blue-500');
  });

  it('deve gerar mensagem com IA ao clicar no botão', async () => {
    const mockResponse = {
      message: 'Olá João! Que tal oferecer seus serviços na plataforma?',
      alternatives: ['Mensagem alternativa 1', 'Mensagem alternativa 2'],
      suggestedTime: '2024-01-02T10:00:00Z'
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const generateButton = screen.getByText(/Gerar com IA/);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/generate-prospector-message'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('João Silva')
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockResponse.message)).toBeInTheDocument();
    });
  });

  it('deve substituir variáveis no template', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const message = textarea.value;

    expect(message).toContain('João Silva');
    expect(message).toContain('Maria Santos');
    expect(message).toContain('https://servio.ai/ref/123');
  });

  it('deve exibir contador de caracteres', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    expect(screen.getByText(/caracteres/)).toBeInTheDocument();
  });

  it('deve exibir sugestão de melhor horário', async () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    expect(screen.getByText(/Melhor horário/)).toBeInTheDocument();
    expect(screen.getByText(/10h - 12h|18h - 20h/)).toBeInTheDocument();
  });

  it('deve abrir WhatsApp ao clicar em enviar', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const sendButton = screen.getByText(/Enviar WhatsApp/);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/'),
        '_blank'
      );
    });
  });

  it('deve registrar atividade ao enviar mensagem', async () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, activityId: 'activity-123' })
    } as Response);

    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const sendButton = screen.getByText(/Enviar WhatsApp/);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/prospector/log-activity'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSendSuccess).toHaveBeenCalled();
    });
  });

  it('deve exibir templates diferentes por stage', () => {
    const { rerender } = render(
      <AIMessageGenerator
        lead={{ ...mockLead, stage: 'new' }}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const newStageMessage = (screen.getByRole('textbox') as HTMLTextAreaElement).value;

    rerender(
      <AIMessageGenerator
        lead={{ ...mockLead, stage: 'negotiating' }}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const negotiatingMessage = (screen.getByRole('textbox') as HTMLTextAreaElement).value;

    expect(newStageMessage).not.toBe(negotiatingMessage);
  });

  it('deve permitir edição manual da mensagem', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const newMessage = 'Mensagem customizada';
    
    fireEvent.change(textarea, { target: { value: newMessage } });

    expect(textarea.value).toBe(newMessage);
  });

  it('deve exibir erro ao falhar geração IA', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    // Aguarda erro aparecer automaticamente (geração acontece no mount)
    await waitFor(() => {
      expect(screen.getByText(/Erro ao gerar/)).toBeInTheDocument();
    });
  });

  it('deve exibir loading durante geração', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Test', alternatives: [], suggestedTime: '' })
      } as Response), 100))
    );

    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    // Verifica estado de loading inicial
    expect(screen.getByText(/Gerando/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Gerando/)).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('deve adaptar mensagem para SMS (160 chars)', () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    const smsButton = screen.getByText(/SMS/).closest('button');
    fireEvent.click(smsButton!);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value.length).toBeLessThanOrEqual(160);
  });

  it('deve formatar email com assunto e assinatura', async () => {
    render(
      <AIMessageGenerator
        lead={mockLead}
        prospectorName="Maria Santos"
        referralLink="https://servio.ai/ref/123"
        onSendSuccess={mockOnSendSuccess}
      />
    );

    // Busca botão por texto que contém "Email" (pode ter emoji)
    const emailButton = screen.getByText(/Email/).closest('button');
    fireEvent.click(emailButton!);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('Atenciosamente');
    });
  });
});
