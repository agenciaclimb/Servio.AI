/**
 * 🎯 JORNADA COMPLETA DO PRESTADOR - Teste E2E
 * 
 * Cobre: Cadastro → Onboarding (4 steps + Stripe Connect) → Aprovação Admin →
 *        Ver Jobs → Propor → Aceito → Executar → Marcar Concluído → Receber Pagamento
 * 
 * Este teste garante que TODO o fluxo do prestador funciona end-to-end
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
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
  },
  db: {},
}));

const mockApi = api as any;
const mockGemini = geminiService as any;

describe('🎯 Jornada Completa do Prestador', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    mockApi.fetchUser.mockResolvedValue(null);
    mockApi.fetchJobs.mockResolvedValue([]);
    mockApi.fetchProviders.mockResolvedValue([]);
  });

  it('. CADASTRO: Prestador consegue se cadastrar escolhendo o papel correto', async () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Clicar no botão "Seja um Prestador"
    const sejaPrestadorButton = await screen.findByRole('button', { name: /seja um prestador|quero prestar/i });
    await user.click(sejaPrestadorButton);

    // Modal de autenticação deve abrir com opção de prestador
    const modal = await screen.findByRole('dialog', { name: /autenticação|cadastro/i });
    expect(modal).toBeInTheDocument();

    // Selecionar papel de prestador
    const roleSelect = within(modal).getByLabelText(/tipo de conta|perfil/i);
    await user.selectOptions(roleSelect, 'provider');

    // Preencher formulário
    const emailInput = within(modal).getByLabelText(/email/i);
    const senhaInput = within(modal).getByLabelText(/senha/i);
    const nomeInput = within(modal).getByLabelText(/nome/i);
    
    await user.type(emailInput, 'prestador-teste@example.com');
    await user.type(senhaInput, 'senha123456');
    await user.type(nomeInput, 'João Prestador');

    // Mock criação do usuário
    mockApi.createUser.mockResolvedValue({
      id: 'prov-123',
      email: 'prestador-teste@example.com',
      name: 'João Prestador',
      role: 'provider',
      status: 'pending', // Aguardando onboarding
    });

    // Submeter formulário
    const submitButton = within(modal).getByRole('button', { name: /cadastrar|criar conta/i });
    await user.click(submitButton);

    // Verificar que o usuário foi criado
    await waitFor(() => {
      expect(mockApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'prestador-teste@example.com',
          role: 'provider',
        })
      );
    });

    // Deve redirecionar para onboarding
    await waitFor(() => {
      expect(screen.getByText(/complete seu perfil|onboarding/i)).toBeInTheDocument();
    });
  });

  it('. ONBOARDING PASSO 1: Completar perfil básico', async () => {
    // Mock prestador logado (status pending)
    const mockProvider = {
      id: 'prov-123',
      email: 'prestador-teste@example.com',
      name: 'João Prestador',
      role: 'provider',
      status: 'pending',
      onboardingStep: 1,
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Passo 1: Informações básicas
    const step1Title = await screen.findByText(/informações básicas|dados pessoais/i);
    expect(step1Title).toBeInTheDocument();

    // Preencher WhatsApp
    const whatsappInput = screen.getByLabelText(/whatsapp|telefone/i);
    await user.type(whatsappInput, '11999887766');

    // Preencher endereço/localização
    const addressInput = screen.getByLabelText(/endereço|localização/i);
    await user.type(addressInput, 'Rua das Flores, 100 - São Paulo, SP');

    // Mock atualizar usuário
    mockApi.updateUser.mockResolvedValue({
      ...mockProvider,
      whatsapp: '11999887766',
      address: 'Rua das Flores, 100 - São Paulo, SP',
      onboardingStep: 2,
    });

    // Avançar para próximo passo
    const nextButton = screen.getByRole('button', { name: /próximo|continuar/i });
    await user.click(nextButton);

    // Verificar que os dados foram salvos
    await waitFor(() => {
      expect(mockApi.updateUser).toHaveBeenCalledWith(
        'prov-123',
        expect.objectContaining({
          whatsapp: '11999887766',
          address: expect.stringContaining('Rua das Flores'),
        })
      );
    });
  });

  it('. ONBOARDING PASSO 2: Adicionar especialidades', async () => {
    // Mock prestador no passo 2
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'pending',
      onboardingStep: 2,
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Passo 2: Especialidades
    const step2Title = await screen.findByText(/especialidades|áreas de atuação/i);
    expect(step2Title).toBeInTheDocument();

    // Selecionar especialidades (mínimo 1, máximo 10)
    const encanamentoCheckbox = screen.getByLabelText(/encanamento/i);
    const eletricistaCheckbox = screen.getByLabelText(/eletricista|elétrica/i);
    
    await user.click(encanamentoCheckbox);
    await user.click(eletricistaCheckbox);

    // Mock atualizar usuário
    mockApi.updateUser.mockResolvedValue({
      ...mockProvider,
      specialties: ['encanamento', 'eletricista'],
      onboardingStep: 3,
    });

    // Avançar
    const nextButton = screen.getByRole('button', { name: /próximo|continuar/i });
    await user.click(nextButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.updateUser).toHaveBeenCalledWith(
        'prov-123',
        expect.objectContaining({
          specialties: expect.arrayContaining(['encanamento', 'eletricista']),
        })
      );
    });
  });

  it('. ONBOARDING PASSO 3: Adicionar biografia', async () => {
    // Mock prestador no passo 3
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'pending',
      onboardingStep: 3,
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Passo 3: Biografia
    const step3Title = await screen.findByText(/sobre você|biografia/i);
    expect(step3Title).toBeInTheDocument();

    // Preencher biografia (mínimo 50 caracteres)
    const bioTextarea = screen.getByLabelText(/biografia|sobre você/i);
    await user.type(
      bioTextarea,
      'Sou encanador e eletricista há 10 anos. Tenho experiência em residências e comércios. Trabalho com qualidade e pontualidade.'
    );

    // Contador de caracteres deve mostrar progresso
    const charCounter = screen.getByText(/50|caracteres/i);
    expect(charCounter).toBeInTheDocument();

    // Mock atualizar usuário
    mockApi.updateUser.mockResolvedValue({
      ...mockProvider,
      bio: 'Sou encanador e eletricista há 10 anos...',
      onboardingStep: 4,
    });

    // Avançar
    const nextButton = screen.getByRole('button', { name: /próximo|continuar/i });
    await user.click(nextButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.updateUser).toHaveBeenCalledWith(
        'prov-123',
        expect.objectContaining({
          bio: expect.stringContaining('encanador e eletricista há 10 anos'),
        })
      );
    });
  });

  it('. ONBOARDING PASSO 4: Stripe Connect', async () => {
    // Mock prestador no passo 4
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'pending',
      onboardingStep: 4,
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Passo 4: Stripe Connect
    const step4Title = await screen.findByText(/forma de recebimento|stripe/i);
    expect(step4Title).toBeInTheDocument();

    // Mock criar conta Stripe Connect
    mockApi.createStripeConnectAccount.mockResolvedValue({
      accountId: 'acct_123',
      onboardingUrl: 'https://connect.stripe.com/setup/acct_123',
    });

    // Mock redirecionamento
    const mockRedirect = vi.fn();
    window.location.assign = mockRedirect as any;

    // Clicar no botão de conectar Stripe
    const connectStripeButton = screen.getByRole('button', { name: /conectar stripe|vincular conta/i });
    await user.click(connectStripeButton);

    // Verificar que a conta foi criada
    await waitFor(() => {
      expect(mockApi.createStripeConnectAccount).toHaveBeenCalledWith('prov-123');
    });

    // Verificar redirecionamento para Stripe
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('connect.stripe.com')
      );
    });
  });

  it('. APROVAÇÃO ADMIN: Aguardar aprovação do admin', async () => {
    // Mock prestador com onboarding completo, aguardando aprovação
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'pending_approval',
      onboardingStep: 4,
      stripeAccountId: 'acct_123',
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Mensagem de aguardando aprovação
    const waitingMessage = await screen.findByText(/aguardando aprovação|em análise/i);
    expect(waitingMessage).toBeInTheDocument();

    // Não deve ter acesso aos jobs ainda
    expect(screen.queryByText(/jobs abertos|ver serviços/i)).not.toBeInTheDocument();
  });

  it('. VER JOBS: Prestador aprovado vê jobs disponíveis', async () => {
    // Mock prestador aprovado
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
      specialties: ['encanamento', 'eletricista'],
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock jobs abertos compatíveis com especialidades
    mockApi.fetchJobs.mockResolvedValue([
      {
        id: 'job-1',
        clientId: 'client-1',
        description: 'Vazamento na pia',
        category: 'encanamento',
        status: 'open',
        estimatedPrice: 150,
        urgency: 'hoje',
        distance: 2.5,
      },
      {
        id: 'job-2',
        clientId: 'client-2',
        description: 'Trocar tomadas',
        category: 'eletricista',
        status: 'open',
        estimatedPrice: 100,
        urgency: 'amanhã',
        distance: 5.0,
      },
      {
        id: 'job-3',
        clientId: 'client-3',
        description: 'Pintar parede',
        category: 'pintura',
        status: 'open',
        estimatedPrice: 300,
        urgency: '3dias',
        distance: 1.0,
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Verificar que os 2 jobs compatíveis aparecem (não o de pintura)
    await waitFor(() => {
      expect(screen.getByText(/vazamento na pia/i)).toBeInTheDocument();
      expect(screen.getByText(/trocar tomadas/i)).toBeInTheDocument();
      expect(screen.queryByText(/pintar parede/i)).not.toBeInTheDocument();
    });

    // Filtrar por categoria
    const categoryFilter = screen.getByLabelText(/categoria|filtrar/i);
    await user.selectOptions(categoryFilter, 'encanamento');

    // Apenas o job de encanamento deve aparecer
    await waitFor(() => {
      expect(screen.getByText(/vazamento na pia/i)).toBeInTheDocument();
      expect(screen.queryByText(/trocar tomadas/i)).not.toBeInTheDocument();
    });
  });

  it('. PROPOR SERVIÇO: Prestador envia proposta personalizada', async () => {
    // Mock prestador aprovado
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock job disponível
    const mockJob = {
      id: 'job-1',
      description: 'Vazamento na pia da cozinha',
      category: 'encanamento',
      estimatedPrice: 150,
    };
    mockApi.fetchJobs.mockResolvedValue([mockJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Clicar no job para ver detalhes
    const jobCard = await screen.findByText(/vazamento na pia/i);
    await user.click(jobCard);

    // Botão de propor deve aparecer
    const propoButton = await screen.findByRole('button', { name: /enviar proposta|propor/i });
    await user.click(propoButton);

    // Modal de proposta deve abrir
    const proposalModal = await screen.findByRole('dialog', { name: /proposta|enviar/i });
    expect(proposalModal).toBeInTheDocument();

    // IA gera mensagem de proposta
    mockGemini.generateProposalMessage.mockResolvedValue(
      'Olá! Sou especialista em encanamento e posso resolver seu vazamento hoje mesmo. Preço justo e trabalho de qualidade garantida!'
    );

    await waitFor(() => {
      const aiMessage = within(proposalModal).getByText(/especialista em encanamento/i);
      expect(aiMessage).toBeInTheDocument();
    });

    // Definir preço
    const priceInput = within(proposalModal).getByLabelText(/preço|valor/i);
    await user.clear(priceInput);
    await user.type(priceInput, '120');

    // Editar mensagem
    const messageTextarea = within(proposalModal).getByLabelText(/mensagem/i);
    await user.clear(messageTextarea);
    await user.type(messageTextarea, 'Olá! Posso fazer hoje às 14h. Preço: R$ 120. Trabalho garantido!');

    // Mock enviar proposta
    mockApi.createProposal.mockResolvedValue({
      id: 'prop-123',
      jobId: 'job-1',
      providerId: 'prov-123',
      price: 120,
      message: 'Olá! Posso fazer hoje às 14h...',
      status: 'pending',
    });

    // Enviar proposta
    const submitButton = within(proposalModal).getByRole('button', { name: /enviar/i });
    await user.click(submitButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.createProposal).toHaveBeenCalledWith({
        jobId: 'job-1',
        price: 120,
        message: expect.stringContaining('Posso fazer hoje às 14h'),
      });
    });

    // Confirmação
    await waitFor(() => {
      expect(screen.getByText(/proposta enviada/i)).toBeInTheDocument();
    });
  });

  it('. PROPOSTA ACEITA: Prestador recebe notificação e job aparece em "Meus Jobs"', async () => {
    // Mock prestador com proposta aceita
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock job aceito
    const mockJob = {
      id: 'job-1',
      description: 'Vazamento na pia',
      status: 'scheduled',
      acceptedProviderId: 'prov-123',
      price: 120,
    };
    mockApi.fetchMyJobs.mockResolvedValue([mockJob]);

    // Mock notificação
    mockApi.fetchNotifications.mockResolvedValue([
      {
        id: 'notif-1',
        userId: 'prov-123',
        type: 'proposal_accepted',
        message: 'Sua proposta foi aceita!',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Badge de notificações não lidas
    const notificationBadge = await screen.findByText('1');
    expect(notificationBadge).toBeInTheDocument();

    // Abrir notificações
    const notificationButton = screen.getByRole('button', { name: /notificações/i });
    await user.click(notificationButton);

    // Notificação de proposta aceita
    const notification = await screen.findByText(/sua proposta foi aceita/i);
    expect(notification).toBeInTheDocument();

    // Navegar para "Meus Jobs"
    const meusJobsTab = screen.getByRole('tab', { name: /meus jobs/i });
    await user.click(meusJobsTab);

    // Job deve aparecer
    await waitFor(() => {
      expect(screen.getByText(/vazamento na pia/i)).toBeInTheDocument();
      expect(screen.getByText(/agendado/i)).toBeInTheDocument();
    });
  });

  it('🔟 EXECUTAR SERVIÇO: Prestador atualiza status conforme execução', async () => {
    // Mock prestador com job aceito
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock job agendado
    const mockJob = {
      id: 'job-1',
      description: 'Vazamento na pia',
      status: 'scheduled',
      acceptedProviderId: 'prov-123',
      price: 120,
    };
    mockApi.fetchMyJobs.mockResolvedValue([mockJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Abrir detalhes do job
    const jobCard = await screen.findByText(/vazamento na pia/i);
    await user.click(jobCard);

    // Marcar como "A caminho"
    const aCaminhoButton = await screen.findByRole('button', { name: /a caminho|estou indo/i });
    
    mockApi.updateJobStatus.mockResolvedValue({
      ...mockJob,
      status: 'on_the_way',
    });
    
    await user.click(aCaminhoButton);

    await waitFor(() => {
      expect(mockApi.updateJobStatus).toHaveBeenCalledWith('job-1', 'on_the_way');
      expect(screen.getByText(/a caminho/i)).toBeInTheDocument();
    });

    // Marcar como "Em andamento"
    const emAndamentoButton = await screen.findByRole('button', { name: /em andamento|iniciar/i });
    
    mockApi.updateJobStatus.mockResolvedValue({
      ...mockJob,
      status: 'in_progress',
    });
    
    await user.click(emAndamentoButton);

    await waitFor(() => {
      expect(mockApi.updateJobStatus).toHaveBeenCalledWith('job-1', 'in_progress');
      expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
    });

    // Marcar como "Concluído"
    const concluidoButton = await screen.findByRole('button', { name: /concluir|finalizar/i });
    
    mockApi.updateJobStatus.mockResolvedValue({
      ...mockJob,
      status: 'awaiting_review',
    });
    
    await user.click(concluidoButton);

    await waitFor(() => {
      expect(mockApi.updateJobStatus).toHaveBeenCalledWith('job-1', 'awaiting_review');
      expect(screen.getByText(/aguardando avaliação/i)).toBeInTheDocument();
    });
  });

  it('.1️⃣ RECEBER PAGAMENTO: Prestador vê ganhos após avaliação', async () => {
    // Mock prestador
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
      rating: 4.8,
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock job concluído e avaliado
    const mockJob = {
      id: 'job-1',
      description: 'Vazamento na pia',
      status: 'completed',
      acceptedProviderId: 'prov-123',
      price: 120,
      reviewRating: 5,
      completedAt: new Date().toISOString(),
    };
    mockApi.fetchMyJobs.mockResolvedValue([mockJob]);

    // Mock ganhos
    mockApi.fetchEarnings.mockResolvedValue([
      {
        id: 'earning-1',
        jobId: 'job-1',
        providerId: 'prov-123',
        amount: 120,
        commission: 0.20, // 20% da plataforma
        netAmount: 96, // R$ 96 para o prestador (80%)
        status: 'paid',
        paidAt: new Date().toISOString(),
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para aba de Ganhos
    const ganhosTab = await screen.findByRole('tab', { name: /ganhos|pagamentos/i });
    await user.click(ganhosTab);

    // Verificar ganhos
    await waitFor(() => {
      expect(screen.getByText(/R\$ 96/)).toBeInTheDocument(); // Valor líquido
      expect(screen.getByText(/vazamento na pia/i)).toBeInTheDocument();
      expect(screen.getByText(/pago|concluído/i)).toBeInTheDocument();
    });

    // Verificar comissão calculada (rating 4.8 = 80% para prestador)
    const comissaoInfo = screen.getByText(/comissão.*20%/i);
    expect(comissaoInfo).toBeInTheDocument();

    // Total de ganhos
    const totalGanhos = screen.getByText(/total.*R\$ 96/i);
    expect(totalGanhos).toBeInTheDocument();
  });

  it('.2️⃣ LEILÃO: Prestador participa de leilão e ganha job', async () => {
    // Mock prestador
    const mockProvider = {
      id: 'prov-123',
      role: 'provider',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockProvider);

    // Mock job em leilão
    const mockAuctionJob = {
      id: 'job-auction',
      description: 'Vazamento urgente',
      category: 'encanamento',
      jobMode: 'auction',
      status: 'auction',
      currentBid: 150,
      bidsCount: 3,
      auctionEndsAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
    };
    mockApi.fetchJobs.mockResolvedValue([mockAuctionJob]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Ver jobs em leilão
    const auctionFilter = await screen.findByLabelText(/leilão|auction/i);
    await user.click(auctionFilter);

    // Job em leilão deve aparecer
    const auctionJobCard = await screen.findByText(/vazamento urgente/i);
    expect(auctionJobCard).toBeInTheDocument();

    // Abrir sala de leilão
    await user.click(auctionJobCard);

    const auctionModal = await screen.findByRole('dialog', { name: /leilão|auction/i });
    expect(auctionModal).toBeInTheDocument();

    // Ver lance atual
    expect(within(auctionModal).getByText(/R\$ 150/)).toBeInTheDocument();
    expect(within(auctionModal).getByText(/3 lances/i)).toBeInTheDocument();

    // Dar lance menor
    const bidInput = within(auctionModal).getByLabelText(/seu lance|valor/i);
    await user.type(bidInput, '140');

    // Mock criar lance
    mockApi.createBid.mockResolvedValue({
      id: 'bid-123',
      jobId: 'job-auction',
      providerId: 'prov-123',
      amount: 140,
      createdAt: new Date().toISOString(),
    });

    const submitBidButton = within(auctionModal).getByRole('button', { name: /dar lance|enviar/i });
    await user.click(submitBidButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.createBid).toHaveBeenCalledWith({
        jobId: 'job-auction',
        amount: 140,
      });
    });

    // Confirmação
    await waitFor(() => {
      expect(within(auctionModal).getByText(/lance enviado|você está ganhando/i)).toBeInTheDocument();
    });
  });
});
