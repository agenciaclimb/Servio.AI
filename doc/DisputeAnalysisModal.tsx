import React, { useState } from 'react';
import { Job, Dispute } from '../types';

interface DisputeAnalysisModalProps {
  job: Job;
  dispute: Dispute;
  onClose: () => void;
  onResolve: (disputeId: string, resolution: 'release_to_provider' | 'refund_client', comment: string) => void;
}

const DisputeAnalysisModal: React.FC<DisputeAnalysisModalProps> = ({ job, dispute, onClose, onResolve }) => {
  const [resolutionComment, setResolutionComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResolve = async (resolution: 'release_to_provider' | 'refund_client') => {
    if (!resolutionComment.trim()) {
      alert('Por favor, adicione um comentário com a justificativa da decisão.');
      return;
    }
    setIsLoading(true);
    await onResolve(dispute.id, resolution, resolutionComment);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Analisar Disputa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg border">
          <p><span className="font-semibold">Job:</span> {job.category}</p>
          <p><span className="font-semibold">Iniciada por:</span> {dispute.initiatorId}</p>
          <p className="font-semibold">Motivo:</p>
          <p className="text-gray-700 italic border-l-4 pl-4">"{dispute.reason}"</p>
        </div>

        <div className="mb-6">
          <label htmlFor="resolution-comment" className="block text-sm font-medium text-gray-700">Justificativa da Decisão</label>
          <textarea
            id="resolution-comment"
            rows={3}
            value={resolutionComment}
            onChange={(e) => setResolutionComment(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Descreva o motivo da sua decisão. Esta mensagem será enviada para as partes."
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={() => handleResolve('refund_client')} disabled={isLoading} className="px-6 py-2 border border-orange-300 text-orange-600 font-medium rounded-md hover:bg-orange-50 disabled:opacity-50">
            Reembolsar Cliente
          </button>
          <button onClick={() => handleResolve('release_to_provider')} disabled={isLoading} className="px-6 py-2 border border-transparent bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
            Liberar para Prestador
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisputeAnalysisModal;