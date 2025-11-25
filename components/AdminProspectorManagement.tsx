import React, { useState, useEffect, useCallback } from 'react';
import { Prospector, Commission } from '../types';
import * as API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { logError } from '../utils/logger';

const AdminProspectorManagement: React.FC = () => {
  const { addToast } = useToast();
  const [prospectors, setProspectors] = useState<Prospector[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProspector, setSelectedProspector] = useState<Prospector | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prospectorsData, commissionsData] = await Promise.all([
        API.fetchProspectors(),
        API.fetchCommissions()
      ]);
      setProspectors(prospectorsData);
      setCommissions(commissionsData);
    } catch (error) {
      logError('Error loading prospectors:', error);
      addToast('Erro ao carregar prospectores', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateInviteCode = (name: string): string => {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName}${random}`;
  };

  const handleCreateProspector = async () => {
    try {
      if (!formData.email || !formData.name) {
        addToast('Email e nome são obrigatórios', 'error');
        return;
      }

      const inviteCode = generateInviteCode(formData.name);
      
      const newProspector: Omit<Prospector, 'id'> = {
        name: formData.name,
        email: formData.email,
        inviteCode,
        totalRecruits: 0,
        activeRecruits: 0,
        totalCommissionsEarned: 0,
        commissionRate: 0.01, // 1% default
        providersSupported: [],
        createdAt: new Date().toISOString(),
      };

      await API.createProspector(newProspector);
      addToast(`Prospector criado! Código de convite: ${inviteCode}`, 'success');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      logError('Error creating prospector:', error);
      addToast('Erro ao criar prospector', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ email: '', name: '' });
  };

  const copyInviteLink = (inviteCode: string) => {
    const link = `https://servio-ai.com/register?type=provider&invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    addToast('Link de convite copiado!', 'success');
  };

  const getProspectorCommissions = (prospectorId: string) => {
    return commissions.filter(c => c.prospectorId === prospectorId);
  };

  const totalStats = {
    totalProspectors: prospectors.length,
    totalRecruits: prospectors.reduce((sum, p) => sum + p.totalRecruits, 0),
    totalCommissions: commissions.reduce((sum, c) => sum + c.amount, 0),
    pendingCommissions: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Carregando prospectores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Equipe de Prospecção</h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Adicionar Prospector
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total de Prospectores</div>
          <div className="text-2xl font-bold text-gray-800">{totalStats.totalProspectors}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Prestadores Recrutados</div>
          <div className="text-2xl font-bold text-green-600">{totalStats.totalRecruits}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Comissões Pagas</div>
          <div className="text-2xl font-bold text-blue-600">
            R$ {totalStats.totalCommissions.toFixed(2)}
          </div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Comissões Pendentes</div>
          <div className="text-2xl font-bold text-yellow-600">
            R$ {totalStats.pendingCommissions.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Commission Rates Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Sistema de Comissionamento</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>Prospecção Manual:</strong> 1% de comissão sobre toda produção do prestador</div>
          <div>• <strong>Prospecção por IA:</strong> 0,25% de comissão sobre toda produção do prestador</div>
          <div>• <strong>Suporte:</strong> Cada prospector é responsável por dar suporte aos seus prestadores</div>
        </div>
      </div>

      {/* Prospectors List */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Prospectores Ativos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Prospector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Código de Convite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Prestadores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Comissões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospectors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum prospector cadastrado ainda
                  </td>
                </tr>
              ) : (
                prospectors.map(prospector => {
                  const prospectorCommissions = getProspectorCommissions(prospector.id);
                  const totalEarned = prospectorCommissions.reduce((sum, c) => sum + c.amount, 0);
                  const pendingEarned = prospectorCommissions
                    .filter(c => c.status === 'pending')
                    .reduce((sum, c) => sum + c.amount, 0);

                  return (
                    <tr key={prospector.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{prospector.name}</div>
                        <div className="text-sm text-gray-600">{prospector.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md font-mono text-sm font-bold">
                            {prospector.inviteCode}
                          </span>
                          <button
                            onClick={() => copyInviteLink(prospector.inviteCode)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            📋 Copiar Link
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          servio-ai.com/register?invite={prospector.inviteCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prospector.activeRecruits} ativos
                        </div>
                        <div className="text-xs text-gray-500">
                          {prospector.totalRecruits} total
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          R$ {totalEarned.toFixed(2)}
                        </div>
                        {pendingEarned > 0 && (
                          <div className="text-xs text-yellow-600">
                            R$ {pendingEarned.toFixed(2)} pendente
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => setSelectedProspector(prospector)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Prospector Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Adicionar Novo Prospector
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="João Silva"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="joao@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-sm font-medium text-purple-900 mb-1">
                  Código de Convite Gerado
                </div>
                <div className="text-xs text-purple-700">
                  Um código único será gerado automaticamente baseado no nome
                </div>
                {formData.name && (
                  <div className="mt-2 text-sm font-mono font-bold text-purple-800">
                    Preview: {generateInviteCode(formData.name)}
                  </div>
                )}
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
                onClick={handleCreateProspector}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Criar Prospector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prospector Details Modal */}
      {selectedProspector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedProspector.name}</h3>
                <p className="text-sm text-gray-600">{selectedProspector.email}</p>
              </div>
              <button
                onClick={() => setSelectedProspector(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Prestadores Ativos</div>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedProspector.activeRecruits}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Recrutado</div>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedProspector.totalRecruits}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Comissões Totais</div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {selectedProspector.totalCommissionsEarned.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Histórico de Comissões
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Prestador</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Taxa</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Valor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getProspectorCommissions(selectedProspector.id).slice(0, 10).map(commission => (
                      <tr key={commission.id}>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(commission.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{commission.providerId}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {(commission.rate * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-green-600">
                          R$ {commission.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                            commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setSelectedProspector(null)}
              className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProspectorManagement;
