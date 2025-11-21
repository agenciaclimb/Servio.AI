import React, { useState, useEffect } from 'react';
import { User, UserType, UserStatus } from '../types';
import * as API from '../services/api';
import { useToast } from '../contexts/ToastContext';

const AdminUserManagement: React.FC = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<UserType | 'all'>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    type: 'cliente' as UserType,
    status: 'ativo' as UserStatus,
    phone: '',
    cpf: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await API.fetchAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      addToast('Erro ao carregar usuários', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.name) {
        addToast('Email e nome são obrigatórios', 'error');
        return;
      }

      const newUser = {
        email: formData.email,
        name: formData.name,
        type: formData.type,
        status: formData.status,
        phone: formData.phone || undefined,
        cpf: formData.cpf || undefined,
        bio: '',
        location: '',
      };

      // Call API to create user
      await API.createUser(newUser as Omit<User, 'memberSince'>);
      
      addToast('Usuário criado com sucesso!', 'success');
      setShowCreateModal(false);
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      addToast('Erro ao criar usuário', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await API.updateUser(editingUser.email, formData);
      addToast('Usuário atualizado com sucesso!', 'success');
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      addToast('Erro ao atualizar usuário', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await API.deleteUser(userId);
      addToast('Usuário excluído com sucesso!', 'success');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast('Erro ao excluir usuário', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      type: 'cliente',
      status: 'ativo',
      phone: '',
      cpf: '',
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      type: user.type,
      status: user.status,
      phone: user.phone || '',
      cpf: user.cpf || '',
    });
    setShowCreateModal(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || u.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Criar Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome ou email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuário
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as UserType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="cliente">Cliente</option>
              <option value="prestador">Prestador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total de Usuários</div>
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Clientes</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.type === 'cliente').length}
          </div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Prestadores</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.type === 'prestador').length}
          </div>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-4">
          <div className="text-sm text-gray-600">Admins</div>
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.type === 'admin').length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map(user => (
                <tr key={user.email}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.type === 'prestador' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      user.status === 'suspenso' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuários
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as UserType})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cliente">Cliente</option>
                  <option value="prestador">Prestador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as UserStatus})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingUser ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
