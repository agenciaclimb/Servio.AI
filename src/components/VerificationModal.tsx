import React from 'react';
import { User } from '../../types';

interface VerificationModalProps {
  user: User;
  onClose: () => void;
  onVerify: (userId: string, newStatus: 'verificado' | 'recusado') => void;
}

const DetailItem: React.FC<{ label: string; value?: string | string[] }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-md text-gray-800">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
  </div>
);

const VerificationModal: React.FC<VerificationModalProps> = ({ user, onClose, onVerify }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Analisar Prestador</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <div className="space-y-4 mb-8">
          <DetailItem label="Nome" value={user.name} />
          <DetailItem label="Email" value={user.email} />
          <DetailItem label="CPF" value={user.cpf} />
          <DetailItem label="Endereço" value={user.address} />
          <DetailItem label="Título Profissional" value={user.headline} />
          <DetailItem label="Biografia" value={user.bio} />
          <DetailItem label="Especialidades" value={user.specialties} />
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => onVerify(user.email, 'recusado')}
            className="px-6 py-2 border border-red-300 text-red-600 font-medium rounded-md hover:bg-red-50"
          >
            Rejeitar
          </button>
          <button 
            onClick={() => onVerify(user.email, 'verificado')}
            className="px-6 py-2 border border-transparent bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
          >
            Aprovar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;