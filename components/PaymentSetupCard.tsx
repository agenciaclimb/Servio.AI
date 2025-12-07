import React, { useState } from 'react';
import { User } from '../types';
import * as API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatErrorForToast, getErrorAction } from '../services/errorMessages';

interface PaymentSetupCardProps {
  user: User;
}

const PaymentSetupCard: React.FC<PaymentSetupCardProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleOnboarding = async () => {
    setIsLoading(true);
    try {
      // 1. Create a connect account if it doesn't exist
      if (!user.stripeAccountId) {
        await API.createStripeConnectAccount(user.email);
      }

      // 2. Create an account link (works for first-time onboarding or managing existing account)
      const linkResponse = await API.createStripeAccountLink(user.email);

      // 3. Redirect to Stripe
      globalThis.location.href = linkResponse.url;
    } catch (error: unknown) {
      console.error('Failed to start Stripe onboarding:', error);
      const message = formatErrorForToast(error, 'payment');
      const action = getErrorAction(error);
      const actionHint =
        action === 'support' ? ' Entre em contato com o suporte se o problema persistir.' : '';
      addToast(`${message}${actionHint}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg text-gray-800 mb-2">Configuração de Pagamentos</h3>
      {user.stripeAccountId ? (
        <div className="text-center bg-green-50 text-green-700 p-4 rounded-md">
          <p className="font-semibold">✅ Conta Conectada</p>
          <p className="text-sm">Você está pronto para receber pagamentos.</p>
          <button
            onClick={handleOnboarding}
            disabled={isLoading}
            className="mt-2 text-sm font-medium text-green-800 hover:underline"
          >
            Gerenciar Conta
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-4">
          Conecte sua conta ao Stripe para receber pagamentos de forma segura pelos seus serviços.
        </p>
      )}
      {!user.stripeAccountId && (
        <button
          onClick={handleOnboarding}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isLoading ? 'Aguarde...' : 'Configurar Pagamentos'}
        </button>
      )}
    </div>
  );
};

export default PaymentSetupCard;
