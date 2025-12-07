import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { signInWithGoogle, auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthModalProps {
  mode: 'login' | 'register';
  userType: User['type'];
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onSuccess: (email: string, type: User['type'], inviteCode?: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  mode,
  userType,
  onClose,
  onSwitchMode,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const isLogin = mode === 'login';

  // Capture invite code from URL
  useEffect(() => {
    if (!isLogin && userType === 'prestador') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('invite');
      if (code) {
        setInviteCode(code);
      }
    }
  }, [isLogin, userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    try {
      if (isLogin) {
        // Autenticar com Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Criar conta no Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);
      }

      // Chamar callback de sucesso
      if (inviteCode) {
        onSuccess(email, userType, inviteCode);
      } else {
        onSuccess(email, userType);
      }
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err);
      const errorCode = (err as { code?: string }).code;
      if (
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/user-not-found'
      ) {
        setError('Email ou senha incorretos.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else {
        setError('Erro ao autenticar. Tente novamente.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithGoogle();
      const userEmail = result.user?.email;
      if (!userEmail) {
        setError('Não foi possível obter o email da conta Google.');
        return;
      }
      if (inviteCode) {
        onSuccess(userEmail, userType, inviteCode);
      } else {
        onSuccess(userEmail, userType);
      }
    } catch (err: unknown) {
      console.error('Erro ao entrar com Google', err);
      setError('Não foi possível entrar com Google. Tente novamente.');
    }
  };

  return (
    <div
      {...getModalOverlayProps(onClose)}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      data-testid="auth-modal"
    >
      <div
        {...getModalContentProps()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all"
      >
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-600"
            data-testid="auth-modal-close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {isLogin
              ? 'Bem-vindo de volta!'
              : userType === 'cliente'
                ? 'Crie sua conta Cliente'
                : 'Seja um Prestador'}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {isLogin ? 'Acesse para continuar.' : 'É rápido e fácil.'}
          </p>

          {inviteCode && !isLogin && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                🎉 Você foi convidado por um membro da equipe Servio.AI!
              </p>
              <p className="text-xs text-blue-600 text-center mt-1">
                Código: <strong>{inviteCode}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-testid="auth-submit-button"
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4">
              <div className="flex items-center mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-2 text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-testid="auth-google-button"
              >
                <span className="text-lg">G</span>
                <span>Entrar com Google</span>
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => onSwitchMode(isLogin ? 'register' : 'login')}
                className="font-medium text-blue-600 hover:text-blue-500 ml-1"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
