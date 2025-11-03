import React from 'react';
import { Link } from 'react-router-dom';

const BetaWelcomePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg my-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">🚀 Bem-vindo(a) ao Beta da SERVIO.AI!</h1>
        <p className="mt-4 text-lg text-gray-600">Obrigado por nos ajudar a construir a melhor plataforma de serviços do futuro.</p>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu Objetivo Principal</h2>
        <p className="text-gray-700">
          Sua missão, caso decida aceitá-la, é usar a plataforma como se fosse um usuário real e nos ajudar a encontrar problemas. Queremos que você **tente quebrar o sistema!** Encontrou um bug, um texto estranho ou teve uma ideia para melhorar? Nos avise!
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Guia Rápido: Como Testar</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800">1. Jornada do Cliente</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
              <li>Faça login como `cliente@servio.ai`.</li>
              <li>Crie um novo serviço (ex: "instalar prateleira").</li>
              <li>Aguarde propostas e converse com o prestador.</li>
              <li>Aceite uma proposta e simule o pagamento.</li>
              <li>Confirme a conclusão e deixe uma avaliação.</li>
            </ul>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800">2. Jornada do Prestador</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
              <li>Faça login como `prestador@servio.ai`.</li>
              <li>Encontre o serviço criado pelo cliente.</li>
              <li>Use o "Assistente de IA" para analisar a oportunidade.</li>
              <li>Envie uma proposta.</li>
              <li>Responda ao cliente no chat.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pronto para começar?</h2>
        <Link to="/dashboard" className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
          Ir para o Dashboard
        </Link>
      </section>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Encontrou um problema? Nos envie uma mensagem no grupo de suporte!</p>
      </footer>
    </div>
  );
};

export default BetaWelcomePage;