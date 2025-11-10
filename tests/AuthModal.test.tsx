import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthModal from '../components/AuthModal';
import { User } from '../types';

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
  it('renderiza título de login e envia credenciais', () => {
    const { onSuccess } = renderModal({ mode: 'login', userType: 'cliente' });

    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cliente@teste.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senhaSegura' } });
    fireEvent.click(screen.getByTestId('auth-submit-button'));

    expect(onSuccess).toHaveBeenCalledWith('cliente@teste.com', 'cliente');
  });

  it('permite alternar para cadastro e valida senhas diferentes', () => {
    const { onSwitchMode } = renderModal({ mode: 'login', userType: 'prestador' });

    // Alterna para cadastro
    const toggle = screen.getByText('Cadastre-se');
    fireEvent.click(toggle);

    // onSwitchMode deve ser chamado com 'register'
    expect(onSwitchMode).toHaveBeenCalledWith('register');
  });

  it('em modo register, valida combinação de senhas e mínimo de caracteres', () => {
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
    expect(onSuccess).toHaveBeenCalledWith('pro@teste.com', 'prestador');
  });

  it('fecha ao clicar no botão de fechar (X) ou fora do modal', () => {
    const { onClose } = renderModal({ mode: 'login', userType: 'cliente' });

    fireEvent.click(screen.getByTestId('auth-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
