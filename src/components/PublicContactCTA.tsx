import React from 'react';

interface PublicContactCTAProps {
  providerName: string;
  onContactClick: () => void;
}

const PublicContactCTA: React.FC<PublicContactCTAProps> = ({ providerName, onContactClick }) => {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200 bg-blue-50 -m-8 px-8 py-10 rounded-b-2xl">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">
          Gostou do perfil de {providerName}?
        </h2>
        <p className="mt-2 text-gray-600 max-w-lg mx-auto">
          Para garantir sua segurança e a qualidade do serviço, todas as negociações e pagamentos são feitos pela plataforma. Crie sua conta ou faça login para solicitar um orçamento.
        </p>
        <div className="mt-6">
          <button
            onClick={onContactClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg transform hover:scale-105 transition-transform"
          >
            Solicitar Orçamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicContactCTA;