import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthModal from '../components/AuthModal';
import { User } from '../types';

vi.mock('../firebaseConfig', () => ({
  auth: {},
  signInWithGoogle: vi.fn().mockResolvedValue({ user: { email: 'google@teste.com' } }),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { email: 'mock@teste.com' } }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: { email: 'mock@teste.com' } }),
}));

const renderModal = (props?: Partial<React.ComponentProps<typeof AuthModal>>) => {
  const onClose = vi.fn();
  const onSwitchMode = vi.fn();
  const onSuccess = vi.fn();

  render(
    <AuthModal
      mode={props?.mode ?? 'login'}
      userType={props?.userType ?? ('cliente' as User['type'])}
      onClose={props?.onClose ?? onClose}
      onSwitchMode={props?.onSwitchMode ?? onSwitchMode}
      onSuccess={props?.onSuccess ?? onSuccess}
    />
  );

  return { onClose, onSwitchMode, onSuccess };
};

describe('AuthModal', () => {
  it('renderiza título de login e envia credenciais', async () => {
    const { onSuccess } = renderModal({ mode: 'login', userType: 'cliente' });

    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cliente@teste.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('cliente@teste.com', 'cliente');
    });
  });

  it('permite alternar para cadastro e valida senhas diferentes', () => {
    const { onSwitchMode } = renderModal({ mode: 'login', userType: 'prestador' });

    // Alterna para cadastro
    const toggle = screen.getByText('Cadastre-se');
    fireEvent.click(toggle);

    // onSwitchMode deve ser chamado com 'register'
    expect(onSwitchMode).toHaveBeenCalledWith('register');
  });

  it('em modo register, valida combinação de senhas e mínimo de caracteres', async () => {
    const { onSuccess } = renderModal({ mode: 'register', userType: 'prestador' });

    // Título para cadastro de prestador
    expect(screen.getByText('Seja um Prestador')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pro@teste.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '99999' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    // Deve exibir erro de senhas diferentes
    expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument();

    // Corrige para senha curta e igual
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '12345' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    // Deve exibir erro de tamanho mínimo
    expect(screen.getByText(/A senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();

    // Corrige com senha válida
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    // onSuccess deve ser chamado com userType recebido nas props (prestador)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('pro@teste.com', 'prestador');
    });
  });

  it('fecha ao clicar no botão de fechar (X) ou fora do modal', () => {
    const { onClose } = renderModal({ mode: 'login', userType: 'cliente' });

    fireEvent.click(screen.getByTestId('auth-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renderiza título correto para cadastro de cliente', () => {
    renderModal({ mode: 'register', userType: 'cliente' });
    expect(screen.getByText('Crie sua conta Cliente')).toBeInTheDocument();
    expect(screen.getByText('É rápido e fácil.')).toBeInTheDocument();
  });

  it('permite alternar de cadastro para login', () => {
    const { onSwitchMode } = renderModal({ mode: 'register', userType: 'cliente' });
    const toggle = screen.getByText('Faça login');
    fireEvent.click(toggle);
    expect(onSwitchMode).toHaveBeenCalledWith('login');
  });

  it('em login com prestador, dispara onSuccess com tipo correto', async () => {
    const { onSuccess } = renderModal({ mode: 'login', userType: 'prestador' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pro@teste.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaOk' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('pro@teste.com', 'prestador');
    });
  });

  it('limpa mensagem de erro quando usuário corrige as senhas', () => {
    renderModal({ mode: 'register', userType: 'cliente' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'c@t.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '99999' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));
    expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument();

    // Corrige para senhas iguais mas ainda curtas
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '12345' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    // Mensagem de senhas diferentes some e exibe erro de tamanho mínimo
    expect(screen.queryByText(/As senhas não coincidem/i)).not.toBeInTheDocument();
    expect(screen.getByText(/A senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
  });

  it('fecha ao clicar fora do conteúdo (overlay)', () => {
    const { onClose } = renderModal({ mode: 'login', userType: 'cliente' });
    // O overlay possui data-testid="auth-modal" e fecha ao clicar nele
    fireEvent.click(screen.getByTestId('auth-modal'));
    expect(onClose).toHaveBeenCalled();
  });
});
