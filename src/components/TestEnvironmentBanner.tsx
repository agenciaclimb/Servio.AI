import React from 'react';

const TestEnvironmentBanner: React.FC = () => {
  return (
    <div className="bg-yellow-400 text-black text-center p-2 text-sm font-bold fixed top-0 left-0 right-0 z-50">
      🚧 AMBIENTE DE TESTE 🚧
    </div>
  );
};

export default TestEnvironmentBanner;