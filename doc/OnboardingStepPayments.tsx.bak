import React from 'react';

interface OnboardingStepPaymentsProps {
  onConnectStripe: () => void;
  isConnecting: boolean;
}

const OnboardingStepPayments: React.FC<OnboardingStepPaymentsProps> = ({ onConnectStripe, isConnecting }) => {
  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-900">Configuração de Pagamentos</h3>
      <p className="mt-2 text-sm text-gray-500">
        Para receber pagamentos pelos seus serviços de forma segura, conecte sua conta ao Stripe, nosso parceiro de pagamentos.
      </p>
      <div className="mt-6">
        <button
          onClick={onConnectStripe}
          disabled={isConnecting}
          className="w-full px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isConnecting ? 'Conectando...' : 'Conectar com Stripe'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStepPayments;