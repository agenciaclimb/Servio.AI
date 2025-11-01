import React, { useState } from 'react';
import { User } from '../../types';
import { useStripe } from '@stripe/react-stripe-js';

interface SubscriptionCardProps {
  user: User;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ user }) => {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const isSubscribed = user.subscription?.status === 'active';

  const handleSubscribe = async () => {
    if (!stripe) return;
    setIsLoading(true);
    try {
      // Este ID de preço deve ser criado no seu painel do Stripe
      const PLAN_PRICE_ID = 'price_1P...'; // SUBSTITUA PELO SEU PRICE ID REAL

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/create-subscription-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PLAN_PRICE_ID, userEmail: user.email }),
      });
      const session = await response.json();
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Não foi possível iniciar a assinatura. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-2xl shadow-lg text-white">
        <h3 className="font-bold text-lg">Plano Destaque Ativo ⭐</h3>
        <p className="text-sm mt-1">Seu perfil está em destaque até {new Date(user.subscription!.currentPeriodEnd).toLocaleDateString()}.</p>
        <button className="mt-4 w-full text-center py-2 px-4 rounded-lg text-sm font-bold bg-white bg-opacity-20 hover:bg-opacity-30">
          Gerenciar Assinatura
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="font-bold text-lg text-gray-800">🚀 Impulsione seu Perfil!</h3>
      <p className="text-sm text-gray-600 mt-2">Assine o Plano Destaque e apareça no topo das buscas para receber mais propostas.</p>
      <ul className="text-sm text-gray-600 mt-3 space-y-1 list-disc list-inside">
        <li>Maior visibilidade</li>
        <li>Selo de "Destaque" no perfil</li>
        <li>Mais chances de ser contratado</li>
      </ul>
      <button onClick={handleSubscribe} disabled={isLoading} className="mt-4 w-full text-center py-3 px-4 rounded-lg text-base font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition duration-300 disabled:opacity-50">
        {isLoading ? 'Aguarde...' : 'Quero Destaque (R$ 29,90/mês)'}
      </button>
    </div>
  );
};

export default SubscriptionCard;