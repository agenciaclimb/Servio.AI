import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../../components/StatCard';

describe('StatCard Component', () => {
  const defaultIcon = <span data-testid="stat-icon">📊</span>;

  it('renderiza título e valor', () => {
    render(
      <StatCard 
        title="Total de Usuários" 
        value="1.234"
        icon={defaultIcon}
      />
    );
    
    expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
    expect(screen.getByText('1.234')).toBeInTheDocument();
  });

  it('renderiza o ícone fornecido', () => {
    render(
      <StatCard 
        title="Vendas" 
        value="R$ 10.000"
        icon={defaultIcon}
      />
    );
    
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('renderiza mudança de aumento com cor verde', () => {
    render(
      <StatCard 
        title="Crescimento" 
        value="150"
        change="+25%"
        changeType="increase"
        icon={defaultIcon}
      />
    );
    
    const changeElement = screen.getByText('+25%');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('renderiza mudança de diminuição com cor vermelha', () => {
    render(
      <StatCard 
        title="Churn" 
        value="12"
        change="-5%"
        changeType="decrease"
        icon={defaultIcon}
      />
    );
    
    const changeElement = screen.getByText('-5%');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('não renderiza mudança quando não fornecida', () => {
    render(
      <StatCard 
        title="Simples" 
        value="42"
        icon={defaultIcon}
      />
    );
    
    // Verifica que não há elemento de mudança
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/-/)).not.toBeInTheDocument();
  });

  it('tem as classes de estilo do card', () => {
    const { container } = render(
      <StatCard 
        title="Card" 
        value="100"
        icon={defaultIcon}
      />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('shadow-sm');
  });

  it('valor é exibido em texto grande e bold', () => {
    render(
      <StatCard 
        title="Métrica" 
        value="999"
        icon={defaultIcon}
      />
    );
    
    const value = screen.getByText('999');
    expect(value).toHaveClass('text-2xl');
    expect(value).toHaveClass('font-bold');
  });
});
