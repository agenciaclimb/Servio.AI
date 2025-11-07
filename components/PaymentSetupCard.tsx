import React, { useState } from 'react';
import { User } from '../types';
import * as API from '../services/api';

interface PaymentSetupCardProps {
  user: User;
}

const PaymentSetupCard: React.FC<PaymentSetupCardProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOnboarding = async () => {
    setIsLoading(true);
    try {
      let accountId = user.stripeAccountId;

      // 1. Create a connect account if it doesn't exist
      if (!accountId) {
        const accountResponse = await API.createStripeConnectAccount(user.email);
        accountId = accountResponse.accountId;
      }

      // 2. Create an account link
      const linkResponse = await API.createStripeAccountLink(user.email);

      // 3. Redirect to Stripe
      window.location.href = linkResponse.url;

    } catch (error) {
      console.error("Failed to start Stripe onboarding:", error);
      alert("Ocorreu um erro ao iniciar a configuração de pagamentos. Tente novamente.");
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
          <button onClick={handleOnboarding} disabled={isLoading} className="mt-2 text-sm font-medium text-green-800 hover:underline">Gerenciar Conta</button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-4">Conecte sua conta ao Stripe para receber pagamentos de forma segura pelos seus serviços.</p>
      )}
      {!user.stripeAccountId && <button onClick={handleOnboarding} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">{isLoading ? 'Aguarde...' : 'Configurar Pagamentos'}</button>}
    </div>
  );
};

export default PaymentSetupCard;