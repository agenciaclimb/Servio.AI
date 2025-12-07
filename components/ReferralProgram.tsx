import React, { useState } from 'react';

interface ReferralProgramProps {
  onSendReferral: (friendEmail: string) => void;
}

const ReferralProgram: React.FC<ReferralProgramProps> = ({ onSendReferral }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSendReferral(email);
      setEmail('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col">
      <h3 className="font-bold text-gray-800 text-lg">Indique um Colega e Ganhe!</h3>
      <p className="text-sm text-gray-600 mt-2 flex-grow">
        Conhece um profissional talentoso? Convide-o para a SERVIO.AI. Quando ele completar o
        primeiro serviço, você ganha R$50!
      </p>
      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor="referral-email" className="sr-only">
          Email do amigo
        </label>
        <input
          id="referral-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email.do.seu.colega@exemplo.com"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
        />
        <button
          type="submit"
          className="mt-3 w-full text-center py-2 px-4 border rounded-lg text-sm font-medium transition-colors border-transparent text-white bg-blue-600 hover:bg-blue-700"
        >
          Convidar com IA ✨
        </button>
      </form>
    </div>
  );
};

export default ReferralProgram;
