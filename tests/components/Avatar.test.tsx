import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from '../../components/Avatar';

describe('Avatar', () => {
  it('renderiza iniciais quando imageUrl não fornecido', () => {
    render(<Avatar name="João Silva" />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('JS');
  });

  it('renderiza apenas primeira e última inicial para nomes completos', () => {
    render(<Avatar name="Maria Helena Costa Santos" />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('MS');
  });

  it('renderiza apenas uma inicial para nome único', () => {
    render(<Avatar name="Carlos" />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('C');
  });

  it('renderiza ? para nome vazio', () => {
    render(<Avatar name="" />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('?');
  });

  it('renderiza imagem quando imageUrl fornecido', () => {
    render(<Avatar name="João Silva" imageUrl="https://example.com/avatar.jpg" />);
    
    const img = screen.getByAltText('João Silva');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(screen.queryByTestId('avatar-initials')).not.toBeInTheDocument();
  });

  it('aplica tamanho small', () => {
    render(<Avatar name="User" size="sm" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('w-8', 'h-8');
  });

  it('aplica tamanho medium (default)', () => {
    render(<Avatar name="User" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('w-12', 'h-12');
  });

  it('aplica tamanho large', () => {
    render(<Avatar name="User" size="lg" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('w-16', 'h-16');
  });

  it('aplica tamanho extra large', () => {
    render(<Avatar name="User" size="xl" />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('w-24', 'h-24');
  });

  it('não renderiza status quando não fornecido', () => {
    render(<Avatar name="User" />);
    
    expect(screen.queryByTestId('avatar-status')).not.toBeInTheDocument();
  });

  it('renderiza status online com cor verde', () => {
    render(<Avatar name="User" status="online" />);
    
    const status = screen.getByTestId('avatar-status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('bg-green-500');
    expect(status).toHaveAttribute('aria-label', 'Status: online');
  });

  it('renderiza status offline com cor cinza', () => {
    render(<Avatar name="User" status="offline" />);
    
    const status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-gray-400');
  });

  it('renderiza status busy com cor vermelha', () => {
    render(<Avatar name="User" status="busy" />);
    
    const status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-red-500');
  });

  it('renderiza status away com cor amarela', () => {
    render(<Avatar name="User" status="away" />);
    
    const status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-yellow-500');
  });

  it('converte iniciais para maiúsculas', () => {
    render(<Avatar name="ana paula" />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('AP');
  });

  it('lida com espaços extras no nome', () => {
    render(<Avatar name="  Pedro   Oliveira  " />);
    
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('PO');
  });
});
