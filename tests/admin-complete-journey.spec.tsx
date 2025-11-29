/**
 * 🎯 JORNADA COMPLETA DO ADMIN - Teste E2E
 * 
 * Cobre: Login → Dashboard → Aprovar Prestadores → Gerenciar Usuários →
 *        Gerenciar Jobs → Mediar Disputas → Analytics → Suspender Usuários
 * 
 * Este teste garante que TODO o fluxo do admin funciona end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../src/AppContext';
import App from '../src/App';
import * as api from '../src/services/api';

// Mock das APIs
vi.mock('../src/services/api');
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

describe('🎯 Jornada Completa do Admin', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it('. LOGIN ADMIN: Admin consegue fazer login e acessar dashboard', async () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Clicar no botão de login
    const loginButton = await screen.findByRole('button', { name: /entrar|login/i });
    await user.click(loginButton);

    // Modal de autenticação
    const modal = await screen.findByRole('dialog', { name: /autenticação|login/i });
    expect(modal).toBeInTheDocument();

    // Preencher credenciais de admin
    const emailInput = within(modal).getByLabelText(/email/i);
    const senhaInput = within(modal).getByLabelText(/senha/i);
    
    await user.type(emailInput, 'admin@servio.ai');
    await user.type(senhaInput, 'admin123456');

    // Mock login com usuário admin
    mockApi.fetchUser.mockResolvedValue({
      id: 'admin-123',
      email: 'admin@servio.ai',
      name: 'Admin Servio',
      role: 'admin',
      status: 'active',
    });

    // Submeter formulário
    const submitButton = within(modal).getByRole('button', { name: /entrar/i });
    await user.click(submitButton);

    // Deve redirecionar para dashboard admin
    await waitFor(() => {
      expect(screen.getByText(/dashboard.*admin|painel.*administrativo/i)).toBeInTheDocument();
    });
  });

  it('. DASHBOARD: Admin vê métricas gerais e KPIs', async () => {
    // Mock admin logado
    const mockAdmin = {
      id: 'admin-123',
      role: 'admin',
      status: 'active',
    };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock métricas
    mockApi.fetchAdminMetrics.mockResolvedValue({
      totalUsers: 1250,
      totalClients: 800,
      totalProviders: 450,
      activeProviders: 380,
      pendingProviders: 70,
      suspendedUsers: 15,
      totalJobs: 3420,
      openJobs: 45,
      inProgressJobs: 120,
      completedJobs: 3180,
      canceledJobs: 75,
      totalRevenue: 523000,
      platformRevenue: 104600, // 20% comissão
      averageJobValue: 152.92,
      averageRating: 4.7,
      disputesOpen: 3,
      disputesResolved: 127,
    });

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Verificar KPIs principais
    await waitFor(() => {
      expect(screen.getByText(/1\.?250.*usuários/i)).toBeInTheDocument();
      expect(screen.getByText(/3\.?420.*jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$.*523\.?000/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$.*104\.?600/i)).toBeInTheDocument(); // Receita da plataforma
    });

    // Verificar cards de métricas
    expect(screen.getByText(/800.*clientes/i)).toBeInTheDocument();
    expect(screen.getByText(/450.*prestadores/i)).toBeInTheDocument();
    expect(screen.getByText(/70.*pendentes/i)).toBeInTheDocument();
    expect(screen.getByText(/3.*disputas abertas/i)).toBeInTheDocument();
  });

  it('. APROVAR PRESTADORES: Admin aprova prestador pendente', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock prestadores pendentes
    mockApi.fetchPendingProviders.mockResolvedValue([
      {
        id: 'prov-pending-1',
        name: 'João Silva',
        email: 'joao@example.com',
        specialties: ['encanamento', 'eletricista'],
        bio: 'Profissional com 10 anos de experiência...',
        whatsapp: '11999887766',
        address: 'São Paulo, SP',
        stripeAccountId: 'acct_123',
        status: 'pending_approval',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      },
      {
        id: 'prov-pending-2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        specialties: ['pintura'],
        bio: 'Pintora profissional...',
        whatsapp: '11988776655',
        address: 'Rio de Janeiro, RJ',
        stripeAccountId: 'acct_456',
        status: 'pending_approval',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para seção de prestadores pendentes
    const pendingSection = await screen.findByText(/prestadores.*pendentes|aguardando.*aprovação/i);
    await user.click(pendingSection);

    // Verificar lista de prestadores pendentes
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    // Ver detalhes do João
    const joaoCard = screen.getByText('João Silva').closest('[data-testid="provider-card"]');
    expect(joaoCard).toBeInTheDocument();
    expect(within(joaoCard!).getByText(/encanamento.*eletricista/i)).toBeInTheDocument();

    // Mock aprovar prestador
    mockApi.approveProvider.mockResolvedValue({
      id: 'prov-pending-1',
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin-123',
    });

    // Aprovar João
    const approveButton = within(joaoCard!).getByRole('button', { name: /aprovar/i });
    await user.click(approveButton);

    // Confirmação
    const confirmDialog = await screen.findByRole('dialog', { name: /confirmar.*aprovação/i });
    const confirmButton = within(confirmDialog).getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    // Verificar que a aprovação foi feita
    await waitFor(() => {
      expect(mockApi.approveProvider).toHaveBeenCalledWith('prov-pending-1');
    });

    // João deve sair da lista de pendentes
    await waitFor(() => {
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    });

    // Notificação de sucesso
    expect(screen.getByText(/prestador aprovado com sucesso/i)).toBeInTheDocument();
  });

  it('. GERENCIAR USUÁRIOS: Admin lista, busca e filtra usuários', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock todos os usuários
    mockApi.fetchAllUsers.mockResolvedValue([
      { id: 'u1', name: 'Cliente 1', email: 'c1@example.com', role: 'client', status: 'active' },
      { id: 'u2', name: 'Cliente 2', email: 'c2@example.com', role: 'client', status: 'active' },
      { id: 'u3', name: 'Prestador 1', email: 'p1@example.com', role: 'provider', status: 'active' },
      { id: 'u4', name: 'Prestador 2', email: 'p2@example.com', role: 'provider', status: 'suspended' },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para gestão de usuários
    const usersLink = await screen.findByRole('link', { name: /usuários|gerenciar usuários/i });
    await user.click(usersLink);

    // Verificar que todos aparecem
    await waitFor(() => {
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
      expect(screen.getByText('Cliente 2')).toBeInTheDocument();
      expect(screen.getByText('Prestador 1')).toBeInTheDocument();
      expect(screen.getByText('Prestador 2')).toBeInTheDocument();
    });

    // Filtrar por tipo: apenas prestadores
    const roleFilter = screen.getByLabelText(/tipo|perfil/i);
    await user.selectOptions(roleFilter, 'provider');

    await waitFor(() => {
      expect(screen.getByText('Prestador 1')).toBeInTheDocument();
      expect(screen.getByText('Prestador 2')).toBeInTheDocument();
      expect(screen.queryByText('Cliente 1')).not.toBeInTheDocument();
    });

    // Filtrar por status: apenas suspensos
    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'suspended');

    await waitFor(() => {
      expect(screen.getByText('Prestador 2')).toBeInTheDocument();
      expect(screen.queryByText('Prestador 1')).not.toBeInTheDocument();
    });

    // Buscar por nome
    const searchInput = screen.getByPlaceholderText(/buscar.*usuário|nome|email/i);
    await user.type(searchInput, 'Cliente 1');

    await waitFor(() => {
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
      expect(screen.queryByText('Cliente 2')).not.toBeInTheDocument();
    });
  });

  it('. SUSPENDER USUÁRIO: Admin suspende usuário com motivo', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock usuário problemático
    mockApi.fetchAllUsers.mockResolvedValue([
      {
        id: 'u-problem',
        name: 'Usuário Problemático',
        email: 'problema@example.com',
        role: 'provider',
        status: 'active',
        complaints: 3,
        rating: 2.1,
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Ver perfil do usuário
    const userCard = await screen.findByText('Usuário Problemático');
    await user.click(userCard);

    // Abrir ações
    const actionsButton = await screen.findByRole('button', { name: /ações|opções/i });
    await user.click(actionsButton);

    // Clicar em suspender
    const suspendButton = await screen.findByRole('menuitem', { name: /suspender/i });
    await user.click(suspendButton);

    // Modal de confirmação
    const confirmModal = await screen.findByRole('dialog', { name: /suspender usuário/i });
    expect(confirmModal).toBeInTheDocument();

    // Preencher motivo
    const reasonTextarea = within(confirmModal).getByLabelText(/motivo/i);
    await user.type(reasonTextarea, 'Múltiplas reclamações de clientes. Rating muito baixo (2.1). Comportamento inadequado.');

    // Mock suspender
    mockApi.suspendUser.mockResolvedValue({
      id: 'u-problem',
      status: 'suspended',
      suspendedAt: new Date().toISOString(),
      suspendedBy: 'admin-123',
      suspensionReason: 'Múltiplas reclamações...',
    });

    // Confirmar suspensão
    const confirmButton = within(confirmModal).getByRole('button', { name: /confirmar|suspender/i });
    await user.click(confirmButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.suspendUser).toHaveBeenCalledWith(
        'u-problem',
        expect.objectContaining({
          reason: expect.stringContaining('Múltiplas reclamações'),
        })
      );
    });

    // Status deve mudar
    await waitFor(() => {
      expect(screen.getByText(/suspenso/i)).toBeInTheDocument();
    });
  });

  it('. MEDIAR DISPUTAS: Admin resolve disputa entre cliente e prestador', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock disputa aberta
    mockApi.fetchOpenDisputes.mockResolvedValue([
      {
        id: 'dispute-1',
        jobId: 'job-123',
        clientId: 'client-1',
        clientName: 'João Cliente',
        providerId: 'prov-1',
        providerName: 'Maria Prestadora',
        reason: 'Serviço não foi concluído adequadamente',
        status: 'open',
        jobPrice: 150,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
        messages: [
          {
            id: 'msg-1',
            senderId: 'client-1',
            text: 'O vazamento não foi resolvido completamente',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: 'msg-2',
            senderId: 'prov-1',
            text: 'Fiz todo o trabalho acordado. Testei antes de sair.',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
          },
        ],
        evidence: [
          {
            id: 'ev-1',
            uploadedBy: 'client-1',
            type: 'image',
            url: 'https://example.com/evidence1.jpg',
          },
        ],
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para disputas
    const disputesLink = await screen.findByRole('link', { name: /disputas/i });
    await user.click(disputesLink);

    // Lista de disputas abertas
    await waitFor(() => {
      expect(screen.getByText(/serviço não foi concluído adequadamente/i)).toBeInTheDocument();
    });

    // Abrir detalhes da disputa
    const disputeCard = screen.getByText(/serviço não foi concluído adequadamente/i);
    await user.click(disputeCard);

    // Modal de disputa deve abrir
    const disputeModal = await screen.findByRole('dialog', { name: /disputa|mediação/i });
    expect(disputeModal).toBeInTheDocument();

    // Verificar informações
    expect(within(disputeModal).getByText('João Cliente')).toBeInTheDocument();
    expect(within(disputeModal).getByText('Maria Prestadora')).toBeInTheDocument();
    expect(within(disputeModal).getByText(/R\$ 150/)).toBeInTheDocument();

    // Verificar mensagens
    expect(within(disputeModal).getByText(/vazamento não foi resolvido/i)).toBeInTheDocument();
    expect(within(disputeModal).getByText(/fiz todo o trabalho acordado/i)).toBeInTheDocument();

    // Ver evidências
    const evidenceImage = within(disputeModal).getByRole('img', { name: /evidência/i });
    expect(evidenceImage).toBeInTheDocument();

    // Tomar decisão: 70% para cliente, 30% para prestador
    const decisionSelect = within(disputeModal).getByLabelText(/decisão|favor de/i);
    await user.selectOptions(decisionSelect, 'partial_refund');

    const refundPercentage = within(disputeModal).getByLabelText(/porcentagem|reembolso/i);
    await user.clear(refundPercentage);
    await user.type(refundPercentage, '70');

    // Adicionar comentário da decisão
    const commentTextarea = within(disputeModal).getByLabelText(/comentário|justificativa/i);
    await user.type(
      commentTextarea,
      'Após análise, há evidências que o serviço não foi completamente concluído. Reembolso parcial de 70% ao cliente.'
    );

    // Mock resolver disputa
    mockApi.resolveDispute.mockResolvedValue({
      id: 'dispute-1',
      status: 'resolved',
      decision: 'partial_refund',
      refundPercentage: 70,
      clientRefund: 105, // 70% de R$ 150
      providerPayout: 45, // 30% de R$ 150
      adminComment: 'Após análise, há evidências...',
      resolvedBy: 'admin-123',
      resolvedAt: new Date().toISOString(),
    });

    // Submeter decisão
    const submitButton = within(disputeModal).getByRole('button', { name: /resolver|confirmar decisão/i });
    await user.click(submitButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.resolveDispute).toHaveBeenCalledWith(
        'dispute-1',
        expect.objectContaining({
          decision: 'partial_refund',
          refundPercentage: 70,
          adminComment: expect.stringContaining('há evidências'),
        })
      );
    });

    // Confirmação
    await waitFor(() => {
      expect(screen.getByText(/disputa resolvida com sucesso/i)).toBeInTheDocument();
    });
  });

  it('. ANALYTICS: Admin visualiza gráficos e tendências', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock dados de analytics
    mockApi.fetchAnalytics.mockResolvedValue({
      timeSeries: [
        { date: '2024-01-01', jobs: 45, revenue: 6800 },
        { date: '2024-01-02', jobs: 52, revenue: 7900 },
        { date: '2024-01-03', jobs: 48, revenue: 7200 },
        { date: '2024-01-04', jobs: 61, revenue: 9200 },
        { date: '2024-01-05', jobs: 55, revenue: 8300 },
      ],
      topCategories: [
        { category: 'Encanamento', count: 420, revenue: 63000 },
        { category: 'Eletricista', count: 380, revenue: 57000 },
        { category: 'Limpeza', count: 340, revenue: 51000 },
        { category: 'Pintura', count: 280, revenue: 42000 },
        { category: 'Jardinagem', count: 150, revenue: 22500 },
      ],
      topProviders: [
        { id: 'p1', name: 'João Silva', completedJobs: 85, rating: 4.9, revenue: 12750 },
        { id: 'p2', name: 'Maria Santos', completedJobs: 72, rating: 4.8, revenue: 10800 },
        { id: 'p3', name: 'Pedro Costa', completedJobs: 68, rating: 4.7, revenue: 10200 },
      ],
    });

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Navegar para analytics
    const analyticsLink = await screen.findByRole('link', { name: /analytics|relatórios/i });
    await user.click(analyticsLink);

    // Verificar gráfico de tendências (deve renderizar chart)
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /gráfico.*tendências/i })).toBeInTheDocument();
    });

    // Verificar top categorias
    expect(screen.getByText('Encanamento')).toBeInTheDocument();
    expect(screen.getByText(/420.*jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$.*63\.?000/i)).toBeInTheDocument();

    // Verificar top prestadores
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText(/85.*jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.9/i)).toBeInTheDocument();

    // Filtrar por período
    const periodFilter = screen.getByLabelText(/período/i);
    await user.selectOptions(periodFilter, 'last_7_days');

    // Mock novos dados
    mockApi.fetchAnalytics.mockResolvedValue({
      timeSeries: [
        { date: '2024-01-10', jobs: 50, revenue: 7500 },
        { date: '2024-01-11', jobs: 48, revenue: 7200 },
      ],
      topCategories: [],
      topProviders: [],
    });

    // Dados devem atualizar
    await waitFor(() => {
      expect(mockApi.fetchAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'last_7_days' })
      );
    });
  });

  it('. GERENCIAR JOBS: Admin cancela job se necessário', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock job problemático
    mockApi.fetchAllJobs.mockResolvedValue([
      {
        id: 'job-problem',
        clientId: 'client-1',
        clientName: 'Cliente Teste',
        description: 'Job com problema',
        status: 'in_progress',
        acceptedProviderId: 'prov-1',
        providerName: 'Prestador Teste',
        price: 200,
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

    // Navegar para jobs
    const jobsLink = await screen.findByRole('link', { name: /jobs|serviços/i });
    await user.click(jobsLink);

    // Ver job
    const jobCard = await screen.findByText('Job com problema');
    await user.click(jobCard);

    // Abrir ações
    const actionsButton = await screen.findByRole('button', { name: /ações|opções/i });
    await user.click(actionsButton);

    // Cancelar job
    const cancelButton = await screen.findByRole('menuitem', { name: /cancelar/i });
    await user.click(cancelButton);

    // Confirmação
    const confirmModal = await screen.findByRole('dialog', { name: /cancelar job/i });
    const reasonTextarea = within(confirmModal).getByLabelText(/motivo/i);
    await user.type(reasonTextarea, 'Job fraudulento identificado pelo sistema');

    // Mock cancelar
    mockApi.cancelJob.mockResolvedValue({
      id: 'job-problem',
      status: 'canceled',
      canceledBy: 'admin-123',
      cancelReason: 'Job fraudulento identificado pelo sistema',
    });

    const confirmButton = within(confirmModal).getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.cancelJob).toHaveBeenCalledWith(
        'job-problem',
        expect.objectContaining({
          reason: expect.stringContaining('fraudulento'),
        })
      );
    });

    // Status deve mudar
    await waitFor(() => {
      expect(screen.getByText(/cancelado/i)).toBeInTheDocument();
    });
  });

  it('. REATIVAR USUÁRIO: Admin pode reativar usuário suspenso', async () => {
    // Mock admin
    const mockAdmin = { id: 'admin-123', role: 'admin', status: 'active' };
    mockApi.fetchUser.mockResolvedValue(mockAdmin);

    // Mock usuário suspenso
    mockApi.fetchAllUsers.mockResolvedValue([
      {
        id: 'u-suspended',
        name: 'Usuário Recuperado',
        email: 'recuperado@example.com',
        role: 'provider',
        status: 'suspended',
        suspendedAt: new Date(Date.now() - 2592000000).toISOString(), // 30 dias atrás
        suspensionReason: 'Rating baixo',
      },
    ]);

    render(
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    );

    // Filtrar por suspensos
    const statusFilter = await screen.findByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'suspended');

    // Ver usuário
    const userCard = await screen.findByText('Usuário Recuperado');
    await user.click(userCard);

    // Abrir ações
    const actionsButton = await screen.findByRole('button', { name: /ações|opções/i });
    await user.click(actionsButton);

    // Reativar
    const reactivateButton = await screen.findByRole('menuitem', { name: /reativar/i });
    await user.click(reactivateButton);

    // Confirmação
    const confirmModal = await screen.findByRole('dialog', { name: /reativar usuário/i });
    const noteTextarea = within(confirmModal).getByLabelText(/nota|observação/i);
    await user.type(noteTextarea, 'Usuário melhorou comportamento e solicitou reativação');

    // Mock reativar
    mockApi.reactivateUser.mockResolvedValue({
      id: 'u-suspended',
      status: 'active',
      reactivatedAt: new Date().toISOString(),
      reactivatedBy: 'admin-123',
      reactivationNote: 'Usuário melhorou comportamento...',
    });

    const confirmButton = within(confirmModal).getByRole('button', { name: /confirmar|reativar/i });
    await user.click(confirmButton);

    // Verificar
    await waitFor(() => {
      expect(mockApi.reactivateUser).toHaveBeenCalledWith(
        'u-suspended',
        expect.objectContaining({
          note: expect.stringContaining('melhorou comportamento'),
        })
      );
    });

    // Status deve mudar
    await waitFor(() => {
      expect(screen.getByText(/ativo/i)).toBeInTheDocument();
    });
  });
});
