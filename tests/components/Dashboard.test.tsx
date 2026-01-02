import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../../components/Dashboard';
import { User, Job } from '../../types';
import * as geminiService from '../../services/geminiService';

// Mock dos serviços
vi.mock('../../services/geminiService', () => ({
  getMatchingProviders: vi.fn(),
}));

// Mock dos componentes filhos para isolar o teste
vi.mock('../../components/ServiceRequestForm', () => ({
  default: ({ 
    description, 
    setDescription, 
    selectedCategory, 
    setSelectedCategory, 
    onSubmit, 
    isLoading,
    submitButtonText 
  }: {
    description: string;
    setDescription: (value: string) => void;
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    submitButtonText: string;
  }) => (
    <form data-testid="service-request-form" onSubmit={onSubmit}>
      <input
        data-testid="description-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição"
      />
      <select
        data-testid="category-select"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">Selecione</option>
        <option value="limpeza">Limpeza</option>
        <option value="eletrica">Elétrica</option>
      </select>
      <button type="submit" disabled={isLoading} data-testid="submit-button">
        {submitButtonText}
      </button>
    </form>
  ),
}));

vi.mock('../../components/ProviderCard', () => ({
  default: ({ result }: { result: { provider: User; matchScore: number } }) => (
    <div data-testid="provider-card">{result.provider.email}</div>
  ),
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe('Dashboard Component', () => {
  const mockUser: User = {
    id: '1',
    email: 'cliente@test.com',
    name: 'Cliente Teste',
    tipo: 'cliente',
    status: 'ativo',
    fotoPerfil: '',
    bio: '',
    servicosPrestados: [],
    tags: [],
    telefone: '',
    endereco: '',
  };

  const mockAllUsers: User[] = [
    mockUser,
    {
      id: '2',
      email: 'prestador@test.com',
      name: 'Prestador Teste',
      tipo: 'prestador',
      status: 'ativo',
      fotoPerfil: '',
      bio: 'Especialista em limpeza',
      servicosPrestados: ['limpeza'],
      tags: [],
      telefone: '',
      endereco: '',
    },
  ];

  const mockAllJobs: Job[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título com o email do usuário', () => {
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    expect(screen.getByText(/Seu Painel, cliente@test.com!/)).toBeInTheDocument();
  });

  it('renderiza o formulário de solicitação de serviço', () => {
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    expect(screen.getByTestId('service-request-form')).toBeInTheDocument();
  });

  it('mostra mensagem de boas-vindas quando não há resultados', () => {
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    expect(screen.getByText('Seu painel está pronto!')).toBeInTheDocument();
    expect(screen.getByText(/Utilize o formulário acima/)).toBeInTheDocument();
  });

  it('mostra erro quando descrição ou categoria estão vazios', async () => {
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Por favor, descreva o serviço e selecione uma categoria.')).toBeInTheDocument();
    });
  });

  it('mostra loading spinner durante a busca', async () => {
    vi.mocked(geminiService.getMatchingProviders).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
    );
    
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    // Preenche o formulário
    const descriptionInput = screen.getByTestId('description-input');
    const categorySelect = screen.getByTestId('category-select');
    
    fireEvent.change(descriptionInput, { target: { value: 'Preciso de limpeza' } });
    fireEvent.change(categorySelect, { target: { value: 'limpeza' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('mostra resultados quando profissionais são encontrados', async () => {
    const mockResults = [
      { provider: mockAllUsers[1], matchScore: 0.95, aiAnalysis: 'Ótimo match' },
    ];
    
    vi.mocked(geminiService.getMatchingProviders).mockResolvedValue(mockResults);
    
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    // Preenche o formulário
    fireEvent.change(screen.getByTestId('description-input'), { 
      target: { value: 'Preciso de limpeza' } 
    });
    fireEvent.change(screen.getByTestId('category-select'), { 
      target: { value: 'limpeza' } 
    });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Resultados Encontrados')).toBeInTheDocument();
      expect(screen.getByTestId('provider-card')).toBeInTheDocument();
    });
  });

  it('mostra mensagem quando nenhum profissional é encontrado', async () => {
    vi.mocked(geminiService.getMatchingProviders).mockResolvedValue([]);
    
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    fireEvent.change(screen.getByTestId('description-input'), { 
      target: { value: 'Preciso de um serviço raro' } 
    });
    fireEvent.change(screen.getByTestId('category-select'), { 
      target: { value: 'limpeza' } 
    });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/Nenhum profissional encontrado/)).toBeInTheDocument();
    });
  });

  it('mostra erro quando a busca falha', async () => {
    vi.mocked(geminiService.getMatchingProviders).mockRejectedValue(
      new Error('Falha na conexão')
    );
    
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    fireEvent.change(screen.getByTestId('description-input'), { 
      target: { value: 'Preciso de limpeza' } 
    });
    fireEvent.change(screen.getByTestId('category-select'), { 
      target: { value: 'limpeza' } 
    });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Erro')).toBeInTheDocument();
      expect(screen.getByText('Falha na conexão')).toBeInTheDocument();
    });
  });

  it('mostra mensagem genérica para erros desconhecidos', async () => {
    vi.mocked(geminiService.getMatchingProviders).mockRejectedValue('Erro string');
    
    render(
      <Dashboard user={mockUser} allUsers={mockAllUsers} allJobs={mockAllJobs} />
    );
    
    fireEvent.change(screen.getByTestId('description-input'), { 
      target: { value: 'Preciso de limpeza' } 
    });
    fireEvent.change(screen.getByTestId('category-select'), { 
      target: { value: 'limpeza' } 
    });
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/Ocorreu um erro desconhecido/)).toBeInTheDocument();
    });
  });
});
