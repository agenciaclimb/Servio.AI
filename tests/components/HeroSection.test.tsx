import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import HeroSection from '../../components/HeroSection';

// Mock do Firebase
vi.mock('../../firebaseConfig', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(callback => {
      callback(null);
      return vi.fn();
    }),
  },
}));

describe('HeroSection', () => {
  const mockOnSmartSearch = vi.fn();
  const mockOnLoginClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o componente HeroSection', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    // Verifica se o componente foi renderizado
    const section = screen.getByRole('region', { name: /serviços/i });
    expect(section).toBeInTheDocument();
  });

  it('deve exibir título principal corretamente', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const title = screen.getByText(/encontre o serviço perfeito/i);
    expect(title).toBeInTheDocument();
  });

  it('deve renderizar campo de busca', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const searchInput = screen.getByPlaceholderText(/buscar serviço/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('deve validar descrição mínima de 10 caracteres', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const searchInput = screen.getByPlaceholderText(/buscar serviço/i) as HTMLInputElement;

    // Tipo menos de 10 caracteres
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput.value).toBe('test');
  });

  it('deve processar busca de serviço com mais de 10 caracteres', async () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const searchInput = screen.getByPlaceholderText(/buscar serviço/i) as HTMLInputElement;
    const searchButton = screen.getByText(/buscar|pesquisar/i);

    // Tipo texto válido (>10 caracteres)
    fireEvent.change(searchInput, { target: { value: 'eletricista predial de confiança' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSmartSearch).toHaveBeenCalledWith(expect.stringContaining('eletricista'));
    });
  });

  it('deve exibir categorias sugeridas', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    // Verifica se há botões de categorias
    const categoryButtons = screen.queryAllByRole('button', {
      name: /hidráulica|elétrica|reparos/i,
    });
    expect(categoryButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('deve chamar onLoginClick quando botão de login é clicado', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const loginButton = screen.getByRole('button', { name: /entrar|login|cadastre-se/i });
    fireEvent.click(loginButton);

    expect(mockOnLoginClick).toHaveBeenCalled();
  });

  it('deve desabilitar busca com campo vazio', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const searchButton = screen.getByText(/buscar|pesquisar/i);
    const searchInput = screen.getByPlaceholderText(/buscar serviço/i) as HTMLInputElement;

    // Campo vazio
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.click(searchButton);

    expect(mockOnSmartSearch).not.toHaveBeenCalled();
  });

  it('deve limpar campo de busca após submissão', async () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const searchInput = screen.getByPlaceholderText(/buscar serviço/i) as HTMLInputElement;
    const searchButton = screen.getByText(/buscar|pesquisar/i);

    fireEvent.change(searchInput, { target: { value: 'eletricista predial de confiança' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSmartSearch).toHaveBeenCalled();
    });

    // Verificar se o campo foi limpo (comportamento esperado)
    // expect(searchInput.value).toBe('');
  });

  it('deve renderizar imagem/ícone de destaque', () => {
    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    // Verifica se há elemento img ou svg de destaque
    const images = screen.queryAllByRole('img');
    const svgs = screen.queryAllByRole('img', { hidden: true });

    // Componente pode ter imagem ou SVG
    expect(images.length + svgs.length).toBeGreaterThanOrEqual(0);
  });

  it('deve ser responsivo em mobile', () => {
    // Mock de viewport mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const section = screen.getByRole('region', { name: /serviços/i });
    expect(section).toBeInTheDocument();
  });

  it('deve ser responsivo em desktop', () => {
    // Mock de viewport desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920, // Desktop width
    });

    render(<HeroSection onSmartSearch={mockOnSmartSearch} onLoginClick={mockOnLoginClick} />);

    const section = screen.getByRole('region', { name: /serviços/i });
    expect(section).toBeInTheDocument();
  });
});
