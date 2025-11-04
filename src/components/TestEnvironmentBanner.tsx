import React from 'react';

const TestEnvironmentBanner: React.FC = () => {
  const handleCopyToken = async () => {
    if (typeof window !== 'undefined' && typeof window.copyIdToken === 'function') {
      await window.copyIdToken();
    } else {
      alert('Função indisponível. Faça login e tente novamente.');
    }
  };

  return (
    <div className="bg-yellow-400 text-black p-2 text-sm font-bold fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
      <span>🚧 AMBIENTE DE TESTE 🚧</span>
      <button
        onClick={handleCopyToken}
        className="ml-3 px-2 py-1 bg-black/80 text-yellow-300 rounded hover:bg-black"
        title="Copiar Firebase ID Token para a área de transferência"
      >
        Copiar ID Token
      </button>
    </div>
  );
};

export default TestEnvironmentBanner;