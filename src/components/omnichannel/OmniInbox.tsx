/**
 * OmniInbox - Central de Conversas Omnichannel
 * 
 * Painel unificado para gerenciar conversas de WhatsApp, Instagram, Facebook e WebChat.
 * 
 * Features:
 * - Lista de conversas com filtros por canal e userType
 * - Visualização de mensagens em tempo real
 * - Envio manual de mensagens
 * - Métricas de tempo de resposta
 * - Status dos canais
 * - Logs da IA
 * 
 * Usuários: Admin + Prestadores
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import type { User } from '../../../types';

interface Conversation {
  id: string;
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'webchat';
  participants: string[];
  userType: 'cliente' | 'prestador' | 'prospector' | 'admin';
  lastMessage: string;
  lastMessageAt: Timestamp;
  lastMessageSender: string;
  status: 'active' | 'closed';
  updatedAt: Timestamp;
}

interface Message {
  id: string;
  conversationId: string;
  channel: string;
  sender: string;
  senderType: 'cliente' | 'prestador' | 'prospector' | 'admin' | 'bot';
  text: string;
  timestamp: Timestamp;
  isAutomation?: boolean;
}

interface OmniInboxProps {
  currentUser: User;
}

const CHANNEL_ICONS = {
  whatsapp: '📱',
  instagram: '📷',
  facebook: '👥',
  webchat: '💬'
};

const CHANNEL_COLORS = {
  whatsapp: 'bg-green-100 text-green-800',
  instagram: 'bg-pink-100 text-pink-800',
  facebook: 'bg-blue-100 text-blue-800',
  webchat: 'bg-gray-100 text-gray-800'
};

export default function OmniInbox({ currentUser }: OmniInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Buscar conversas com filtros
  useEffect(() => {
    let q = query(
      collection(db, 'conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    if (filterChannel !== 'all') {
      q = query(q, where('channel', '==', filterChannel));
    }

    if (filterUserType !== 'all') {
      q = query(q, where('userType', '==', filterUserType));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation));
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterChannel, filterUserType]);

  // Buscar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedConversation),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Enviar mensagem manual
  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const conv = conversations.find(c => c.id === selectedConversation);
      if (!conv) return;

      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation,
        channel: conv.channel,
        sender: currentUser.email,
        senderType: currentUser.type,
        text: newMessage,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      });

      // TODO: Chamar API para enviar ao canal externo (WhatsApp, IG, FB)
      // await fetch('/api/omni/send', { method: 'POST', body: JSON.stringify({ conversationId, message: newMessage }) });

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  }, [selectedConversation, newMessage, conversations, currentUser]);

  // Métricas de tempo de resposta
  const metrics = useMemo(() => {
    const activeConversations = conversations.filter(c => c.status === 'active');
    const avgResponseTime = 0; // TODO: Calcular baseado em timestamps

    return {
      total: conversations.length,
      active: activeConversations.length,
      avgResponseTime
    };
  }, [conversations]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">OmniInbox</h1>
        <p className="text-sm text-gray-500">Central de conversas multi-canal</p>
      </div>

      {/* Métricas */}
      <div className="bg-white border-b px-6 py-3 flex gap-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Total:</span>
          <span className="font-bold text-gray-900">{metrics.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Ativas:</span>
          <span className="font-bold text-green-600">{metrics.active}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Tempo Médio de Resposta:</span>
          <span className="font-bold text-blue-600">{metrics.avgResponseTime}min</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b px-6 py-3 flex gap-4">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">Todos os canais</option>
          <option value="whatsapp">📱 WhatsApp</option>
          <option value="instagram">📷 Instagram</option>
          <option value="facebook">👥 Facebook</option>
          <option value="webchat">💬 WebChat</option>
        </select>

        <select
          value={filterUserType}
          onChange={(e) => setFilterUserType(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">Todos os tipos</option>
          <option value="cliente">Cliente</option>
          <option value="prestador">Prestador</option>
          <option value="prospector">Prospector</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Layout Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Conversas */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Nenhuma conversa</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                  selectedConversation === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${CHANNEL_COLORS[conv.channel]}`}>
                      {CHANNEL_ICONS[conv.channel]} {conv.channel}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{conv.userType}</span>
                  </div>
                  {conv.status === 'active' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <div className="text-sm text-gray-700 font-medium mb-1">
                  {conv.participants[0]}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {conv.lastMessage}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {conv.lastMessageAt?.toDate().toLocaleString('pt-BR')}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Visualizador de Mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header da Conversa */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${CHANNEL_COLORS[selectedConv.channel]}`}>
                      {CHANNEL_ICONS[selectedConv.channel]} {selectedConv.channel}
                    </span>
                    <span className="text-sm text-gray-600 capitalize">{selectedConv.userType}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedConv.participants[0]}
                  </div>
                </div>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedConversation(null)}
                >
                  Fechar
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'bot' || msg.sender === currentUser.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.senderType === 'bot'
                          ? 'bg-purple-100 text-purple-900'
                          : msg.sender === currentUser.email
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                        <span className="font-medium capitalize">{msg.senderType}</span>
                        {msg.isAutomation && <span className="text-purple-600">🤖 Auto</span>}
                      </div>
                      <div className="text-sm">{msg.text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {msg.timestamp?.toDate().toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensagem */}
              <div className="bg-white border-t px-6 py-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecione uma conversa para visualizar mensagens
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
