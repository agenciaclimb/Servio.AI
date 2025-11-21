import React, { useState, useEffect } from 'react';
import { Prospect } from '../types';
import * as API from '../services/api';
import { useToast } from '../contexts/ToastContext';

const AdminProspecting: React.FC = () => {
  const { addToast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'contactado' | 'convertido' | 'perdido'>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    setIsLoading(true);
    try {
      const data = await API.fetchProspects();
      setProspects(data);
    } catch (error) {
      console.error('Error loading prospects:', error);
      addToast('Erro ao carregar prospectos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProspectStatus = async (prospectId: string, status: Prospect['status']) => {
    try {
      await API.updateProspect(prospectId, { status });
      addToast('Status atualizado com sucesso!', 'success');
      await loadProspects();
    } catch (error) {
      console.error('Error updating prospect:', error);
      addToast('Erro ao atualizar status', 'error');
    }
  };

  const handleAddNote = async (prospectId: string) => {
    const note = prompt('Adicionar nota ao prospecto:');
    if (!note) return;

    try {
      const prospect = prospects.find(p => p.id === prospectId);
      if (!prospect) return;

      const updatedNotes = [...(prospect.notes || []), {
        text: note,
        createdAt: new Date().toISOString(),
        createdBy: 'admin' // In real app, use actual admin user
      }];

      await API.updateProspect(prospectId, { notes: updatedNotes });
      addToast('Nota adicionada com sucesso!', 'success');
      await loadProspects();
    } catch (error) {
      console.error('Error adding note:', error);
      addToast('Erro ao adicionar nota', 'error');
    }
  };

  const filteredProspects = prospects.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredProspects.length / ITEMS_PER_PAGE);
  const paginatedProspects = filteredProspects.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: prospects.length,
    pendente: prospects.filter(p => p.status === 'pendente').length,
    contactado: prospects.filter(p => p.status === 'contactado').length,
    convertido: prospects.filter(p => p.status === 'convertido').length,
    perdido: prospects.filter(p => p.status === 'perdido').length,
  };

  const conversionRate = stats.total > 0 ? ((stats.convertido / stats.total) * 100).toFixed(1) : '0.0';

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Carregando prospectos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Prospecção</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total de Prospectos</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Contactados</div>
          <div className="text-2xl font-bold text-blue-600">{stats.contactado}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Convertidos</div>
          <div className="text-2xl font-bold text-green-600">{stats.convertido}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Taxa de Conversão</div>
          <div className="text-2xl font-bold text-purple-600">{conversionRate}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white shadow-sm border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por Status
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="contactado">Contactado</option>
          <option value="convertido">Convertido</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>

      {/* Prospects Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Prospecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Criado Em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProspects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum prospecto encontrado
                  </td>
                </tr>
              ) : (
                paginatedProspects.map(prospect => (
                  <tr key={prospect.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                      <div className="text-sm text-gray-600">{prospect.email}</div>
                      {prospect.phone && (
                        <div className="text-sm text-gray-600">{prospect.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {prospect.source || 'Website'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={prospect.status}
                        onChange={(e) => handleUpdateProspectStatus(prospect.id, e.target.value as Prospect['status'])}
                        className={`px-2 text-xs leading-5 font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                          prospect.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          prospect.status === 'contactado' ? 'bg-blue-100 text-blue-800' :
                          prospect.status === 'convertido' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="contactado">Contactado</option>
                        <option value="convertido">Convertido</option>
                        <option value="perdido">Perdido</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(prospect.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleAddNote(prospect.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Adicionar Nota
                      </button>
                      {prospect.email && (
                        <a
                          href={`mailto:${prospect.email}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Email
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(page * ITEMS_PER_PAGE, filteredProspects.length)} de {filteredProspects.length} prospectos
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProspecting;
