/**
 * 🎯 JORNADA COMPLETA DO CLIENTE - Teste E2E
 *
 * Cobre: Cadastro → Login → Criar Serviço → Receber Propostas →
 *        Aceitar → Pagar → Acompanhar → Avaliar → Disputa (opcional)
 *
 * Este teste garante que TODO o fluxo do cliente funciona end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../src/AppContext';
import App from '../src/App';
import * as api from '../src/services/api';
import * as geminiService from '../src/services/geminiService';

// Mock das APIs
vi.mock('../src/services/api');
vi.mock('../src/services/geminiService');
vi.mock('../src/firebaseConfig', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(callback => {
      callback(null);
      return vi.fn();
    }),
  },
  db: {},
}));

const mockApi = api as any;
const mockGemini = geminiService as any;

describe('🎯 Jornada Completa do Cliente', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Setup mocks padrão
    mockApi.fetchUser.mockResolvedValue(null);
    mockApi.fetchJobs.mockResolvedValue([]);
    mockApi.fetchProviders.mockResolvedValue([]);
    mockGemini.enhanceJobDescription.mockResolvedValue({
      enhancedDescription: 'Descrição melhorada pela IA',
      suggestedCategory: 'encanamento',
      estimatedPrice: 150,
    });
  });

  it('CADASTRO E LOGIN: Cliente consegue se cadastrar e fazer login', async () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Clicar no botão de login/cadastro
    const entrarButton = await screen.findByRole('button', { name: /entrar/i });
    await user.click(entrarButton);

    // Modal de autenticação deve abrir
    const modal = await screen.findByRole('dialog', { name: /autenticação|login|cadastro/i });
    expect(modal).toBeInTheDocument();

    // Preencher formulário de cadastro
    const emailInput = within(modal).getByLabelText(/email/i);
    const senhaInput = within(modal).getByLabelText(/senha/i);

    await user.type(emailInput, 'cliente-teste@example.com');
    await user.type(senhaInput, 'senha123456');

    // Mock da criação de usuário
    mockApi.createUser.mockResolvedValue({
      id: 'client-123',
      email: 'cliente-teste@example.com',
      name: 'Cliente Teste',
      role: 'client',
      status: 'active',
    });

    // Submeter formulário
    const submitButton = within(modal).getByRole('button', { name: /cadastrar|criar conta/i });
    await user.click(submitButton);

    // Verificar que o usuário foi criado
    await waitFor(() => {
      expect(mockApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'cliente-teste@example.com',
          role: 'client',
        })
      );
    });
  });

  it('. CRIAR SERVIÇO COM IA: Cliente consegue criar serviço usando wizard com IA', async () => {
    // Mock usuário logado
    const mockUser = {
      id: 'client-123',
      email: 'cliente-teste@example.com',
      name: 'Cliente Teste',
      role: 'client',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockUser);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir wizard de criação de serviço
    const criarServicoButton = await screen.findByRole('button', {
      name: /solicitar serviço|criar serviço/i,
    });
    await user.click(criarServicoButton);

    // Wizard deve abrir
    const wizardModal = await screen.findByRole('dialog', {
      name: /criar serviço|solicitar serviço/i,
    });
    expect(wizardModal).toBeInTheDocument();

    // Descrever necessidade (mínimo 10 caracteres)
    const descricaoInput = within(wizardModal).getByLabelText(/descrição|o que você precisa/i);
    await user.type(descricaoInput, 'Preciso consertar um vazamento na pia da cozinha urgente');

    // IA deve processar e sugerir categoria/preço
    await waitFor(() => {
      expect(mockGemini.enhanceJobDescription).toHaveBeenCalled();
    });

    // Verificar que a descrição foi melhorada
    await waitFor(() => {
      const enhancedText = within(wizardModal).getByText(/descrição melhorada pela ia/i);
      expect(enhancedText).toBeInTheDocument();
    });

    // Selecionar urgência
    const urgenciaSelect = within(wizardModal).getByLabelText(/urgência/i);
    await user.selectOptions(urgenciaSelect, 'hoje');

    // Adicionar endereço
    const enderecoInput = within(wizardModal).getByLabelText(/endereço/i);
    await user.type(enderecoInput, 'Rua Teste, 123 - São Paulo');

    // Mock criação do job
    mockApi.createJob.mockResolvedValue({
      id: 'job-123',
      clientId: 'client-123',
      description: 'Descrição melhorada pela IA',
      category: 'encanamento',
      status: 'open',
      estimatedPrice: 150,
      urgency: 'hoje',
      address: 'Rua Teste, 123 - São Paulo',
      createdAt: new Date().toISOString(),
    });

    // Publicar serviço
    const publicarButton = within(wizardModal).getByRole('button', { name: /publicar|criar/i });
    await user.click(publicarButton);

    // Verificar que o job foi criado
    await waitFor(() => {
      expect(mockApi.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Descrição melhorada'),
          category: 'encanamento',
          urgency: 'hoje',
        })
      );
    });

    // Serviço deve aparecer na lista
    await waitFor(() => {
      const jobCard = screen.getByText(/vazamento|encanamento/i);
      expect(jobCard).toBeInTheDocument();
    });
  });

  it('. RECEBER E ACEITAR PROPOSTAS: Cliente vê propostas e aceita uma', async () => {
    // Mock usuário e job
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    const mockJob = {
      id: 'job-123',
      clientId: 'client-123',
      description: 'Consertar vazamento',
      status: 'open',
      estimatedPrice: 150,
    };

    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    // Mock propostas recebidas
    mockApi.fetchProposals.mockResolvedValue([
      {
        id: 'prop-1',
        jobId: 'job-123',
        providerId: 'prov-1',
        providerName: 'João Encanador',
        price: 120,
        message: 'Posso fazer hoje mesmo!',
        rating: 4.8,
        completedJobs: 50,
        distance: 2.5,
      },
      {
        id: 'prop-2',
        jobId: 'job-123',
        providerId: 'prov-2',
        providerName: 'Maria Encanadora',
        price: 150,
        message: 'Tenho disponibilidade amanhã',
        rating: 4.9,
        completedJobs: 80,
        distance: 3.2,
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir lista de propostas
    const verPropostasButton = await screen.findByRole('button', {
      name: /ver propostas|propostas/i,
    });
    await user.click(verPropostasButton);

    // Modal de propostas deve abrir
    const propostasModal = await screen.findByRole('dialog', { name: /propostas/i });
    expect(propostasModal).toBeInTheDocument();

    // Verificar que as 2 propostas aparecem
    await waitFor(() => {
      expect(within(propostasModal).getByText('João Encanador')).toBeInTheDocument();
      expect(within(propostasModal).getByText('Maria Encanadora')).toBeInTheDocument();
    });

    // Comparar propostas
    expect(within(propostasModal).getByText(/R\$ 120/)).toBeInTheDocument();
    expect(within(propostasModal).getByText(/R\$ 150/)).toBeInTheDocument();
    expect(within(propostasModal).getByText(/4\.8/)).toBeInTheDocument();
    expect(within(propostasModal).getByText(/4\.9/)).toBeInTheDocument();

    // Mock aceitar proposta
    mockApi.acceptProposal.mockResolvedValue({
      success: true,
      jobId: 'job-123',
      providerId: 'prov-1',
    });

    // Aceitar a primeira proposta (João, R$ 120)
    const aceitarButtons = within(propostasModal).getAllByRole('button', { name: /aceitar/i });
    await user.click(aceitarButtons[0]);

    // Confirmação
    await waitFor(() => {
      expect(mockApi.acceptProposal).toHaveBeenCalledWith('job-123', 'prop-1');
    });

    // Job deve mudar para "agendado"
    await waitFor(() => {
      expect(screen.getByText(/agendado|proposta aceita/i)).toBeInTheDocument();
    });
  });

  it('. PAGAMENTO STRIPE: Cliente processa pagamento com sucesso', async () => {
    // Mock usuário, job com proposta aceita
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    const mockJob = {
      id: 'job-123',
      clientId: 'client-123',
      status: 'scheduled',
      acceptedProviderId: 'prov-1',
      price: 120,
    };

    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir modal de pagamento
    const pagarButton = await screen.findByRole('button', { name: /pagar|efetuar pagamento/i });
    await user.click(pagarButton);

    // Modal de pagamento deve abrir
    const paymentModal = await screen.findByRole('dialog', { name: /pagamento/i });
    expect(paymentModal).toBeInTheDocument();

    // Verificar resumo
    expect(within(paymentModal).getByText(/R\$ 120/)).toBeInTheDocument();
    expect(within(paymentModal).getByText(/João Encanador|prestador/i)).toBeInTheDocument();

    // Mock criação de sessão Stripe
    mockApi.createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    // Mock redirecionamento (não vamos fazer o redirect real no teste)
    const mockRedirect = vi.fn();
    window.location.assign = mockRedirect as any;

    // Clicar no botão de pagar
    const confirmarPagamentoButton = within(paymentModal).getByRole('button', {
      name: /pagar|confirmar/i,
    });
    await user.click(confirmarPagamentoButton);

    // Verificar que a sessão foi criada
    await waitFor(() => {
      expect(mockApi.createCheckoutSession).toHaveBeenCalledWith({
        jobId: 'job-123',
        amount: 120,
        providerId: 'prov-1',
      });
    });

    // Verificar que tentou redirecionar para Stripe
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('checkout.stripe.com'));
    });
  });

  it('. ACOMPANHAMENTO: Cliente acompanha status e conversa via chat', async () => {
    // Mock usuário e job em andamento
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    const mockJob = {
      id: 'job-123',
      clientId: 'client-123',
      status: 'in_progress',
      acceptedProviderId: 'prov-1',
      providerName: 'João Encanador',
    };

    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    // Mock mensagens do chat
    mockApi.fetchMessages.mockResolvedValue([
      {
        id: 'msg-1',
        jobId: 'job-123',
        senderId: 'prov-1',
        senderName: 'João Encanador',
        text: 'Estou a caminho!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir chat
    const chatButton = await screen.findByRole('button', { name: /chat|conversar/i });
    await user.click(chatButton);

    // Modal de chat deve abrir
    const chatModal = await screen.findByRole('dialog', { name: /chat|mensagens/i });
    expect(chatModal).toBeInTheDocument();

    // Verificar mensagem anterior
    await waitFor(() => {
      expect(within(chatModal).getByText('Estou a caminho!')).toBeInTheDocument();
    });

    // Enviar nova mensagem
    const messageInput = within(chatModal).getByPlaceholderText(/digite sua mensagem/i);
    await user.type(messageInput, 'Perfeito! Aguardo você aqui.');

    // Mock enviar mensagem
    mockApi.sendMessage.mockResolvedValue({
      id: 'msg-2',
      jobId: 'job-123',
      senderId: 'client-123',
      text: 'Perfeito! Aguardo você aqui.',
      timestamp: new Date().toISOString(),
    });

    const sendButton = within(chatModal).getByRole('button', { name: /enviar/i });
    await user.click(sendButton);

    // Verificar que a mensagem foi enviada
    await waitFor(() => {
      expect(mockApi.sendMessage).toHaveBeenCalledWith({
        jobId: 'job-123',
        text: 'Perfeito! Aguardo você aqui.',
      });
    });

    // Mensagem deve aparecer no chat
    await waitFor(() => {
      expect(within(chatModal).getByText('Perfeito! Aguardo você aqui.')).toBeInTheDocument();
    });
  });

  it('. AVALIAÇÃO: Cliente avalia serviço concluído', async () => {
    // Mock usuário e job aguardando avaliação
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    const mockJob = {
      id: 'job-123',
      clientId: 'client-123',
      status: 'awaiting_review',
      acceptedProviderId: 'prov-1',
      providerName: 'João Encanador',
      price: 120,
    };

    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir modal de avaliação
    const avaliarButton = await screen.findByRole('button', { name: /avaliar|deixar avaliação/i });
    await user.click(avaliarButton);

    // Modal de avaliação deve abrir
    const reviewModal = await screen.findByRole('dialog', { name: /avaliação|avaliar/i });
    expect(reviewModal).toBeInTheDocument();

    // Selecionar 5 estrelas
    const stars = within(reviewModal).getAllByRole('button', { name: /estrela/i });
    await user.click(stars[4]); // 5ª estrela

    // IA gera comentário sugerido
    mockGemini.generateReviewComment.mockResolvedValue(
      'Excelente profissional! Trabalho impecável e pontual.'
    );

    await waitFor(() => {
      const suggestedComment = within(reviewModal).getByText(/excelente profissional/i);
      expect(suggestedComment).toBeInTheDocument();
    });

    // Editar comentário
    const commentTextarea = within(reviewModal).getByLabelText(/comentário|avaliação/i);
    await user.clear(commentTextarea);
    await user.type(commentTextarea, 'Serviço perfeito! Recomendo muito.');

    // Mock submeter avaliação
    mockApi.submitReview.mockResolvedValue({
      id: 'review-123',
      jobId: 'job-123',
      providerId: 'prov-1',
      rating: 5,
      comment: 'Serviço perfeito! Recomendo muito.',
    });

    // Submeter avaliação
    const submitButton = within(reviewModal).getByRole('button', { name: /enviar|confirmar/i });
    await user.click(submitButton);

    // Verificar que a avaliação foi enviada
    await waitFor(() => {
      expect(mockApi.submitReview).toHaveBeenCalledWith({
        jobId: 'job-123',
        providerId: 'prov-1',
        rating: 5,
        comment: 'Serviço perfeito! Recomendo muito.',
      });
    });

    // Job deve mudar para "concluído"
    await waitFor(() => {
      expect(screen.getByText(/concluído|serviço finalizado/i)).toBeInTheDocument();
    });
  });

  it('. DISPUTA: Cliente pode abrir disputa se necessário', async () => {
    // Mock usuário e job em andamento
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    const mockJob = {
      id: 'job-123',
      clientId: 'client-123',
      status: 'in_progress',
      acceptedProviderId: 'prov-1',
      providerName: 'João Encanador',
    };

    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir modal de disputa
    const abrirDisputaButton = await screen.findByRole('button', {
      name: /problema|abrir disputa|contestar/i,
    });
    await user.click(abrirDisputaButton);

    // Modal de disputa deve abrir
    const disputeModal = await screen.findByRole('dialog', { name: /disputa|problema/i });
    expect(disputeModal).toBeInTheDocument();

    // Descrever motivo (mínimo 20 caracteres)
    const reasonTextarea = within(disputeModal).getByLabelText(/motivo|descrição/i);
    await user.type(
      reasonTextarea,
      'O serviço não foi realizado conforme combinado. Há vazamento ainda.'
    );

    // Mock criar disputa
    mockApi.createDispute.mockResolvedValue({
      id: 'dispute-123',
      jobId: 'job-123',
      clientId: 'client-123',
      providerId: 'prov-1',
      reason: 'O serviço não foi realizado conforme combinado. Há vazamento ainda.',
      status: 'open',
      createdAt: new Date().toISOString(),
    });

    // Submeter disputa
    const submitButton = within(disputeModal).getByRole('button', {
      name: /abrir disputa|enviar/i,
    });
    await user.click(submitButton);

    // Verificar que a disputa foi criada
    await waitFor(() => {
      expect(mockApi.createDispute).toHaveBeenCalledWith({
        jobId: 'job-123',
        reason: expect.stringContaining('não foi realizado conforme combinado'),
      });
    });

    // Job deve mudar para "em_disputa"
    await waitFor(() => {
      expect(screen.getByText(/em disputa|aguardando mediação/i)).toBeInTheDocument();
    });
  });

  it('. GERENCIAR ITENS: Cliente pode cadastrar e gerenciar itens', async () => {
    // Mock usuário
    const mockUser = { id: 'client-123', role: 'client', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockUser);
    mockApi.fetchItems.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para aba de itens
    const itensTab = await screen.findByRole('tab', { name: /meus itens|itens/i });
    await user.click(itensTab);

    // Abrir modal de adicionar item
    const addItemButton = await screen.findByRole('button', { name: /adicionar item|novo item/i });
    await user.click(addItemButton);

    // Modal de adicionar item deve abrir
    const itemModal = await screen.findByRole('dialog', { name: /adicionar item|novo item/i });
    expect(itemModal).toBeInTheDocument();

    // Preencher formulário
    const nameInput = within(itemModal).getByLabelText(/nome|descrição/i);
    await user.type(nameInput, 'Geladeira Brastemp');

    const categorySelect = within(itemModal).getByLabelText(/categoria|tipo/i);
    await user.selectOptions(categorySelect, 'eletrodoméstico');

    // Mock criar item
    mockApi.createItem.mockResolvedValue({
      id: 'item-123',
      clientId: 'client-123',
      name: 'Geladeira Brastemp',
      category: 'eletrodoméstico',
      createdAt: new Date().toISOString(),
    });

    // Submeter formulário
    const submitButton = within(itemModal).getByRole('button', { name: /adicionar|salvar/i });
    await user.click(submitButton);

    // Verificar que o item foi criado
    await waitFor(() => {
      expect(mockApi.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Geladeira Brastemp',
          category: 'eletrodoméstico',
        })
      );
    });

    // Item deve aparecer na lista
    await waitFor(() => {
      expect(screen.getByText('Geladeira Brastemp')).toBeInTheDocument();
    });
  });
});
