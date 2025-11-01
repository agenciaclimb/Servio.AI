import React, { useState } from 'react';
import { User } from '../../types';

interface AuthModalProps {
  mode: 'login' | 'register';
  userType: User['type'];
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onSuccess: (email: string, type: User['type']) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, userType, onClose, onSwitchMode, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For the demo, we assume the provided email is valid.
    // We also need to determine the user type on login.
    // Let's default to 'cliente' if logging in, but this would
    // come from the backend in a real app.
    const typeForSuccess = isLogin ? 'cliente' : userType;
    
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
    
    onSuccess(email, typeForSuccess);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                {isLogin ? 'Bem-vindo de volta!' : (userType === 'cliente' ? 'Crie sua conta Cliente' : 'Seja um Prestador')}
            </h2>
            <p className="text-center text-gray-500 mb-6">
                {isLogin ? 'Acesse para continuar.' : 'É rápido e fácil.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Senha</label>
                    <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {!isLogin && (
                    <div>
                        <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                        <input type="password" id="confirm-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                )}
                
                {error && <p className="text-sm text-red-600">{error}</p>}

                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
            </form>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button onClick={() => onSwitchMode(isLogin ? 'register' : 'login')} className="font-medium text-blue-600 hover:text-blue-500 ml-1">
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