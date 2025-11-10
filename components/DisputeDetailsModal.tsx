import React, { useState, useEffect, useRef } from 'react';
import type { Job, Dispute, User, DisputeMessage } from '../types';

interface DisputeDetailsModalProps {
  job: Job;
  dispute: Dispute;
  currentUser: User;
  client: User;
  provider: User;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (disputeId: string, text: string) => void;
  onResolve?: (disputeId: string, resolution: Dispute['resolution']) => void; // Opcional, para admin
}

const DisputeDetailsModal: React.FC<DisputeDetailsModalProps> = ({
  job,
  dispute,
  currentUser,
  client,
  provider,
  isOpen,
  onClose,
  onSendMessage,
  onResolve,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [dispute.messages]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(dispute.id, newMessage);
      setNewMessage('');
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === client.email) return client.name;
    if (senderId === provider.email) return provider.name;
    if (senderId.includes('admin')) return 'Admin';
    return 'Sistema';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 h-[90vh] flex flex-col" data-testid="dispute-details-modal">
        <header className="relative p-6 border-b border-red-200 bg-red-50 flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">&times;</button>
          <h2 className="text-xl font-bold text-red-800">Mediação de Disputa</h2>
          <p className="text-sm text-red-600 truncate">Job: {job.category}</p>
          <p className="text-xs text-red-500 mt-1">Status: {dispute.status}</p>
        </header>

        <main className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50">
          {dispute.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.email ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${msg.senderId === currentUser.email ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p className="text-xs font-bold mb-1">{getSenderName(msg.senderId)}</p>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 text-right ${msg.senderId === currentUser.email ? 'text-blue-200' : 'text-gray-500'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {dispute.status === 'aberta' && (
          <footer className="p-4 border-t border-gray-200 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem para a mediação..."
                className="flex-grow block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-full shadow-sm"
              />
              <button type="submit" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
              </button>
            </form>
          </footer>
        )}

        {currentUser.type === 'admin' && onResolve && dispute.status === 'aberta' && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200">
            <h4 className="text-sm font-bold text-yellow-800 mb-2">Ações do Administrador</h4>
            <div className="flex gap-4">
              <button onClick={() => onResolve(dispute.id, { decidedBy: 'admin', outcome: 'reembolsado', reason: 'Decisão administrativa.' })} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Reembolsar Cliente
              </button>
              <button onClick={() => onResolve(dispute.id, { decidedBy: 'admin', outcome: 'liberado', reason: 'Decisão administrativa.' })} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Liberar para Prestador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeDetailsModal;