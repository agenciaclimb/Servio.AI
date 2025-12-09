import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'chat';
  sender: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAutomated?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'chat';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  status: 'active' | 'archived' | 'closed';
  messages: Message[];
}

interface ChannelMetrics {
  channel: 'sms' | 'whatsapp' | 'email' | 'chat';
  totalMessages: number;
  activeConversations: number;
  automatedPercentage: number;
  responseTime: number;
}

interface OmniInboxProps {
  userId?: string;
}

const OmniInbox: React.FC<OmniInboxProps> = ({ userId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterChannel, setFilterChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email' | 'chat'>('all');
  const [filterUserType, setFilterUserType] = useState<'all' | 'client' | 'provider' | 'admin'>('all');

  // Mock data para desenvolvimento
  useEffect(() => {
    setLoading(true);
    // Simula carregamento de conversas
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          participantId: 'user-1',
          participantName: 'João Silva',
          channel: 'whatsapp',
          lastMessage: 'Ótimo! Vou enviar a proposta em breve',
          lastMessageTime: new Date(Date.now() - 3600000),
          unreadCount: 0,
          status: 'active',
          messages: [
            {
              id: 'msg-1',
              channel: 'whatsapp',
              sender: 'user-1',
              senderName: 'João Silva',
              content: 'Você pode fazer esse serviço?',
              timestamp: new Date(Date.now() - 7200000),
              status: 'read',
            },
            {
              id: 'msg-2',
              channel: 'whatsapp',
              sender: 'admin',
              senderName: 'Sistema',
              content: 'Sim, consigo fazer sem problemas!',
              timestamp: new Date(Date.now() - 3600000),
              isAutomated: true,
              status: 'delivered',
            },
          ],
        },
        {
          id: 'conv-2',
          participantId: 'user-2',
          participantName: 'Maria Santos',
          channel: 'sms',
          lastMessage: 'Obrigada pela resposta',
          lastMessageTime: new Date(Date.now() - 1800000),
          unreadCount: 2,
          status: 'active',
          messages: [
            {
              id: 'msg-3',
              channel: 'sms',
              sender: 'admin',
              senderName: 'Sistema',
              content: 'Oi! Confirmando agendamento...',
              timestamp: new Date(Date.now() - 1800000),
              status: 'delivered',
            },
          ],
        },
        {
          id: 'conv-3',
          participantId: 'user-3',
          participantName: 'Pedro Costa',
          channel: 'email',
          lastMessage: 'Aguardando orçamento',
          lastMessageTime: new Date(Date.now() - 5400000),
          unreadCount: 1,
          status: 'active',
          messages: [
            {
              id: 'msg-5',
              channel: 'email',
              sender: 'admin',
              senderName: 'Sistema',
              content: 'Seu orçamento será enviado em breve',
              timestamp: new Date(Date.now() - 5400000),
              isAutomated: true,
              status: 'delivered',
            },
          ],
        },
      ];
      setConversations(mockConversations);
      setLoading(false);
    }, 500);
  }, [userId]);

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    if (filterChannel !== 'all' && conv.channel !== filterChannel) return false;
    // Filtro de tipo de usuário seria baseado em dados adicionais
    return true;
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channel: selectedConversation.channel,
      sender: 'admin',
      senderName: 'Sistema',
      content: messageText,
      timestamp: new Date(),
      status: 'sent',
    };

    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageText,
        lastMessageTime: new Date(),
      };
    });

    setMessageText('');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return '💬';
      case 'sms':
        return '📱';
      case 'email':
        return '📧';
      case 'chat':
        return '💭';
      default:
        return '📨';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return '#25D366';
      case 'sms':
        return '#3498DB';
      case 'email':
        return '#E74C3C';
      case 'chat':
        return '#9B59B6';
      default:
        return '#95A5A6';
    }
  };

  // Métricas agregadas
  const metrics: ChannelMetrics[] = [
    {
      channel: 'whatsapp',
      totalMessages: 245,
      activeConversations: 12,
      automatedPercentage: 35,
      responseTime: 4.2,
    },
    {
      channel: 'sms',
      totalMessages: 128,
      activeConversations: 8,
      automatedPercentage: 28,
      responseTime: 5.8,
    },
    {
      channel: 'email',
      totalMessages: 89,
      activeConversations: 5,
      automatedPercentage: 45,
      responseTime: 12.5,
    },
    {
      channel: 'chat',
      totalMessages: 56,
      activeConversations: 3,
      automatedPercentage: 20,
      responseTime: 2.1,
    },
  ];

  return (
    <div style={{ display: 'flex', height: '600px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar com conversas */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        backgroundColor: '#fff'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>💬 OmniInbox</h3>
          
          {/* Filtros */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Canal:
            </label>
            <select 
              value={filterChannel} 
              onChange={(e) => setFilterChannel(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px'
              }}
            >
              <option value="all">Todos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Tipo:
            </label>
            <select 
              value={filterUserType} 
              onChange={(e) => setFilterUserType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px'
              }}
            >
              <option value="all">Todos</option>
              <option value="client">Clientes</option>
              <option value="provider">Prestadores</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Lista de conversas */}
        <div>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conv.id ? '#f0f0f0' : '#fff',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: '#fafafa' }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>
                    {getChannelIcon(conv.channel)}
                  </span>
                  <strong style={{ fontSize: '13px', flex: 1 }}>
                    {conv.participantName}
                  </strong>
                  {conv.unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#FF6B6B',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p style={{ 
                  margin: '0', 
                  fontSize: '12px', 
                  color: '#666', 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conv.lastMessage}
                </p>
                <small style={{ color: '#999', fontSize: '11px' }}>
                  {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Header da conversa */}
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #ddd',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '20px', 
                marginRight: '8px',
                color: getChannelColor(selectedConversation.channel)
              }}>
                {getChannelIcon(selectedConversation.channel)}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0', fontSize: '16px' }}>
                  {selectedConversation.participantName}
                </h3>
                <small style={{ color: '#999' }}>
                  Via {selectedConversation.channel.toUpperCase()}
                </small>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕ Fechar
              </button>
            </div>

            {/* Mensagens */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              {selectedConversation.messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                  Nenhuma mensagem nesta conversa
                </div>
              ) : (
                selectedConversation.messages.map(msg => (
                  <div key={msg.id} style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      backgroundColor: msg.sender === 'admin' ? '#007AFF' : '#E8E8E8',
                      color: msg.sender === 'admin' ? '#fff' : '#000',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                      {msg.isAutomated && (
                        <div style={{
                          fontSize: '10px',
                          marginTop: '4px',
                          opacity: 0.7,
                          fontStyle: 'italic'
                        }}>
                          (Automática)
                        </div>
                      )}
                      <small style={{
                        display: 'block',
                        marginTop: '4px',
                        opacity: 0.7,
                        fontSize: '10px'
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {msg.status === 'sent' && ' ✓'}
                        {msg.status === 'delivered' && ' ✓✓'}
                        {msg.status === 'read' && ' ✓✓'}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input de mensagem */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid #ddd',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: messageText.trim() ? '#007AFF' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            {filteredConversations.length === 0 ? 'Nenhuma conversa encontrada' : 'Selecione uma conversa para começar'}
          </div>
        )}
      </div>

      {/* Painel de métricas (lado direito) */}
      <div style={{
        width: '280px',
        borderLeft: '1px solid #ddd',
        overflowY: 'auto',
        backgroundColor: '#fff',
        padding: '16px'
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
          📊 Status dos Canais
        </h4>
        
        {metrics.map(metric => (
          <div key={metric.channel} style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            borderLeft: `4px solid ${getChannelColor(metric.channel)}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>
                {getChannelIcon(metric.channel)}
              </span>
              <strong style={{ fontSize: '13px', textTransform: 'uppercase' }}>
                {metric.channel}
              </strong>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
              <div>📨 Mensagens: <strong>{metric.totalMessages}</strong></div>
              <div>💬 Conversas: <strong>{metric.activeConversations}</strong></div>
              <div>🤖 Automação: <strong>{metric.automatedPercentage}%</strong></div>
              <div>⏱️ Resposta: <strong>{metric.responseTime}h</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OmniInbox;
