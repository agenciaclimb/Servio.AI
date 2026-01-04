import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIActionCard, { generateNextActionSuggestions } from '../../src/components/prospector/AIActionCard';
import type { ProspectLead } from '../../src/components/ProspectorCRM';

// Helper to create a basic lead
const createBasicLead = (overrides: Partial<ProspectLead> = {}): ProspectLead => ({
  id: 'lead-1',
  prospectorId: 'prospector-1',
  name: 'João Silva',
  phone: '11999999999',
  email: 'joao@email.com',
  source: 'referral',
  stage: 'new',
  activities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('generateNextActionSuggestions', () => {
  describe('Follow-up suggestions', () => {
    it('deve sugerir contato imediato quando follow-up está atrasado', () => {
      const lead = createBasicLead({
        followUpDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Entrar em contato imediatamente')).toBe(true);
      expect(suggestions.find(s => s.action === 'Entrar em contato imediatamente')?.priority).toBe('high');
    });

    it('não deve sugerir follow-up quando a data ainda não passou', () => {
      const lead = createBasicLead({
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Entrar em contato imediatamente')).toBe(false);
    });
  });

  describe('High score suggestions', () => {
    it('deve sugerir proposta personalizada para lead com score alto e não quente', () => {
      const lead = createBasicLead({
        score: 75,
        temperature: 'warm',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Enviar proposta personalizada')).toBe(true);
    });

    it('não deve sugerir proposta para lead quente com score alto', () => {
      const lead = createBasicLead({
        score: 75,
        temperature: 'hot',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Enviar proposta personalizada')).toBe(false);
    });

    it('não deve sugerir proposta para lead com score baixo', () => {
      const lead = createBasicLead({
        score: 50,
        temperature: 'warm',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Enviar proposta personalizada')).toBe(false);
    });
  });

  describe('Inactive lead suggestions', () => {
    it('deve sugerir reativação para lead inativo há 7+ dias', () => {
      const lead = createBasicLead({
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        stage: 'contacted',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Reativar com oferta especial')).toBe(true);
    });

    it('não deve sugerir reativação para lead won', () => {
      const lead = createBasicLead({
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        stage: 'won',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Reativar com oferta especial')).toBe(false);
    });

    it('não deve sugerir reativação para lead lost', () => {
      const lead = createBasicLead({
        lastActivity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        stage: 'lost',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Reativar com oferta especial')).toBe(false);
    });
  });

  describe('Negotiating stage suggestions', () => {
    it('deve sugerir follow-up de fechamento para lead em negociação inativo', () => {
      const lead = createBasicLead({
        stage: 'negotiating',
        lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Fazer follow-up de fechamento')).toBe(true);
    });

    it('não deve sugerir follow-up se negociação teve atividade recente', () => {
      const lead = createBasicLead({
        stage: 'negotiating',
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Fazer follow-up de fechamento')).toBe(false);
    });
  });

  describe('Email suggestions', () => {
    it('deve sugerir email quando tem atividades mas não enviou email', () => {
      const lead = createBasicLead({
        email: 'joao@email.com',
        activities: [
          { id: '1', type: 'message', description: 'WhatsApp', createdAt: new Date() },
          { id: '2', type: 'call', description: 'Ligação', createdAt: new Date() },
          { id: '3', type: 'message', description: 'WhatsApp', createdAt: new Date() },
        ],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Enviar email com detalhes')).toBe(true);
    });

    it('não deve sugerir email se já foi enviado', () => {
      const lead = createBasicLead({
        email: 'joao@email.com',
        activities: [
          { id: '1', type: 'message', description: 'WhatsApp', createdAt: new Date() },
          { id: '2', type: 'email', description: 'Email enviado', createdAt: new Date() },
          { id: '3', type: 'message', description: 'WhatsApp', createdAt: new Date() },
        ],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Enviar email com detalhes')).toBe(false);
    });
  });

  describe('Hot lead suggestions', () => {
    it('deve sugerir abordagem urgente para lead quente novo', () => {
      const lead = createBasicLead({
        temperature: 'hot',
        stage: 'new',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Fazer primeira abordagem urgente')).toBe(true);
    });

    it('não deve sugerir abordagem urgente se já foi contatado', () => {
      const lead = createBasicLead({
        temperature: 'hot',
        stage: 'contacted',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Fazer primeira abordagem urgente')).toBe(false);
    });
  });

  describe('Phone request suggestions', () => {
    it('deve sugerir solicitar telefone quando tem email mas não telefone', () => {
      const lead = createBasicLead({
        phone: '',
        email: 'joao@email.com',
        activities: [],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Solicitar telefone por email')).toBe(true);
    });

    it('não deve sugerir solicitar telefone se já tem telefone', () => {
      const lead = createBasicLead({
        phone: '11999999999',
        email: 'joao@email.com',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Solicitar telefone por email')).toBe(false);
    });
  });

  describe('Contacted stage suggestions', () => {
    it('deve sugerir agendar reunião para lead contatado sem atividade recente', () => {
      const lead = createBasicLead({
        stage: 'contacted',
        lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Agendar reunião/demo')).toBe(true);
    });
  });

  describe('Category suggestions', () => {
    it('deve sugerir identificar categoria quando não tem', () => {
      const lead = createBasicLead({
        category: undefined,
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Identificar área de atuação')).toBe(true);
    });

    it('não deve sugerir identificar categoria quando já tem', () => {
      const lead = createBasicLead({
        category: 'Tecnologia',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Identificar área de atuação')).toBe(false);
    });
  });

  describe('Channel change suggestions', () => {
    it('deve sugerir WhatsApp se última atividade foi email e está inativo', () => {
      const lead = createBasicLead({
        lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        activities: [
          { id: '1', type: 'email', description: 'Email', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        ],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Tentar contato via WhatsApp')).toBe(true);
    });

    it('deve sugerir Email se última atividade foi message e está inativo', () => {
      const lead = createBasicLead({
        lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        activities: [
          { id: '1', type: 'message', description: 'WhatsApp', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        ],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.some(s => s.action === 'Tentar contato via Email')).toBe(true);
    });
  });

  describe('Sorting and limiting', () => {
    it('deve ordenar sugestões por prioridade (high primeiro)', () => {
      const lead = createBasicLead({
        followUpDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // high priority
        category: undefined, // low priority
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions[0].priority).toBe('high');
    });

    it('deve limitar a 3 sugestões', () => {
      const lead = createBasicLead({
        followUpDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        score: 75,
        temperature: 'warm',
        stage: 'new',
        category: undefined,
        phone: '',
        email: 'joao@email.com',
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Well-managed lead', () => {
    it('deve retornar array vazio para lead bem gerenciado', () => {
      const lead = createBasicLead({
        stage: 'won',
        temperature: 'hot',
        score: 100,
        category: 'Tecnologia',
        lastActivity: new Date(),
        activities: [
          { id: '1', type: 'email', description: 'Email', createdAt: new Date() },
        ],
      });

      const suggestions = generateNextActionSuggestions(lead);

      expect(suggestions.length).toBe(0);
    });
  });
});

describe('AIActionCard Component', () => {
  let mockOnAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAction = vi.fn();
  });

  it('deve renderizar mensagem de sucesso quando não há sugestões', () => {
    const lead = createBasicLead({
      stage: 'won',
      temperature: 'hot',
      score: 100,
      category: 'Tecnologia',
      lastActivity: new Date(),
      activities: [
        { id: '1', type: 'email', description: 'Email', createdAt: new Date() },
      ],
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    expect(screen.getByText('Lead está bem encaminhado!')).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma ação urgente/)).toBeInTheDocument();
  });

  it('deve renderizar sugestões quando existem', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    expect(screen.getByText('IA Sugere')).toBeInTheDocument();
    expect(screen.getByText('Fazer primeira abordagem urgente')).toBeInTheDocument();
  });

  it('deve exibir contador de ações', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
      category: undefined,
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    // Deve ter pelo menos 1 ação
    expect(screen.getByText(/\d+ ações?/)).toBeInTheDocument();
  });

  it('deve exibir prioridade URGENTE para ações high', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    const urgenteElements = screen.getAllByText('URGENTE');
    expect(urgenteElements.length).toBeGreaterThan(0);
  });

  it('deve exibir prioridade SUGESTÃO para ações low', () => {
    const lead = createBasicLead({
      stage: 'won',
      category: undefined,
      lastActivity: new Date(),
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    expect(screen.getByText('SUGESTÃO')).toBeInTheDocument();
  });

  it('deve chamar onAction ao clicar em Executar', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    const executeButtons = screen.getAllByRole('button', { name: /Executar/i });
    fireEvent.click(executeButtons[0]);

    expect(mockOnAction).toHaveBeenCalled();
  });

  it('deve exibir estimativa de impacto', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    const impactElements = screen.getAllByText(/\+\d+%/);
    expect(impactElements.length).toBeGreaterThan(0);
  });

  it('deve exibir razão da sugestão', () => {
    const lead = createBasicLead({
      temperature: 'hot',
      stage: 'new',
    });

    render(<AIActionCard lead={lead} onAction={mockOnAction} />);

    expect(screen.getByText(/Lead quente precisa ser contatado/)).toBeInTheDocument();
  });
});
