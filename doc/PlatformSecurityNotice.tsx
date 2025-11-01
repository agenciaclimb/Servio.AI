import React from 'react';

const PlatformSecurityNotice: React.FC = () => {
  return (
    <div className="p-2 text-center bg-yellow-100 dark:bg-yellow-900/50 border-b border-yellow-300 dark:border-yellow-800">
      <p className="text-xs text-yellow-800 dark:text-yellow-200">
        <span className="font-bold">🔒 Segurança:</span> Para sua proteção, mantenha todas as negociações e pagamentos dentro da plataforma.
        A SERVIO.AI não se responsabiliza por acordos feitos externamente.
      </p>
    </div>
  );
};

export default PlatformSecurityNotice;