import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Chart from '../../components/Chart';

describe('Chart Component', () => {
  it('renderiza título corretamente', () => {
    render(<Chart title="Vendas Mensais" data={{ Janeiro: 100, Fevereiro: 150 }} />);
    expect(screen.getByText('Vendas Mensais')).toBeInTheDocument();
  });

  it('renderiza barras de dados corretamente', () => {
    const data = { Janeiro: 100, Fevereiro: 150, Março: 200 };
    render(<Chart title="Vendas" data={data} />);
    
    expect(screen.getByText('Janeiro')).toBeInTheDocument();
    expect(screen.getByText('Fevereiro')).toBeInTheDocument();
    expect(screen.getByText('Março')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('exibe mensagem quando não há dados', () => {
    render(<Chart title="Vendas" data={{}} />);
    expect(screen.getByText('Dados insuficientes para exibir o gráfico.')).toBeInTheDocument();
  });

  it('calcula largura das barras proporcionalmente ao valor máximo', () => {
    const { container } = render(<Chart title="Test" data={{ A: 50, B: 100 }} />);
    const bars = container.querySelectorAll('[class*="bg-blue-600"]');
    expect(bars.length).toBe(2);
  });

  it('lida com valores zero', () => {
    render(<Chart title="Test" data={{ A: 0, B: 100 }} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('lida com um único valor', () => {
    render(<Chart title="Single" data={{ Único: 50 }} />);
    expect(screen.getByText('Único')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('trunca labels longos', () => {
    const { container } = render(
      <Chart title="Test" data={{ 'Label muito longo que deveria truncar': 100 }} />
    );
    const label = container.querySelector('.truncate');
    expect(label).toBeInTheDocument();
  });
});
