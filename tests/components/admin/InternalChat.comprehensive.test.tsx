
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import AIInternalChat from '../../../components/AIInternalChat';
import * as geminiService from '../../../services/geminiService';
import { User } from '../../../types';

// Mock do geminiService com Vitest
vi.mock('../../../services/geminiService');
const mockedGetChatAssistance = vi.mocked(geminiService.getChatAssistance);

// Mock para a função scrollIntoView, que não existe no JSDOM
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// Dados de mock para usuários
const prospectorUser: User = {
  id: 'user-1',
  name: 'João Prospector',
  email: 'joao@servio.ai',
  type: 'prospector',
  createdAt: new Date().toISOString(),
};

const providerUser: User = {
  id: 'user-2',
  name: 'Maria Prestadora',
  email: 'maria@servio.ai',
  type: 'provider',
  createdAt: new Date().toISOString(),
};

describe('AUDITORIA COMPLETA - Componente AIInternalChat', () => {

  beforeEach(() => {
    // Limpar mocks antes de cada teste
    mockedGetChatAssistance.mockClear();
    vi.clearAllMocks(); // Limpa todos os mocks, incluindo o de scrollIntoView se necessário
  });

  // =================================================================
  // 1. TESTES DE RENDERIZAÇÃO INICIAL
  // =================================================================
  describe('Cenário 1: Renderização Inicial e Boas-Vindas', () => {
    
    it('Deve exibir a mensagem de boas-vindas e ações rápidas para "prospector"', () => {
      render(<AIInternalChat currentUser={prospectorUser} />);
      
      // Valida a mensagem de boas-vindas
      expect(screen.getByText(/Olá! 👋 Sou seu assistente de IA para prospecção/)).toBeInTheDocument();
      
      // Valida as ações rápidas
      expect(screen.getByText('Como abordar um novo prospect?')).toBeInTheDocument();
      expect(screen.getByText('Template de follow-up')).toBeInTheDocument();
    });

    it('Deve exibir a mensagem de boas-vindas e ações rápidas para "provider"', () => {
      render(<AIInternalChat currentUser={providerUser} />);
      
      // Valida a mensagem de boas-vindas
      expect(screen.getByText(/Olá! 👋 Sou seu assistente de IA/)).toBeInTheDocument();
      expect(screen.queryByText(/para prospecção/)).not.toBeInTheDocument();

      // Valida as ações rápidas
      expect(screen.getByText('Como melhorar meu perfil?')).toBeInTheDocument();
      expect(screen.getByText('Dicas de precificação')).toBeInTheDocument();
    });
  });

  // =================================================================
  // 2. TESTES DE FLUXO DE MENSAGENS (CAMINHO FELIZ)
  // =================================================================
  describe('Cenário 2: Fluxo de Mensagens - Caminho Feliz', () => {

    it('Deve enviar uma mensagem, exibir loading e receber uma resposta da IA', async () => {
      mockedGetChatAssistance.mockResolvedValue({
        displayText: 'Esta é uma ótima pergunta! Para abordar um novo prospect, você deve...',
        json: null
      });

      render(<AIInternalChat currentUser={prospectorUser} />);
      
      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: /enviar mensagem/i });

      // Usuário digita e envia a mensagem
      fireEvent.change(input, { target: { value: 'Como devo abordar um prospect?' } });
      fireEvent.click(sendButton);

      // Valida se a mensagem do usuário aparece na tela
      expect(await screen.findByText('Como devo abordar um prospect?')).toBeInTheDocument();
      
      // Valida se o botão está desabilitado durante o carregamento
      expect(sendButton).toBeDisabled();

      // Valida se a resposta da IA é exibida
      expect(await screen.findByText(/Esta é uma ótima pergunta!/)).toBeInTheDocument();
      
      // Valida que o loading sumiu e o botão está pronto para novo envio
      // O botão deve permanecer desabilitado pois o input está vazio
      expect(sendButton).toBeDisabled();

      // Digita uma nova mensagem
      fireEvent.change(input, { target: { value: 'Obrigado!' } });

      // Agora, com texto no input, o botão deve estar habilitado
      expect(sendButton).not.toBeDisabled();
    });
  });
  
  // =================================================================
  // 3. TESTES DE TRATAMENTO DE ERROS
  // =================================================================
  describe('Cenário 3: Tratamento de Erros da API', () => {

    it('Deve exibir uma mensagem de erro se a chamada para a API falhar', async () => {
      mockedGetChatAssistance.mockRejectedValue(new Error('API Failure'));

      render(<AIInternalChat currentUser={providerUser} />);
      
      fireEvent.change(screen.getByPlaceholderText('Digite sua mensagem...'), { target: { value: 'Ajuda!' } });
      fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      // Valida se a mensagem de erro é exibida no chat
      expect(await screen.findByText(/Desculpe, ocorreu um erro ao processar sua mensagem/)).toBeInTheDocument();
    });
  });

  // =================================================================
  // 4. TESTES DE INTERAÇÃO E CONTEXTO
  // =================================================================
  describe('Cenário 4: Interação, Contexto e UI', () => {

    it('Deve usar uma ação rápida para preencher o input', () => {
      render(<AIInternalChat currentUser={prospectorUser} />);
      const quickActionButton = screen.getByText('Template de follow-up');
      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      
      fireEvent.click(quickActionButton);

      expect(input).toHaveValue('Template de follow-up');
    });

    it('Deve enviar a propriedade de contexto para a API', async () => {
      mockedGetChatAssistance.mockResolvedValue({ displayText: 'Resposta...', json: null });
      const contextString = 'Prospect ID: 12345, Status: Qualificado';
      
      render(<AIInternalChat currentUser={prospectorUser} context={contextString} />);
      
      fireEvent.change(screen.getByPlaceholderText('Digite sua mensagem...'), { target: { value: 'O que faço agora?' } });
      fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

      await waitFor(() => {
        expect(mockedGetChatAssistance).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              senderId: 'system',
              text: `Context: ${contextString}`
            })
          ]),
          prospectorUser.type
        );
      });
    });

    it('Deve chamar a função onClose ao clicar no botão de fechar', () => {
      const handleClose = vi.fn();
      render(<AIInternalChat currentUser={prospectorUser} onClose={handleClose} />);
      
      const closeButton = screen.getByLabelText('Fechar chat');
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
