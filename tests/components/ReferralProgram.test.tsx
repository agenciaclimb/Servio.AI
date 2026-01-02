import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReferralProgram from '../../components/ReferralProgram';

describe('ReferralProgram Component', () => {
  const mockOnSendReferral = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    expect(screen.getByText('Indique um Colega e Ganhe!')).toBeInTheDocument();
  });

  it('renderiza a descrição do programa', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    expect(screen.getByText(/Conhece um profissional talentoso/)).toBeInTheDocument();
    expect(screen.getByText(/você ganha R\$50/)).toBeInTheDocument();
  });

  it('renderiza campo de email', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('campo de email é obrigatório', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com');
    expect(input).toHaveAttribute('required');
  });

  it('tem label acessível para o campo de email', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    expect(screen.getByLabelText('Email do amigo')).toBeInTheDocument();
  });

  it('renderiza botão de enviar', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    expect(screen.getByRole('button', { name: /Convidar com IA/i })).toBeInTheDocument();
  });

  it('permite digitar no campo de email', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'amigo@example.com' } });
    
    expect(input.value).toBe('amigo@example.com');
  });

  it('chama onSendReferral com email ao submeter', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com');
    const button = screen.getByRole('button', { name: /Convidar com IA/i });
    
    fireEvent.change(input, { target: { value: 'colega@example.com' } });
    fireEvent.click(button);
    
    expect(mockOnSendReferral).toHaveBeenCalledWith('colega@example.com');
  });

  it('limpa o campo após enviar', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /Convidar com IA/i });
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);
    
    expect(input.value).toBe('');
  });

  it('não envia se email estiver vazio', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const button = screen.getByRole('button', { name: /Convidar com IA/i });
    fireEvent.click(button);
    
    expect(mockOnSendReferral).not.toHaveBeenCalled();
  });

  it('remove espaços em branco antes de enviar', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const input = screen.getByPlaceholderText('email.do.seu.colega@exemplo.com');
    const button = screen.getByRole('button', { name: /Convidar com IA/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(button);
    
    expect(mockOnSendReferral).not.toHaveBeenCalled();
  });

  it('tem classes de estilo do card branco', () => {
    const { container } = render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('shadow-lg');
  });

  it('botão tem cores azuis', () => {
    render(<ReferralProgram onSendReferral={mockOnSendReferral} />);
    
    const button = screen.getByRole('button', { name: /Convidar com IA/i });
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('hover:bg-blue-700');
  });
});
