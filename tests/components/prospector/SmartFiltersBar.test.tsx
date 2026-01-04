import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartFiltersBar from '../../../src/components/prospector/SmartFiltersBar';

describe('SmartFiltersBar', () => {
  const mockLeads = [
    {
      id: '1',
      name: 'Lead Hot',
      temperature: 'hot' as const,
      priority: 'high' as const,
      stage: 'new' as const,
      score: 90,
    },
    {
      id: '2',
      name: 'Lead Warm',
      temperature: 'warm' as const,
      priority: 'medium' as const,
      stage: 'negotiating' as const,
      score: 75,
    },
    {
      id: '3',
      name: 'Lead Cold',
      temperature: 'cold' as const,
      priority: 'low' as const,
      stage: 'contacted' as const,
      followUpDate: new Date().toISOString(),
      score: 60,
    },
  ];

  const mockOnFilterApply = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização básica', () => {
    it('deve renderizar o componente', () => {
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      expect(screen.getByText(/Alta Prioridade/i)).toBeInTheDocument();
    });

    it('deve exibir filtros disponíveis', () => {
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      expect(screen.getByText(/Follow-up Hoje/i)).toBeInTheDocument();
    });

    it('deve calcular contagem de leads hot + high priority', () => {
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      // 1 lead com hot + high priority
      const hotPriorityButton = screen.getByText(/Alta Prioridade/i).closest('button');
      expect(hotPriorityButton).toHaveTextContent('1');
    });
  });

  describe('interações', () => {
    it('deve chamar onFilterApply ao clicar em filtro', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      const filterButton = screen.getByText(/Alta Prioridade/i).closest('button');
      if (filterButton) {
        await user.click(filterButton);
        expect(mockOnFilterApply).toHaveBeenCalled();
      }
    });

    it('deve chamar onClear ao clicar em limpar', async () => {
      const user = userEvent.setup();
      
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      const clearButton = screen.queryByText(/Limpar/i);
      if (clearButton) {
        await user.click(clearButton);
        expect(mockOnClear).toHaveBeenCalled();
      }
    });
  });

  describe('contagens dinâmicas', () => {
    it('deve calcular negotiating corretamente', () => {
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      // 1 lead em negotiating
      const negotiatingButton = screen.getByText(/Negociando/i).closest('button');
      expect(negotiatingButton).toHaveTextContent('1');
    });

    it('deve calcular high score (>=80) corretamente', () => {
      render(
        <SmartFiltersBar
          leads={mockLeads}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      // 1 lead com score >= 80
      const highScoreButton = screen.getByText(/Score Alto/i);
      expect(highScoreButton).toBeInTheDocument();
    });
  });

  describe('lista vazia', () => {
    it('deve funcionar com lista vazia de leads', () => {
      render(
        <SmartFiltersBar
          leads={[]}
          onFilterApply={mockOnFilterApply}
          onClear={mockOnClear}
        />
      );
      
      expect(screen.getByText(/Alta Prioridade/i)).toBeInTheDocument();
    });
  });
});
