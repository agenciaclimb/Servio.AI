import React from 'react';
import { User } from '../../types';

interface AdminVerificationCardProps {
    provider: User;
    onApprove: () => void;
    onReject: () => void;
}

const AdminVerificationCard: React.FC<AdminVerificationCardProps> = ({ provider, onApprove, onReject }) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h4 className="font-bold text-gray-800">{provider.name}</h4>
                        <p className="text-sm text-gray-500">{provider.email}</p>
                    </div>
                    <span className="mt-2 sm:mt-0 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {provider.documentImage ? (
                        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                           <img src={provider.documentImage} alt="Documento" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                           <span>Imagem não disponível</span>
                        </div>
                    )}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-2">
                        <p className="font-semibold text-gray-500">Dados Extraídos pela IA:</p>
                        <div>
                            <p className="text-xs text-gray-400">Nome Completo</p>
                            <p className="font-medium text-gray-800">{provider.name || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-400">CPF</p>
                            <p className="font-medium text-gray-800">{provider.cpf || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3">
                <button onClick={onReject} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                    Recusar
                </button>
                 <button onClick={onApprove} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    Aprovar
                </button>
            </div>
        </div>
    );
};

export default AdminVerificationCard;
