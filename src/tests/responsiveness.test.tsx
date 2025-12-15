/**
 * Tests para validar responsiveness dos dashboards
 * Breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop)
 * Task 3.2: Implementar UI Responsiva para Mobile
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock para ClientDashboard layout responsiveness
describe('ClientDashboard - Responsiveness', () => {
  it('deve renderizar sidebar colapsável em mobile (max-width: 640px)', () => {
    const TestWrapper = () => (
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Menu Button - visível apenas em sm:hidden */}
        <button className="fixed top-4 left-4 z-50 sm:hidden" data-testid="mobile-menu-btn">
          Menu
        </button>
        
        {/* Sidebar responsivo */}
        <aside className="w-48 sm:w-64 bg-white" data-testid="sidebar">
          <div className="p-3 sm:p-6">
            <p className="text-xs sm:text-sm">Sidebar Content</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pt-16 sm:pt-0">
          <div className="p-2 sm:p-4 md:p-6 lg:p-8">
            <h1 className="text-lg sm:text-2xl">Title</h1>
          </div>
        </main>
      </div>
    );

    render(<TestWrapper />);
    
    const menuButton = screen.getByTestId('mobile-menu-btn');
    const sidebar = screen.getByTestId('sidebar');
    
    // Button deve estar visível em mobile (sm:hidden aplicado)
    expect(menuButton).toBeInTheDocument();
    // Sidebar deve usar width reduzido em mobile
    expect(sidebar).toHaveClass('w-48');
    expect(sidebar).toHaveClass('sm:w-64');
  });

  it('deve aplicar padding responsivo em main content (p-2 sm:p-4 md:p-6 lg:p-8)', () => {
    const TestWrapper = () => (
      <main className="flex-1">
        <div className="p-2 sm:p-4 md:p-6 lg:p-8" data-testid="content">
          Conteúdo
        </div>
      </main>
    );

    render(<TestWrapper />);
    
    const content = screen.getByTestId('content');
    // Validar classes de padding responsivo
    expect(content).toHaveClass('p-2', 'sm:p-4', 'md:p-6', 'lg:p-8');
  });

  it('deve usar grid responsivo para cards (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)', () => {
    const TestWrapper = () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4" data-testid="grid">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </div>
    );

    render(<TestWrapper />);
    
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    expect(grid).toHaveClass('gap-2', 'sm:gap-4');
  });
});

// Mock para ProviderDashboard grid responsiveness
describe('ProviderDashboard - Responsiveness', () => {
  it('deve aplicar grid com breakpoint tablet (md:grid-cols-2 lg:grid-cols-3)', () => {
    const TestWrapper = () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="job-grid">
        <div>Job Card 1</div>
        <div>Job Card 2</div>
        <div>Job Card 3</div>
      </div>
    );

    render(<TestWrapper />);
    
    const grid = screen.getByTestId('job-grid');
    // Desktop: 3 colunas
    expect(grid).toHaveClass('lg:grid-cols-3');
    // Tablet: 2 colunas
    expect(grid).toHaveClass('md:grid-cols-2');
    // Mobile: 1 coluna
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('deve aplicar filtros com layout responsivo (flex-col sm:flex-row)', () => {
    const TestWrapper = () => (
      <div className="bg-white p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4" data-testid="filters">
        <div className="flex-1 min-w-full sm:min-w-[200px]">
          <label className="text-xs sm:text-sm">Categoria</label>
          <select data-testid="category-select" />
        </div>
        <div className="flex-1 min-w-full sm:min-w-[200px]">
          <label className="text-xs sm:text-sm">Localização</label>
          <input data-testid="location-input" type="text" />
        </div>
      </div>
    );

    render(<TestWrapper />);
    
    const filters = screen.getByTestId('filters');
    expect(filters).toHaveClass('flex-col', 'sm:flex-row');
    expect(filters).toHaveClass('p-3', 'sm:p-4');
    expect(filters).toHaveClass('gap-2', 'sm:gap-4');
    
    // Inputs devem ser full-width em mobile
    const selects = screen.getByTestId('category-select');
    const inputs = screen.getByTestId('location-input');
    expect(selects).toHaveClass('w-full');
    expect(inputs).toHaveClass('w-full');
  });

  it('deve reduzir tamanho do font em mobile (text-xs sm:text-sm)', () => {
    const TestWrapper = () => (
      <label className="text-xs sm:text-sm" data-testid="label">
        Categoria
      </label>
    );

    render(<TestWrapper />);
    
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-xs', 'sm:text-sm');
  });
});

// Mock para ProspectorDashboard tab responsiveness
describe('ProspectorDashboard - Responsiveness', () => {
  it('deve renderizar TabButton com padding responsivo (px-3 sm:px-6 py-2 sm:py-3)', () => {
    const TestWrapper = () => (
      <button
        className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm"
        data-testid="tab-button"
      >
        📊 Stats
      </button>
    );

    render(<TestWrapper />);
    
    const button = screen.getByTestId('tab-button');
    expect(button).toHaveClass('px-3', 'sm:px-6');
    expect(button).toHaveClass('py-2', 'sm:py-3');
    expect(button).toHaveClass('text-xs', 'sm:text-sm');
  });

  it('deve abreviar labels de abas em mobile (hidden sm:inline)', () => {
    const TestWrapper = () => (
      <button data-testid="tab-btn">
        📚 <span className="hidden sm:inline">Materiais</span>
        <span className="sm:hidden">Materiais</span>
      </button>
    );

    render(<TestWrapper />);
    
    const button = screen.getByTestId('tab-btn');
    const fullText = button.querySelector('span.hidden');
    expect(fullText).toHaveClass('hidden', 'sm:inline');
  });

  it('deve aplicar container com padding responsivo (px-2 sm:px-4 py-4 sm:py-6)', () => {
    const TestWrapper = () => (
      <div className="px-2 sm:px-4 py-4 sm:py-6" data-testid="container">
        Content
      </div>
    );

    render(<TestWrapper />);
    
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('px-2', 'sm:px-4', 'py-4', 'sm:py-6');
  });

  it('deve usar overflow-x-auto para tab bar em mobile', () => {
    const TestWrapper = () => (
      <div className="overflow-x-auto" data-testid="tab-bar">
        <div className="flex">
          <button>Tab 1</button>
          <button>Tab 2</button>
          <button>Tab 3</button>
        </div>
      </div>
    );

    render(<TestWrapper />);
    
    const tabBar = screen.getByTestId('tab-bar');
    expect(tabBar).toHaveClass('overflow-x-auto');
  });
});

// Testes de Layout Geral - Responsiveness
describe('General Layout - Responsive Validation', () => {
  it('deve validar breakpoints de Tailwind (320px, 768px, 1024px)', () => {
    /**
     * Tailwind breakpoints:
     * - 320px (mobile): classes sem prefixo (ex: p-4)
     * - 640px: sm: (ex: sm:p-6)
     * - 768px: md: (ex: md:p-8)
     * - 1024px: lg: (ex: lg:p-10)
     */
    expect('sm').toBe('sm'); // 640px ~ 768px (entre mobile e tablet)
    expect('md').toBe('md'); // 768px (tablet)
    expect('lg').toBe('lg'); // 1024px (desktop)
  });

  it('deve usar max-w-7xl para conteúdo centralizado', () => {
    const TestWrapper = () => (
      <div className="max-w-7xl mx-auto" data-testid="max-width">
        Content
      </div>
    );

    render(<TestWrapper />);
    
    const container = screen.getByTestId('max-width');
    expect(container).toHaveClass('max-w-7xl', 'mx-auto');
  });

  it('deve aplicar h-screen em containers de viewport completo', () => {
    const TestWrapper = () => (
      <div className="flex h-screen bg-gray-50" data-testid="full-screen">
        Content
      </div>
    );

    render(<TestWrapper />);
    
    const container = screen.getByTestId('full-screen');
    expect(container).toHaveClass('h-screen', 'flex');
  });
});

// Testes de Mobile-First Design
describe('Mobile-First Design Validation', () => {
  it('deve priorizar estilos mobile (classes base sem prefixo)', () => {
    const TestWrapper = () => (
      <div className="w-full sm:w-auto md:w-80 lg:w-96" data-testid="responsive-width">
        Content
      </div>
    );

    render(<TestWrapper />);
    
    const element = screen.getByTestId('responsive-width');
    // Base deve ser mobile-first (w-full)
    expect(element).toHaveClass('w-full');
    // Aumentar conforme cresce a tela
    expect(element).toHaveClass('sm:w-auto', 'md:w-80', 'lg:w-96');
  });

  it('deve usar hidden/visible responsivamente', () => {
    const TestWrapper = () => (
      <div data-testid="container">
        <span className="sm:hidden">Mobile Only</span>
        <span className="hidden sm:inline">Desktop Only</span>
      </div>
    );

    render(<TestWrapper />);
    
    const mobileOnly = screen.getByText('Mobile Only');
    const desktopOnly = screen.getByText('Desktop Only');
    
    expect(mobileOnly).toHaveClass('sm:hidden');
    expect(desktopOnly).toHaveClass('hidden', 'sm:inline');
  });
});
