import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard';
import * as API from '../services/api';
import { computeAnalytics } from '../src/analytics/adminMetrics';
import { Job, User, Dispute, FraudAlert } from '../types';

// Mock das dependências
vi.mock('../services/api');
vi.mock('../src/analytics/adminMetrics');

const mockJobs: Job[] = [{ id: 'job1', clientId: 'c1', category: 'Test', description: 'Desc', status: 'concluido', createdAt: new Date().toISOString() }];
const mockUsers: User[] = [{ email: 'u1', name: 'User One', type: 'cliente', status: 'ativo', memberSince: new Date().toISOString() }];
const mockDisputes: Dispute[] = [];
const mockFraudAlerts: FraudAlert[] = [];

const mockAnalyticsResult = {
  users: { total: 10, activeProviders: 5, verifiedProviders: 4, suspendedUsers: 1 },
  jobs: { total: 20, completionRate: 80, completed: 16, active: 2, canceled: 2 },
  revenue: { platform: 5000, avgJobValue: 250 },
  disputes: { total: 2, open: 1, rate: 10 },
  fraud: { total: 3, new: 1, highRisk: 1 },
  recent: { jobs: 5, completions: 4 },
  topCategories: [['Encanamento', 10]],
  topProviders: [{ name: 'Provider A', email: 'prov@a.com', count: 8 }],
};

describe('AdminAnalyticsDashboard', () => {
  const fetchJobsMock = vi.mocked(API.fetchJobs);
  const fetchAllUsersMock = vi.mocked(API.fetchAllUsers);
  const fetchDisputesMock = vi.mocked(API.fetchDisputes);
  const fetchSentimentAlertsMock = vi.mocked(API.fetchSentimentAlerts);
  const computeAnalyticsMock = vi.mocked(computeAnalytics);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o estado de carregamento inicialmente', () => {
    fetchJobsMock.mockReturnValue(new Promise(() => {})); // Promise que nunca resolve
    render(<AdminAnalyticsDashboard />);
    expect(screen.getByText('Carregando métricas...')).toBeInTheDocument();
  });

  it('busca dados, calcula e renderiza as métricas com sucesso', async () => {
    // Configura mocks para sucesso
    fetchJobsMock.mockResolvedValue(mockJobs);
    fetchAllUsersMock.mockResolvedValue(mockUsers);
    fetchDisputesMock.mockResolvedValue(mockDisputes);
    fetchSentimentAlertsMock.mockResolvedValue(mockFraudAlerts);
    computeAnalyticsMock.mockReturnValue(mockAnalyticsResult);

    render(<AdminAnalyticsDashboard />);

    // Espera o carregamento terminar
    await waitFor(() => {
      expect(screen.queryByText('Carregando métricas...')).not.toBeInTheDocument();
    });

    // Verifica se computeAnalytics foi chamado com os dados corretos
    expect(computeAnalyticsMock).toHaveBeenCalledWith(mockJobs, mockUsers, mockDisputes, mockFraudAlerts);

    // Verifica se algumas métricas chave são renderizadas
    expect(screen.getByText('Usuários Totais')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total de usuários do mockAnalyticsResult
    expect(screen.getByText('Jobs Criados')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // Total de jobs do mockAnalyticsResult
    expect(screen.getByText('Encanamento')).toBeInTheDocument(); // Top Categoria
  });

  it('lida com erro na busca de dados e renderiza o painel vazio', async () => {
    // Configura mock para falha
    fetchJobsMock.mockRejectedValue(new Error('API Failure'));
    fetchAllUsersMock.mockResolvedValue([]); // Outras podem ter sucesso
    computeAnalyticsMock.mockReturnValue({ ...mockAnalyticsResult, users: { total: 0 } }); // Simula resultado com dados vazios

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando métricas...')).not.toBeInTheDocument();
      // Verifica se o painel renderiza com um valor zerado, indicando que o erro foi tratado
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});