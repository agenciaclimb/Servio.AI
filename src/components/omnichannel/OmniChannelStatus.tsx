/**
 * OmniChannelStatus - Painel de Status dos Canais
 *
 * Monitora a saúde e status de cada canal de comunicação:
 * - WhatsApp Cloud API
 * - Instagram (Graph API)
 * - Facebook Messenger (Graph API)
 * - WebChat
 *
 * Features:
 * - Status de conexão (online/offline)
 * - Última mensagem recebida
 * - Taxa de erro
 * - Webhook health check
 */

import { useState, useEffect } from 'react';

interface ChannelStatus {
  name: string;
  icon: string;
  status: 'online' | 'offline' | 'warning';
  lastMessage: Date | null;
  errorRate: number;
  webhookStatus: 'healthy' | 'unhealthy';
}

export default function OmniChannelStatus() {
  const [channels] = useState<ChannelStatus[]>([
    {
      name: 'WhatsApp',
      icon: '📱',
      status: 'online',
      lastMessage: new Date(),
      errorRate: 0.5,
      webhookStatus: 'healthy',
    },
    {
      name: 'Instagram',
      icon: '📷',
      status: 'online',
      lastMessage: new Date(Date.now() - 3600000),
      errorRate: 1.2,
      webhookStatus: 'healthy',
    },
    {
      name: 'Facebook',
      icon: '👥',
      status: 'warning',
      lastMessage: new Date(Date.now() - 7200000),
      errorRate: 5.8,
      webhookStatus: 'unhealthy',
    },
    {
      name: 'WebChat',
      icon: '💬',
      status: 'online',
      lastMessage: new Date(),
      errorRate: 0.1,
      webhookStatus: 'healthy',
    },
  ]);

  // TODO: Conectar a API real para buscar status
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular atualização de status
      // fetch('/api/omni/status').then(res => res.json()).then(setChannels);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ChannelStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status: ChannelStatus['status']) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'offline':
        return '❌';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Status dos Canais</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map(channel => (
          <div
            key={channel.name}
            className={`border-2 rounded-lg p-4 transition ${getStatusColor(channel.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{channel.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{channel.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{getStatusIcon(channel.status)}</span>
                    <span className="capitalize">{channel.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Última mensagem:</span>
                <span className="font-medium">
                  {channel.lastMessage
                    ? new Date(channel.lastMessage).toLocaleTimeString('pt-BR')
                    : 'Nunca'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Taxa de erro:</span>
                <span
                  className={`font-medium ${channel.errorRate > 3 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {channel.errorRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Webhook:</span>
                <span
                  className={`font-medium ${channel.webhookStatus === 'healthy' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {channel.webhookStatus === 'healthy' ? '✓ Saudável' : '✗ Com problemas'}
                </span>
              </div>
            </div>

            {channel.status !== 'online' && (
              <div className="mt-4 pt-4 border-t border-current/20">
                <button className="text-sm font-medium underline hover:no-underline">
                  Diagnosticar problema
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Atualizar status
          </button>
        </div>
      </div>
    </div>
  );
}
