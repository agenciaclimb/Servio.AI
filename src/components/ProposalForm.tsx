import React, { useState, useEffect } from 'react';

interface ProposalFormProps {
  initialMessage: string;
  onSubmit: (price: number, message: string) => void;
  isLoading: boolean;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ initialMessage, onSubmit, isLoading }) => {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }
    onSubmit(numericPrice, message);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sua Proposta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Seu Orçamento (R$)</label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">R$</span>
            </div>
            <input
              type="number"
              id="price"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2"
              placeholder="150.00"
              step="0.01"
            />
          </div>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensagem</label>
          <textarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Apresente-se e explique por que você é a pessoa certa para este trabalho."
          />
        </div>
        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? 'Enviando...' : 'Enviar Proposta'}
        </button>
      </form>
    </div>
  );
};

export default ProposalForm;