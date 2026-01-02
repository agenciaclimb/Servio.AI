import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CollapsibleSidebar from '../../components/CollapsibleSidebar';

describe('CollapsibleSidebar Component', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    mockOnItemClick.mockClear();
  });

  it('renderiza 5 itens de navegação (ícones)', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    // Verifica que há 5 links de navegação (ícones)
    const navLinks = container.querySelectorAll('nav a');
    expect(navLinks.length).toBe(5);
  });

  it('inicia colapsado por padrão', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('w-20');
  });

  it('expande ao clicar no botão de toggle', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    const toggleButton = container.querySelector('button');
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton!);
    
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('w-64');
  });

  it('mostra logo e labels quando expandido', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    // Inicialmente colapsado, não mostra logo
    expect(screen.queryByText('Servio.AI')).not.toBeInTheDocument();
    
    // Expande
    const toggleButton = container.querySelector('button');
    fireEvent.click(toggleButton!);
    
    // Agora mostra logo e labels
    expect(screen.getByText('Servio.AI')).toBeInTheDocument();
    expect(screen.getByText('Dashboard IA')).toBeInTheDocument();
    expect(screen.getByText('Pipeline CRM')).toBeInTheDocument();
  });

  it('chama onItemClick ao clicar em um item', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    // Clica no segundo link (CRM - index 1)
    const navLinks = container.querySelectorAll('nav a');
    fireEvent.click(navLinks[1]);
    
    expect(mockOnItemClick).toHaveBeenCalledWith('crm');
  });

  it('destaca o item ativo com classes de estilo', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="crm" onItemClick={mockOnItemClick} />
    );
    
    // O segundo link (crm) deve estar ativo
    const navLinks = container.querySelectorAll('nav a');
    const crmLink = navLinks[1];
    
    expect(crmLink).toHaveClass('bg-indigo-50');
    expect(crmLink).toHaveClass('text-indigo-600');
    expect(crmLink).toHaveClass('border-r-4');
  });

  it('permite alternar entre expandido e colapsado', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    const toggleButton = container.querySelector('button');
    const sidebar = container.firstChild;
    
    // Inicia colapsado
    expect(sidebar).toHaveClass('w-20');
    
    // Expande
    fireEvent.click(toggleButton!);
    expect(sidebar).toHaveClass('w-64');
    
    // Colapsa novamente
    fireEvent.click(toggleButton!);
    expect(sidebar).toHaveClass('w-20');
  });

  it('cada item de navegação tem um ícone SVG', () => {
    const { container } = render(
      <CollapsibleSidebar activeItem="dashboard" onItemClick={mockOnItemClick} />
    );
    
    const navLinks = container.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
