import React, { useState, useEffect, useRef } from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { Job, Message, User, ScheduledDateTime, ChatSuggestion } from '../types';
import { proposeScheduleFromChat, getChatAssistance } from '../services/geminiService';
import AISchedulingAssistant from './AISchedulingAssistant';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface ChatModalProps {
  job: Job;
  currentUser: User;
  otherParty?: User;
  messages: Message[];
  onClose: () => void;
  onSendMessage: (messageData: Partial<Message> & { chatId: string; text: string }) => void;
  onConfirmSchedule: (jobId: string, schedule: ScheduledDateTime, messageId?: string) => void;
  setAllMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatModal: React.FC<ChatModalProps> = ({ job, currentUser, otherParty, messages, onClose, onSendMessage, onConfirmSchedule, setAllMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [suggestedSchedule, setSuggestedSchedule] = useState<ScheduledDateTime | null>(null);
  const [isCheckingForSchedule, setIsCheckingForSchedule] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [assistantSuggestion, setAssistantSuggestion] = useState<ChatSuggestion | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time updates via Firestore onSnapshot
  useEffect(() => {
    if (!setAllMessages) return; // Only enable real-time if parent provides setter

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', job.id)
      // Note: orderBy removed to avoid composite index requirement
      // Sorting done in client after retrieval
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        updatedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });

      // Sort messages by createdAt (client-side since no composite index)
      updatedMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Update parent state with real-time messages
      setAllMessages((prev) => {
        // Merge with existing messages from other chats
        const otherChats = prev.filter(m => m.chatId !== job.id);
        return [...otherChats, ...updatedMessages];
      });

      console.log(`📩 Real-time: ${updatedMessages.length} mensagens carregadas para chat ${job.id}`);
    }, (error) => {
      console.error('❌ Erro no onSnapshot:', error);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [job.id, setAllMessages]);

  const checkForScheduleSuggestion = async () => {
      if (job.status !== 'proposta_aceita' && job.status !== 'agendado') return;
      if (messages.length < 2 || isCheckingForSchedule) return;

      setIsCheckingForSchedule(true);
      try {
          const suggestion = await proposeScheduleFromChat(messages);
          if (suggestion) {
              setSuggestedSchedule(suggestion);
          }
      } catch (error) {
          console.error("Failed to check for schedule suggestion:", error);
      } finally {
          setIsCheckingForSchedule(false);
      }
  };
  
  const handleGetAssistance = async () => {
      setIsAssistantLoading(true);
      setAssistantSuggestion(null);
      try {
          const suggestion = await getChatAssistance(messages, currentUser.type);
          if (suggestion) {
            setAssistantSuggestion(suggestion);
          }
      } catch (error) {
          console.error("Failed to get assistance:", error);
      } finally {
        setIsAssistantLoading(false);
      }
  };

  const handleSuggestionClick = (suggestion: ChatSuggestion) => {
    switch (suggestion.name) {
      case 'clarify_scope':
      case 'suggest_next_step':
        setNewMessage(suggestion.args.suggestionText || suggestion.args.question);
        break;
      case 'summarize_agreement':
        onSendMessage({ chatId: job.id, text: suggestion.args.summaryText, type: 'system_notification' });
        break;
    }
    setAssistantSuggestion(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !otherParty) return;
    
    setSuggestedSchedule(null);
    setAssistantSuggestion(null);
    
    onSendMessage({
      chatId: job.id,
      text: newMessage,
      type: 'text',
    });
    
    setNewMessage('');
    
    setTimeout(checkForScheduleSuggestion, 1000);
  };
  
  useEffect(() => {
      checkForScheduleSuggestion();
  }, [job, messages.length]);
  
  const handleConfirmAISchedule = () => {
      if (suggestedSchedule) {
          onConfirmSchedule(job.id, suggestedSchedule);
          setSuggestedSchedule(null);
      }
  };

  const handleSuggestSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) return;

    const schedule: ScheduledDateTime = { date: scheduleDate, time: scheduleTime };
    const formattedDate = new Date(`${scheduleDate}T00:00:00`).toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'});

    onSendMessage({
      chatId: job.id,
      text: `Sugestão de agendamento: ${formattedDate} às ${scheduleTime}`,
      type: 'schedule_proposal',
      schedule: schedule
    });

    setIsScheduling(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  return (
    <div {...getModalOverlayProps(onClose)} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div {...getModalContentProps()} className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all h-[90vh] flex flex-col">
        <header className="relative p-4 border-b border-gray-200 flex-shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">Chat com {otherParty?.name || 'Usuário'}</h2>
            <p className="text-sm text-gray-600 truncate">Sobre o job: {job.category}</p>
        </header>

        <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-100">
            {messages.map(msg => {
                const isCurrentUser = msg.senderId === currentUser.email;

                if (msg.type === 'schedule_proposal' && msg.schedule) {
                    const isRecipient = !isCurrentUser;
                    const isConfirmed = msg.isScheduleConfirmed;
                    const formattedDate = new Date(`${msg.schedule.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
                    return (
                        <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white border border-indigo-200 shadow-sm">
                                <p className="text-sm font-semibold text-indigo-800">🗓️ Proposta de Agendamento</p>
                                <p className="text-sm text-gray-700 mt-2">Para: <strong>{formattedDate}</strong></p>
                                <p className="text-sm text-gray-700">Às: <strong>{msg.schedule.time}</strong></p>
                                {isRecipient && !isConfirmed && job.status !== 'agendado' && (
                                    <div className="mt-3 pt-2 border-t border-indigo-100 flex space-x-2">
                                        <button onClick={() => onConfirmSchedule(job.id, msg.schedule!, msg.id)} className="flex-1 px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Confirmar</button>
                                    </div>
                                )}
                                {isConfirmed && <p className="text-xs text-green-700 font-semibold mt-2">Agendamento confirmado!</p>}
                            </div>
                        </div>
                    );
                }
                
                if (msg.senderId === 'system' || msg.type === 'system_notification') {
                     return (
                        <div key={msg.id} className="flex justify-center my-2">
                            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-green-100 text-green-800 text-sm text-center border border-green-200">
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-600'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 border-t border-gray-200 flex-shrink-0 space-y-3">
            {suggestedSchedule && job.status !== 'agendado' && (
                <AISchedulingAssistant
                    schedule={suggestedSchedule}
                    onConfirm={handleConfirmAISchedule}
                    onClose={() => setSuggestedSchedule(null)}
                />
            )}
            {assistantSuggestion && (
                 <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-indigo-700">Sugestão da IA:</p>
                    <button onClick={() => handleSuggestionClick(assistantSuggestion)} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        {assistantSuggestion.displayText}
                    </button>
                 </div>
            )}
            {isScheduling && (
                <form onSubmit={handleSuggestSchedule} className="p-3 bg-slate-50 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} required className="flex-1 block w-full text-sm p-2 border border-gray-300 rounded-md" />
                        <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required className="flex-1 block w-full text-sm p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                         <button type="button" onClick={() => setIsScheduling(false)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                         <button type="submit" className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Enviar Sugestão</button>
                    </div>
                </form>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (assistantSuggestion) setAssistantSuggestion(null); // Hide suggestion on type
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-grow block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                 <button type="button" onClick={() => setIsScheduling(true)} title="Sugerir Horário" className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.75 3a.75.75 0 01.75.75v.5h7V3.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5v-.25A.75.75 0 015.75 3zM4.5 8.25v7a1.25 1.25 0 001.25 1.25h9.5A1.25 1.25 0 0016.5 15.25v-7h-12z" clipRule="evenodd" /></svg>
                </button>
                 <button type="button" onClick={handleGetAssistance} disabled={isAssistantLoading} title="Assistente IA" className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50">
                    {isAssistantLoading ? 
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        : '✨'
                    }
                </button>
                <button type="submit" className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatModal;