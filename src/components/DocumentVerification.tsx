import React, { useState } from 'react';
import { Job, DocumentRequest } from '../../types';

interface DocumentVerificationProps {
  job: Job;
  isSubscribed: boolean;
  onUpgradeClick: () => void;
  onRequestDocument: (documentName: string) => void;
  onFileUpload: (requestId: string, file: File) => void;
  isClientView: boolean;
}

const statusStyles = {
  solicitado: 'bg-yellow-100 text-yellow-800',
  enviado: 'bg-blue-100 text-blue-800',
  verificado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

const DocumentVerification: React.FC<DocumentVerificationProps> = ({ job, isSubscribed, onUpgradeClick, onRequestDocument, onFileUpload, isClientView }) => {
  const [newDocName, setNewDocName] = useState('');

  const handleRequest = () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    if (newDocName.trim()) {
      onRequestDocument(newDocName.trim());
      setNewDocName('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800">Verificação de Documentos</h2>
      <p className="text-sm text-gray-500 mt-1">Solicite e valide documentos do prestador para este serviço.</p>

      {isClientView && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Ex: Apólice de Seguro"
          />
          <button onClick={handleRequest} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            {isSubscribed ? 'Solicitar' : 'Solicitar 🚀'}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {job.documentRequests?.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Nenhum documento solicitado para este serviço.</p>}
        {job.documentRequests?.map(req => (
          <div key={req.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-700">{req.documentName}</p>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[req.status]}`}>{req.status}</span>
            </div>
            {req.status === 'enviado' && req.fileUrl && (
              <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 block">Ver Documento Enviado</a>
            )}
            {!isClientView && req.status === 'solicitado' && (
              <div className="mt-3">
                <label htmlFor={`file-upload-${req.id}`} className="text-xs font-medium text-blue-600 cursor-pointer hover:underline">
                  Anexar e Enviar Documento
                </label>
                <input 
                  id={`file-upload-${req.id}`} 
                  type="file" 
                  className="hidden"
                  onChange={(e) => e.target.files && onFileUpload(req.id, e.target.files[0])}
                />
              </div>
            )}
            {req.analysis && (
              <div className="mt-3 pt-3 border-t text-xs">
                <p className="font-bold">Análise da IA:</p>
                <p className="italic text-gray-600">"{req.analysis.summary}"</p>
                <p className={`font-semibold mt-1 ${req.analysis.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {req.analysis.isValid ? 'Parece Válido' : 'Requer Atenção'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentVerification;