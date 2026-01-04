import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminAnalytics from '../../components/AdminAnalytics';
import type { Job, User } from '../../types';

// Mock StatCard and Chart components
vi.mock('../../components/StatCard', () => ({
  default: ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <span data-testid="stat-title">{title}</span>
      <span data-testid="stat-value">{value}</span>
      <span data-testid="stat-icon">{icon}</span>
    </div>
  ),
}));

vi.mock('../../components/Chart', () => ({
  default: ({ title, data }: { title: string; data: Record<string, number> }) => (
    <div data-testid={`chart-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <span data-testid="chart-title">{title}</span>
      <span data-testid="chart-data">{JSON.stringify(data)}</span>
    </div>
  ),
}));

describe('AdminAnalytics', () => {
  const mockUsers: User[] = [
    { id: '1', email: 'user1@test.com', name: 'User 1', type: 'cliente', status: 'ativo', createdAt: new Date() },
    { id: '2', email: 'user2@test.com', name: 'User 2', type: 'prestador', status: 'ativo', createdAt: new Date() },
    { id: '3', email: 'user3@test.com', name: 'User 3', type: 'prestador', status: 'ativo', createdAt: new Date() },
    { id: '4', email: 'user4@test.com', name: 'User 4', type: 'admin', status: 'ativo', createdAt: new Date() },
  ];

  const mockJobs: Job[] = [
    {
      id: 'job1',
      title: 'Job 1',
      description: 'Descrição 1',
      category: 'encanador',
      status: 'aberto',
      clientId: 'user1@test.com',
      createdAt: new Date('2025-01-15'),
      location: { city: 'São Paulo', state: 'SP' },
    },
    {
      id: 'job2',
      title: 'Job 2',
      description: 'Descrição 2',
      category: 'eletricista',
      status: 'concluido',
      clientId: 'user1@test.com',
      createdAt: new Date('2025-02-10'),
      location: { city: 'Rio de Janeiro', state: 'RJ' },
    },
    {
      id: 'job3',
      title: 'Job 3',
      description: 'Descrição 3',
      category: 'encanador',
      status: 'concluido',
      clientId: 'user1@test.com',
      createdAt: new Date('2025-02-20'),
      location: { city: 'Belo Horizonte', state: 'MG' },
    },
  ];

  describe('renderização de StatCards', () => {
    it('deve exibir total de usuários', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-usuários');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('4');
    });

    it('deve exibir total de prestadores', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-prestadores');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('2');
    });

    it('deve exibir total de jobs criados', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-jobs-criados');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('3');
    });

    it('deve exibir jobs concluídos', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-jobs-concluídos');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('2');
    });
  });

  describe('renderização de Charts', () => {
    it('deve exibir gráfico de jobs por mês', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const chart = screen.getByTestId('chart-jobs-criados-por-mês');
      expect(chart).toBeInTheDocument();
    });

    it('deve exibir gráfico de distribuição de serviços', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const chart = screen.getByTestId('chart-distribuição-de-serviços');
      expect(chart).toBeInTheDocument();
    });

    it('deve agregar jobs por categoria corretamente', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const chart = screen.getByTestId('chart-distribuição-de-serviços');
      const chartData = chart.querySelector('[data-testid="chart-data"]')?.textContent || '';
      const data = JSON.parse(chartData);

      expect(data['Encanador']).toBe(2);
      expect(data['Eletricista']).toBe(1);
    });
  });

  describe('dados vazios', () => {
    it('deve renderizar com arrays vazios', () => {
      render(<AdminAnalytics allJobs={[]} allUsers={[]} />);

      expect(screen.getByTestId('stat-card-total-de-usuários')).toHaveTextContent('0');
      expect(screen.getByTestId('stat-card-total-de-prestadores')).toHaveTextContent('0');
      expect(screen.getByTestId('stat-card-total-de-jobs-criados')).toHaveTextContent('0');
      expect(screen.getByTestId('stat-card-jobs-concluídos')).toHaveTextContent('0');
    });

    it('deve exibir gráficos vazios com dados vazios', () => {
      render(<AdminAnalytics allJobs={[]} allUsers={[]} />);

      const chartData = screen.getByTestId('chart-jobs-criados-por-mês')
        .querySelector('[data-testid="chart-data"]')?.textContent || '';
      expect(JSON.parse(chartData)).toEqual({});
    });
  });

  describe('cálculos corretos', () => {
    it('deve contar apenas prestadores', () => {
      const usersWithManyTypes: User[] = [
        ...mockUsers,
        { id: '5', email: 'user5@test.com', name: 'User 5', type: 'cliente', status: 'ativo', createdAt: new Date() },
        { id: '6', email: 'user6@test.com', name: 'User 6', type: 'prestador', status: 'ativo', createdAt: new Date() },
      ];

      render(<AdminAnalytics allJobs={mockJobs} allUsers={usersWithManyTypes} />);

      const card = screen.getByTestId('stat-card-total-de-prestadores');
      expect(card).toHaveTextContent('3'); // 3 prestadores
    });

    it('deve contar apenas jobs concluídos', () => {
      const jobsWithDifferentStatus: Job[] = [
        ...mockJobs,
        {
          id: 'job4',
          title: 'Job 4',
          description: 'Descrição 4',
          category: 'pintor',
          status: 'em_progresso',
          clientId: 'user1@test.com',
          createdAt: new Date(),
          location: { city: 'Curitiba', state: 'PR' },
        },
        {
          id: 'job5',
          title: 'Job 5',
          description: 'Descrição 5',
          category: 'pintor',
          status: 'cancelado',
          clientId: 'user1@test.com',
          createdAt: new Date(),
          location: { city: 'Porto Alegre', state: 'RS' },
        },
      ];

      render(<AdminAnalytics allJobs={jobsWithDifferentStatus} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-jobs-concluídos');
      expect(card).toHaveTextContent('2'); // ainda 2 concluídos
    });
  });

  describe('layout', () => {
    it('deve ter container principal com espaçamento', () => {
      const { container } = render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      expect(container.firstChild).toHaveClass('space-y-6');
    });

    it('deve ter grid de 4 colunas para stat cards', () => {
      const { container } = render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const grid = container.querySelector('.lg\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('deve ter grid de 2 colunas para charts', () => {
      const { container } = render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const grid = container.querySelector('.lg\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('ícones nos StatCards', () => {
    it('deve exibir ícone de usuários', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-usuários');
      expect(card).toHaveTextContent('👥');
    });

    it('deve exibir ícone de prestadores', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-prestadores');
      expect(card).toHaveTextContent('🛠️');
    });

    it('deve exibir ícone de jobs', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-total-de-jobs-criados');
      expect(card).toHaveTextContent('📝');
    });

    it('deve exibir ícone de concluídos', () => {
      render(<AdminAnalytics allJobs={mockJobs} allUsers={mockUsers} />);

      const card = screen.getByTestId('stat-card-jobs-concluídos');
      expect(card).toHaveTextContent('✅');
    });
  });
});
