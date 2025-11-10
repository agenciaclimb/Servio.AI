import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIJobRequestWizard from '../components/AIJobRequestWizard';
import * as geminiService from '../services/geminiService';

// Mock do serviço Gemini
vi.mock('../services/geminiService', () => ({
  enhanceJobRequest: vi.fn(),
}));

// Mock do Firebase auth
vi.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('fake-token'),
    },
  },
}));

describe('AIJobRequestWizard', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o step inicial com campo de descrição', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    // Label do campo inicial
    expect(screen.getByText(/Descreva sua necessidade/i)).toBeInTheDocument();
    // Placeholder genérico começa com "Ex:" – tornamos o matcher mais flexível
    expect(screen.getByPlaceholderText(/Ex:/i)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-analyze-button')).toBeInTheDocument();
  });

  it('valida descrição muito curta', async () => {
    const mockEnhance = vi.mocked(geminiService.enhanceJobRequest);
    
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/Ex:/i);
    const analyzeButton = screen.getByTestId('wizard-analyze-button');

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/descreva um pouco mais/i)).toBeInTheDocument();
    });

    expect(mockEnhance).not.toHaveBeenCalled();
  });

  it('chama enhanceJobRequest e mostra review screen', async () => {
    const mockEnhance = vi.mocked(geminiService.enhanceJobRequest);
    mockEnhance.mockResolvedValueOnce({
      enhancedDescription: 'Instalação de ventilador de teto com cabeamento adequado',
      suggestedCategory: 'eletricista',
      suggestedServiceType: 'personalizado',
      estimatedCost: { min: 150, max: 300 },
    });

    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

  const input = screen.getByPlaceholderText(/Ex:/i);
    const analyzeButton = screen.getByTestId('wizard-analyze-button');

    fireEvent.change(input, { target: { value: 'Preciso instalar um ventilador de teto' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Revise o seu Pedido/i)).toBeInTheDocument();
    });

    expect(mockEnhance).toHaveBeenCalledWith(
      'Preciso instalar um ventilador de teto',
      '',
      0
    );

    expect(screen.getByDisplayValue(/Instalação de ventilador/i)).toBeInTheDocument();
  });

  it('abre direto no review quando recebe initialData', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Conserto de torneira',
          category: 'encanador',
          serviceType: 'personalizado',
          urgency: '3dias',
        }}
      />
    );

    expect(screen.getByText(/Revise o seu Pedido/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Conserto de torneira/i)).toBeInTheDocument();
  });

  it('permite editar descrição no review', async () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Texto original',
          category: 'pintor',
          serviceType: 'personalizado',
          urgency: 'amanha',
        }}
      />
    );

    const textarea = screen.getByDisplayValue('Texto original');
    fireEvent.change(textarea, { target: { value: 'Texto editado pelo usuário' } });

    expect(screen.getByDisplayValue('Texto editado pelo usuário')).toBeInTheDocument();
  });

  it('permite selecionar urgência', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Teste',
          category: 'pedreiro',
          serviceType: 'personalizado',
          urgency: '3dias',
        }}
      />
    );

    const hojeBotao = screen.getByText('Hoje');
    fireEvent.click(hojeBotao);

    // Verifica que o botão está selecionado (classe bg-blue-600)
    expect(hojeBotao).toHaveClass('bg-blue-600');
  });

  it('permite alternar entre modo Normal e Leilão', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Teste',
          category: 'jardineiro',
          serviceType: 'personalizado',
          urgency: '1semana',
        }}
      />
    );

    const leilaoBotao = screen.getByText('Leilão');
    fireEvent.click(leilaoBotao);

    // Deve mostrar opções de duração do leilão
    expect(screen.getByText('Duração do Leilão')).toBeInTheDocument();
    expect(screen.getByText('24 Horas')).toBeInTheDocument();
  });

  it('fecha o modal ao clicar em Cancelar', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Teste',
          category: 'marceneiro',
          serviceType: 'personalizado',
          urgency: '3dias',
        }}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('chama onSubmit com dados corretos ao publicar', async () => {
    global.fetch = vi.fn();

    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={{
          description: 'Pintura de sala',
          category: 'pintor',
          serviceType: 'tabelado',
          urgency: 'amanha',
          fixedPrice: 500,
        }}
      />
    );

    const publishButton = screen.getByTestId('wizard-publish-button');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Pintura de sala',
          category: 'pintor',
          serviceType: 'tabelado',
          urgency: 'amanha',
          fixedPrice: 500,
        })
      );
    });
  });

  it('chama onClose ao clicar no botão X', () => {
    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const closeButton = screen.getByTestId('wizard-close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('inicia loading automaticamente quando recebe initialPrompt', async () => {
    const mockEnhance = vi.mocked(geminiService.enhanceJobRequest);
    mockEnhance.mockResolvedValueOnce({
      enhancedDescription: 'Troca de fechadura com cilindro de alta segurança',
      suggestedCategory: 'chaveiro',
      suggestedServiceType: 'diagnostico',
      estimatedCost: { min: 100, max: 250 },
    });

    render(
      <AIJobRequestWizard
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialPrompt="Preciso trocar a fechadura da porta"
      />
    );

    // Deve mostrar loading spinner
    await waitFor(() => {
      expect(mockEnhance).toHaveBeenCalledWith(
        'Preciso trocar a fechadura da porta',
        undefined,
        undefined
      );
    });

    // Depois deve mostrar review
    await waitFor(() => {
      expect(screen.getByText(/Revise o seu Pedido/i)).toBeInTheDocument();
    });
  });
});
