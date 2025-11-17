
import React from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { Prospect } from '../types';

interface ProspectingNotificationModalProps {
  prospects: Prospect[];
  onClose: () => void;
}

const ProspectingNotificationModal: React.FC<ProspectingNotificationModalProps> = ({ prospects, onClose }) => {
    return (
        <div {...getModalOverlayProps(onClose)} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div {...getModalContentProps()} className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all">
                <div className="p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mt-4">Estamos Buscando por Você!</h2>
                    <p className="text-gray-600 mt-2">
                        Não encontramos um profissional 100% compatível em sua área no momento, mas não se preocupe!
                    </p>
                    <p className="text-gray-600 mt-1">
                        Nossa equipe foi notificada e já está buscando ativamente os melhores talentos para o seu serviço. Entraremos em contato em breve.
                    </p>
                     <div className="mt-6 text-left text-xs bg-gray-50 p-3 rounded-lg border">
                        <p className="font-semibold text-gray-600">A IA sugeriu os seguintes perfis para nossa equipe de prospecção:</p>
                        <ul className="list-disc list-inside mt-2 text-gray-600">
                            {prospects.map(p => <li key={p.name}>{p.name} ({p.specialty})</li>)}
                        </ul>
                    </div>
                    <div className="mt-6">
                        <button 
                            onClick={onClose}
                            className="w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProspectingNotificationModal;
