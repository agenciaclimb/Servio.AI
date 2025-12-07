import React, { useState, useEffect, useRef } from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import type { Job, User, Dispute } from '../types';

interface DisputeModalProps {
  user: User;
  job: Job;
  dispute: Dispute;
  otherParty?: User;
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  user,
  job,
  dispute,
  otherParty,
  onClose,
  onSendMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Guard para ambientes de teste (JSDOM) onde scrollIntoView pode não existir
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [dispute.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !otherParty) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div
      {...getModalOverlayProps(onClose)}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
    >
      <div
        {...getModalContentProps()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all h-[90vh] flex flex-col"
      >
        <header className="relative p-4 border-b border-red-200 bg-red-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
          <h2 className="text-lg font-bold text-red-800">Disputa em Aberto</h2>
          <p className="text-sm text-red-600 truncate">
            Job: {job.category} com {otherParty?.name || 'Usuário'}
          </p>
        </header>

        <div className="p-4 border-b border-gray-200 bg-slate-50 text-center">
          <p className="text-sm text-gray-700">
            O pagamento está <span className="font-bold">pausado</span> até que a disputa seja
            resolvida. Mantenha a comunicação registrada aqui.
          </p>
        </div>

        <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-100">
          {dispute.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user.email ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === user.email ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${msg.senderId === user.email ? 'text-blue-200' : 'text-gray-600'}`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 border-t border-gray-200 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem para a disputa..."
              className="flex-grow block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg
                className="w-6 h-6 transform rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default DisputeModal;
