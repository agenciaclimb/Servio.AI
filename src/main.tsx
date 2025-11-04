import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import App from './App'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css'
import { auth } from '../firebaseConfig'

// Always provide a Stripe Elements context to avoid runtime crashes when some
// component calls useStripe/useElements at app startup. If the env var isn't
// set locally, fall back to Stripe's public demo key (safe for dev only).
const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) 
  || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(publishableKey);
console.log('[Stripe] Using publishable key:', publishableKey ? publishableKey.slice(0, 12) + '...' : 'undefined');

// Expor utilitários no window para facilitar testes manuais (somente em dev/preview)
// window.getIdToken(): retorna o Firebase ID Token do usuário logado
// window.copyIdToken(): copia o token para a área de transferência
if (typeof window !== 'undefined') {
  // Exibir rapidamente informações da configuração do Firebase no console
  try {
    const appOptions: any = (auth as any)?.app?.options || {};
    const apiKeyMasked = appOptions.apiKey ? String(appOptions.apiKey).slice(0, 8) + '...' : 'undefined';
    console.log('[Firebase] Config carregada:', { apiKey: apiKeyMasked, authDomain: appOptions.authDomain, projectId: appOptions.projectId });
    // Utilitário para depurar manualmente
    (window as any).showFirebaseConfig = () => console.table({
      apiKey: apiKeyMasked,
      authDomain: appOptions.authDomain,
      projectId: appOptions.projectId,
      storageBucket: appOptions.storageBucket,
      appId: appOptions.appId,
    });
  } catch (e) {
    console.warn('[Firebase] Não foi possível inspecionar a configuração.', e);
  }
  (window as any).getIdToken = async () => {
    try {
      return await auth.currentUser?.getIdToken();
    } catch (e) {
      console.warn('[Auth] Não foi possível obter o ID token:', e);
      return undefined;
    }
  };
  (window as any).copyIdToken = async () => {
    const token = await (window as any).getIdToken?.();
    if (!token) {
      alert('Faça login primeiro para gerar o ID Token.');
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      alert('ID Token copiado para a área de transferência.');
    } catch (e) {
      console.warn('Falha ao copiar o token:', e);
      alert('Token obtido. Copie manualmente do console.');
      console.log('ID Token:', token);
    }
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        {/* Router must be outermost; Elements must wrap ANY component that uses Stripe hooks, including providers */}
        <BrowserRouter>
          <Elements stripe={stripePromise}>
            <AppProvider>
              <App />
            </AppProvider>
          </Elements>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
)