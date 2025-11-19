import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../../components/ProgressBar';

describe('ProgressBar', () => {
  it('renderiza barra de progresso com valor correto', () => {
    render(<ProgressBar value={50} />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('calcula porcentagem corretamente com max customizado', () => {
    render(<ProgressBar value={25} max={50} />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('não ultrapassa 100%', () => {
    render(<ProgressBar value={150} max={100} />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('não vai abaixo de 0%', () => {
    render(<ProgressBar value={-10} max={100} />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('exibe label quando fornecido', () => {
    render(<ProgressBar value={50} label="Carregando..." />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('exibe porcentagem quando showPercentage=true', () => {
    render(<ProgressBar value={75} showPercentage={true} />);
    
    expect(screen.getByTestId('percentage-text')).toHaveTextContent('75%');
  });

  it('não exibe porcentagem quando showPercentage=false', () => {
    render(<ProgressBar value={50} showPercentage={false} />);
    
    expect(screen.queryByTestId('percentage-text')).not.toBeInTheDocument();
  });

  it('exibe label e porcentagem juntos', () => {
    render(<ProgressBar value={60} label="Upload" showPercentage={true} />);
    
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByTestId('percentage-text')).toHaveTextContent('60%');
  });

  it('aplica variante blue (default)', () => {
    render(<ProgressBar value={50} />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveClass('bg-blue-600');
  });

  it('aplica variante green', () => {
    render(<ProgressBar value={50} variant="green" />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveClass('bg-green-600');
  });

  it('aplica variante yellow', () => {
    render(<ProgressBar value={50} variant="yellow" />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveClass('bg-yellow-600');
  });

  it('aplica variante red', () => {
    render(<ProgressBar value={50} variant="red" />);
    
    const fill = screen.getByTestId('progress-bar-fill');
    expect(fill).toHaveClass('bg-red-600');
  });

  it('aplica tamanho small', () => {
    render(<ProgressBar value={50} size="sm" />);
    
    const bg = screen.getByTestId('progress-bar-bg');
    expect(bg).toHaveClass('h-1');
  });

  it('aplica tamanho medium (default)', () => {
    render(<ProgressBar value={50} />);
    
    const bg = screen.getByTestId('progress-bar-bg');
    expect(bg).toHaveClass('h-2');
  });

  it('aplica tamanho large', () => {
    render(<ProgressBar value={50} size="lg" />);
    
    const bg = screen.getByTestId('progress-bar-bg');
    expect(bg).toHaveClass('h-4');
  });

  it('possui atributos aria corretos', () => {
    render(<ProgressBar value={30} max={100} />);
    
    const progressBar = screen.getByTestId('progress-bar-bg');
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '30');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('arredonda porcentagem exibida', () => {
    render(<ProgressBar value={33.33} max={100} showPercentage={true} />);
    
    // 33.33% deve ser arredondado para 33%
    expect(screen.getByTestId('percentage-text')).toHaveTextContent('33%');
  });
});
