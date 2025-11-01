import React, { useState, useEffect } from 'react';
import { Message, User } from '../types';
import AISchedulingAssistant from './AISchedulingAssistant';
import PlatformSecurityNotice from './PlatformSecurityNotice';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface ChatProps {
  messages: Message[];
  currentUser: User;
  authToken: string | null;
  onSendMessage: (text: string) => void;
  aiSuggestion?: { date: string; time: string } | null;
  onConfirmSchedule: () => void;
}

const Chat: React.FC<ChatProps> = ({ messages, currentUser, authToken, onSendMessage, aiSuggestion, onConfirmSchedule }) => {
  const [newMessage, setNewMessage] = useState('');
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
    setReplySuggestions([]);
  };

  const fetchReplySuggestions = async () => {
    if (!authToken || messages.length === 0) return;
    setIsFetchingSuggestions(true);
    setReplySuggestions([]);
    try {
      const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/suggest-chat-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ messages, currentUserType: currentUser.type }),
      });
      const suggestions = await response.json();
      setReplySuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching reply suggestions:", error);
    } finally {
      setIsFetchingSuggestions(false);
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
      {replySuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {replySuggestions.map((suggestion, index) => (
            <button key={index} onClick={() => handleSuggestionClick(suggestion)} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900">
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-grow border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Digite sua mensagem..." />
        <button 
          onClick={fetchReplySuggestions} 
          disabled={isFetchingSuggestions}
          className="p-2 border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="Sugerir resposta com IA"
        >
          <SparklesIcon className={`h-5 w-5 ${isFetchingSuggestions ? 'animate-pulse text-blue-500' : 'text-yellow-500'}`} />
        </button>
        <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.853-1.414a.75.75 0 000-1.328L3.23 4.814a.75.75 0 00-.95-.54l-4.95 1.414a.75.75 0 00-.95.826L2.289 16.895a.75.75 0 00.95.826l4.949-1.414a.75.75 0 00.54-.95l-1.414-3.853a.75.75 0 00-1.328 0l-1.414 3.853a.75.75 0 00.54.95l4.95-1.414a.75.75 0 00.826-.95L17.71 3.105a.75.75 0 00-.826-.95l-4.949 1.414a.75.75 0 00-.54.95l1.414 3.853a.75.75 0 001.328 0l1.414-3.853a.75.75 0 00-.54-.95l-4.95 1.414a.75.75 0 00-.826.95L16.895 17.71a.75.75 0 00.95-.826l-1.414-4.949a.75.75 0 00-.95-.54l-3.853 1.414a.75.75 0 000 1.328l3.853 1.414a.75.75 0 00.95.54l4.949-1.414a.75.75 0 00.826-.95L3.105 2.289z" /></svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;