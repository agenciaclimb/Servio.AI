import React, { useEffect, useMemo } from 'react';
import * as API from '../services/api';

const PaymentSuccessPage: React.FC = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const jobId = searchParams.get('job_id');

      if (sessionId && jobId) {
        try {
          // Simula a confirmação do webhook e a criação do escrow no backend
          await API.confirmPayment(jobId, sessionId);
        } catch (error) {
          // Idealmente, mostrar um erro para o usuário
        }
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-lg">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Pagamento Confirmado!</h1>
        <p className="text-gray-600 mt-2">
          Seu pagamento foi processado com sucesso. O profissional foi notificado e você pode
          acompanhar o andamento do serviço no seu painel.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          ID da Sessão: {searchParams.get('session_id') || '—'}
        </p>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="mt-8 w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
