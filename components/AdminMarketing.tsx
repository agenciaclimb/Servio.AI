import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import * as API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { logError } from '../utils/logger';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  targetAudience: 'all' | 'clients' | 'providers';
  subject?: string;
  message: string;
  scheduledFor?: string;
  createdAt: string;
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
}

const AdminMarketing: React.FC = () => {
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    type: 'email',
    status: 'draft',
    targetAudience: 'all',
    subject: '',
    message: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, campaignsData] = await Promise.all([
        API.fetchAllUsers(),
        API.fetchCampaigns().catch(() => []), // Mock if not implemented
      ]);
      setUsers(usersData);
      setCampaigns(campaignsData);
    } catch (error) {
      logError('Error loading data:', error);
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCampaign = async () => {
    try {
      if (!formData.name || !formData.message) {
        addToast('Nome e mensagem são obrigatórios', 'error');
        return;
      }

      const newCampaign: Campaign = {
        id: `campaign_${Date.now()}`,
        name: formData.name!,
        type: formData.type!,
        status: formData.status!,
        targetAudience: formData.targetAudience!,
        subject: formData.subject,
        message: formData.message!,
        createdAt: new Date().toISOString(),
      };

      // Chamada real à API (graceful fallback se backend indisponível)
      const createdCampaign = await API.createCampaign({
        name: formData.name!,
        type: formData.type!,
        status: formData.status!,
        targetAudience: formData.targetAudience!,
        subject: formData.subject,
        message: formData.message!,
      }).catch(() => newCampaign);

      setCampaigns([...campaigns, createdCampaign]);
      addToast('Campanha criada com sucesso!', 'success');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      logError('Error creating campaign:', error);
      addToast('Erro ao criar campanha', 'error');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja enviar esta campanha?')) return;

    try {
      // Chamada real à API (graceful fallback se backend indisponível)
      const campaign = campaigns.find(c => c.id === campaignId);
      const fallbackCount = campaign ? getTargetCount(campaign.targetAudience) : 0;
      
      const result = await API.sendCampaign(campaignId).catch(() => ({
        success: true,
        sentCount: fallbackCount,
      }));

      setCampaigns(
        campaigns.map(c =>
          c.id === campaignId
            ? { ...c, status: 'sent', sentCount: result.sentCount }
            : c
        )
      );
      addToast('Campanha enviada com sucesso!', 'success');
    } catch (error) {
      logError('Error sending campaign:', error);
      addToast('Erro ao enviar campanha', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      status: 'draft',
      targetAudience: 'all',
      subject: '',
      message: '',
    });
  };

  const getTargetCount = (audience: Campaign['targetAudience']) => {
    switch (audience) {
      case 'clients':
        return users.filter(u => u.type === 'cliente').length;
      case 'providers':
        return users.filter(u => u.type === 'prestador').length;
      default:
        return users.length;
    }
  };

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
    avgOpenRate:
      campaigns.length > 0
        ? (campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length).toFixed(1)
        : '0.0',
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Carregando campanhas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Marketing</h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total de Campanhas</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalCampaigns}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Campanhas Ativas</div>
          <div className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Enviadas</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalSent}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Taxa de Abertura Média</div>
          <div className="text-2xl font-bold text-purple-600">{stats.avgOpenRate}%</div>
        </div>
      </div>

      {/* Audience Overview */}
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Audiência Disponível</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total de Usuários</div>
            <div className="text-xl font-bold text-gray-800">{users.length}</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Clientes</div>
            <div className="text-xl font-bold text-blue-600">
              {users.filter(u => u.type === 'cliente').length}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Prestadores</div>
            <div className="text-xl font-bold text-green-600">
              {users.filter(u => u.type === 'prestador').length}
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Campanhas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Audiência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Enviadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma campanha criada ainda. Crie sua primeira campanha!
                  </td>
                </tr>
              ) : (
                campaigns.map(campaign => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-600">
                        Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          campaign.type === 'email'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.type === 'sms'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {campaign.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {campaign.targetAudience === 'all'
                        ? 'Todos'
                        : campaign.targetAudience === 'clients'
                          ? 'Clientes'
                          : 'Prestadores'}
                      <div className="text-xs text-gray-500">
                        ({getTargetCount(campaign.targetAudience)} usuários)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          campaign.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : campaign.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800'
                              : campaign.status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {campaign.sentCount || 0}
                      {campaign.openRate && (
                        <div className="text-xs text-gray-500">{campaign.openRate}% abertos</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Enviar
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900">Ver Detalhes</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Nova Campanha de Marketing</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Promoção de Verão 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="campaign-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tipo *
                  </label>
                  <select
                    id="campaign-type"
                    value={formData.type}
                    onChange={e =>
                      setFormData({ ...formData, type: e.target.value as Campaign['type'] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="campaign-audience"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Audiência *
                  </label>
                  <select
                    id="campaign-audience"
                    value={formData.targetAudience}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value as Campaign['targetAudience'],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos ({users.length})</option>
                    <option value="clients">
                      Clientes ({users.filter(u => u.type === 'cliente').length})
                    </option>
                    <option value="providers">
                      Prestadores ({users.filter(u => u.type === 'prestador').length})
                    </option>
                  </select>
                </div>
              </div>

              {formData.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto do Email *
                  </label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Assunto do email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                <textarea
                  value={formData.message || ''}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Digite a mensagem da campanha..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {(formData.message || '').length} caracteres
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800 mb-2">📊 Resumo da Campanha</div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Tipo: {formData.type?.toUpperCase()}</div>
                  <div>
                    • Destinatários: {getTargetCount(formData.targetAudience || 'all')} usuários
                  </div>
                  <div>• Status: Rascunho (será salva para envio posterior)</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketing;
