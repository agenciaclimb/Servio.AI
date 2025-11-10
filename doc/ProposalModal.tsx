import React, { useState } from 'react';
import type { Job, Proposal } from '../types';

interface ProposalModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposalData: Omit<Proposal, 'id' | 'jobId' | 'providerId' | 'providerName' | 'status' | 'createdAt'>) => void;
  isLoading: boolean;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ job, isOpen, onClose, onSubmit, isLoading }) => {
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !job) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !description || !estimatedDuration) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (price <= 0) {
      setError('O valor da proposta deve ser positivo.');
      return;
    }
    setError('');
    onSubmit({
      price: Number(price),
      description,
      estimatedDuration,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" data-testid="proposal-modal">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Sua proposta para o serviço</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-1">Serviço:</p>
        <p className="font-semibold text-gray-900 mb-4">{job.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Valor da Proposta (R$)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: 150,00"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Proposta
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descreva sua experiência, o que está incluso no valor e por que você é a pessoa certa para este serviço."
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Estimado para Conclusão
            </label>
            <input
              type="text"
              id="estimatedDuration"
              name="estimatedDuration"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: 2-3 horas, 1 dia útil"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
              {isLoading ? 'Enviando...' : 'Enviar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;