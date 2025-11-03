import React from 'react';

const ReportBugButton: React.FC = () => {
  const handleReportBug = () => {
    const subject = encodeURIComponent("Bug Report - Servio.AI Beta");
    const body = encodeURIComponent(
`🐛 BUG REPORT

O que eu tentei fazer:
[Descreva a ação que você estava tentando realizar]

O que aconteceu:
[Descreva o erro ou comportamento inesperado]

Navegador/Dispositivo:
[Ex: Chrome no Windows, Safari no iPhone]
`
    );
    window.location.href = `mailto:suporte@servio.ai?subject=${subject}&body=${body}`;
  };

  return (
    <button onClick={handleReportBug} className="fixed bottom-5 right-5 bg-red-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700 transition-transform transform hover:scale-110">
      <span className="text-2xl">🐞</span>
    </button>
  );
};

export default ReportBugButton;