import React, { useState } from 'react';
import type { Job, User } from '../types';

interface DisputeModalProps {
  job: Job;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; description: string; files?: File[] }) => Promise<void>;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ job, user, isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) {
      setError('O motivo e a descrição são obrigatórios.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onSubmit({ reason, description });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar a disputa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" data-testid="dispute-modal">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Reportar Problema com o Serviço</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Serviço: <span className="font-semibold">{job.category}</span></p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Selecione um motivo</option>
              <option value="Serviço não concluído">Serviço não concluído</option>
              <option value="Qualidade insatisfatória">Qualidade insatisfatória</option>
              <option value="Dano à propriedade">Dano à propriedade</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descreva o problema em detalhes. Nossa equipe de mediação usará esta informação para analisar o caso."
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={isLoading} data-testid="submit-dispute-button" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300">
              {isLoading ? 'Enviando...' : 'Abrir Disputa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;