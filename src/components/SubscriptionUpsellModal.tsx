import React from 'react';

interface SubscriptionUpsellModalProps {
  onClose: () => void;
  onStartTrial: () => void;
  featureName: string;
}

const SubscriptionUpsellModal: React.FC<SubscriptionUpsellModalProps> = ({ onClose, onStartTrial, featureName }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all text-center p-8" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-gray-800">Desbloqueie seu Super Assistente!</h2>
        <p className="text-gray-600 mt-3">
          A funcionalidade de <strong>{featureName}</strong> e muitas outras ferramentas de IA estão disponíveis no nosso Plano Pro.
        </p>
        <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-800">
            Ative seu assistente e experimente todos os recursos Pro por 30 dias, gratuitamente.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onStartTrial}
            className="w-full px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Começar Teste Gratuito de 30 Dias
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpsellModal;