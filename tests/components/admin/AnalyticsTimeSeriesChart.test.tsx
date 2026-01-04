import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsTimeSeriesChart from '../../../components/admin/AnalyticsTimeSeriesChart';

describe('AnalyticsTimeSeriesChart', () => {
  const mockData = [
    { label: 'Jan', jobs: 10, revenue: 1000 },
    { label: 'Fev', jobs: 15, revenue: 1500 },
    { label: 'Mar', jobs: 8, revenue: 800 },
  ];

  describe('renderização básica', () => {
    it('deve renderizar o componente', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(screen.getByText('Série Temporal')).toBeInTheDocument();
    });

    it('deve renderizar título customizado', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} title="Vendas Mensais" />);
      
      expect(screen.getByText('Vendas Mensais')).toBeInTheDocument();
    });

    it('deve renderizar labels dos pontos', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Fev')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    it('deve exibir contagem de jobs', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(screen.getByText(/10 jobs/)).toBeInTheDocument();
      expect(screen.getByText(/15 jobs/)).toBeInTheDocument();
      expect(screen.getByText(/8 jobs/)).toBeInTheDocument();
    });

    it('deve exibir revenue quando disponível', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(screen.getByText(/R\$ 1000.00/)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 1500.00/)).toBeInTheDocument();
    });
  });

  describe('dados vazios', () => {
    it('deve exibir mensagem quando não há dados', () => {
      render(<AnalyticsTimeSeriesChart data={[]} />);
      
      expect(screen.getByText('Sem dados suficientes para exibir.')).toBeInTheDocument();
    });

    it('não deve exibir mensagem de vazio quando há dados', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(screen.queryByText('Sem dados suficientes para exibir.')).not.toBeInTheDocument();
    });
  });

  describe('sem revenue', () => {
    it('deve funcionar sem revenue', () => {
      const dataWithoutRevenue = [
        { label: 'Jan', jobs: 10 },
        { label: 'Fev', jobs: 15 },
      ];
      
      render(<AnalyticsTimeSeriesChart data={dataWithoutRevenue} />);
      
      expect(screen.getByText(/10 jobs/)).toBeInTheDocument();
      expect(screen.getByText(/15 jobs/)).toBeInTheDocument();
      expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    });
  });

  describe('barras de progresso', () => {
    it('deve renderizar barras proporcionais para jobs', () => {
      const { container } = render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      // Procura por barras de progresso (divs com bg-blue-600)
      const jobBars = container.querySelectorAll('.bg-blue-600');
      expect(jobBars.length).toBeGreaterThan(0);
    });

    it('deve renderizar barras proporcionais para revenue', () => {
      const { container } = render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      // Procura por barras de progresso (divs com bg-green-600)
      const revenueBars = container.querySelectorAll('.bg-green-600');
      expect(revenueBars.length).toBeGreaterThan(0);
    });
  });

  describe('estilização', () => {
    it('deve ter container com fundo branco e sombra', () => {
      const { container } = render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'shadow');
    });

    it('título deve ter estilo correto', () => {
      render(<AnalyticsTimeSeriesChart data={mockData} />);
      
      const title = screen.getByText('Série Temporal');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('edge cases', () => {
    it('deve lidar com jobs = 0', () => {
      const dataWithZero = [{ label: 'Jan', jobs: 0 }];
      
      render(<AnalyticsTimeSeriesChart data={dataWithZero} />);
      
      expect(screen.getByText(/0 jobs/)).toBeInTheDocument();
    });

    it('deve lidar com revenue = 0', () => {
      const dataWithZeroRevenue = [{ label: 'Jan', jobs: 5, revenue: 0 }];
      
      render(<AnalyticsTimeSeriesChart data={dataWithZeroRevenue} />);
      
      expect(screen.getByText(/5 jobs/)).toBeInTheDocument();
    });

    it('deve lidar com valores muito grandes', () => {
      const bigData = [{ label: 'Jan', jobs: 1000000, revenue: 99999999 }];
      
      render(<AnalyticsTimeSeriesChart data={bigData} />);
      
      expect(screen.getByText(/1000000 jobs/)).toBeInTheDocument();
    });
  });
});
