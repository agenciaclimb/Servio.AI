import React, { useState } from 'react';

interface DisputeModalProps {
  jobId: string;
  onClose: () => void;
  onSubmit: (jobId: string, reason: string) => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ jobId, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Por favor, descreva o motivo da disputa.');
      return;
    }
    setIsLoading(true);
    await onSubmit(jobId, reason);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Abrir Disputa</h2>
        <p className="text-gray-600 mb-6">Por favor, descreva detalhadamente o problema. Nossa equipe de mediação analisará o caso e entrará em contato.</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ex: O serviço não foi concluído conforme o combinado, o prestador danificou um item, etc."
            required
          />
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:bg-red-300">
              {isLoading ? 'Enviando...' : 'Enviar Disputa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;