import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

interface LoginProps {
  // onLogin is no longer needed as App.tsx will listen to auth state changes
}

const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx will handle the redirect
    } catch (err: any) {
      setError("Falha no login. Verifique seu e-mail e senha.");
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // App.tsx will handle the redirect
    } catch (err: any) {
      setError("Falha no login com Google.");
      console.error(err);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456'); // Mock password
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Acesse sua conta
        </h2>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input id="email-address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Endereço de e-mail" />
            </div>
            <div>
              <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Senha" />
            </div>
          </div>

          <div>
            <button onClick={handleEmailLogin} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Entrar
            </button>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">Ou continue com</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div>
            <button onClick={handleGoogleLogin} className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Login com Google
            </button>
          </div>
          <div className="text-center text-sm">
            <p className="text-gray-600">Logins de demonstração:</p>
            <button onClick={() => handleDemoLogin('cliente@servio.ai')} className="font-medium text-blue-600 hover:text-blue-500">Cliente</button> |
            <button onClick={() => handleDemoLogin('prestador@servio.ai')} className="font-medium text-blue-600 hover:text-blue-500"> Prestador</button> |
            <button onClick={() => handleDemoLogin('admin@servio.ai')} className="font-medium text-blue-600 hover:text-blue-500"> Admin</button>
          </div>
          <div className="text-center text-sm">
            <Link to="/" className="font-medium text-gray-600 hover:text-blue-500">&larr; Voltar para a página inicial</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;