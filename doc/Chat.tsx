import React, { useState } from 'react';
import { Message, User } from '../types';
import AISchedulingAssistant from './AISchedulingAssistant';
import PlatformSecurityNotice from './PlatformSecurityNotice';

interface ChatProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (text: string) => void;
  aiSuggestion?: { date: string; time: string } | null;
  onConfirmSchedule: () => void;
}

const Chat: React.FC<ChatProps> = ({ messages, currentUser, onSendMessage, aiSuggestion, onConfirmSchedule }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <PlatformSecurityNotice />
      {aiSuggestion && (
        <AISchedulingAssistant 
          suggestion={aiSuggestion}
          onConfirm={onConfirmSchedule}
          onDismiss={() => { /* Logic to dismiss suggestion can be added here */ }}
        />
      )}
      <div className="flex-grow space-y-4 overflow-y-auto pr-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.email ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === 'system' ? 'w-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-center text-sm' : msg.senderId === currentUser.email ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.senderId === currentUser.email ? 'text-blue-200' : 'text-gray-500'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-grow border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-l-md shadow-sm" placeholder="Digite sua mensagem..." />
        <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r-md hover:bg-blue-700">
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat;