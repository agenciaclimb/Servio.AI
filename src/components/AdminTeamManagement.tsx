import React, { useState } from 'react';
import { User, StaffRole } from '../../types';
import { useAppContext } from '../contexts/AppContext';

interface AdminTeamManagementProps {
  staff: User[];
  onAddStaff: (newStaffData: any) => Promise<void>;
}

const roleNames: Record<StaffRole, string> = {
  super_admin: 'Admin Principal',
  financeiro: 'Financeiro',
  suporte: 'Suporte ao Cliente',
  prospectador: 'Aquisição de Talentos',
  marketing: 'Marketing',
};

const AdminTeamManagement: React.FC<AdminTeamManagementProps> = ({ staff, onAddStaff }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('suporte');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAddStaff({
        name: newStaffName,
        email: newStaffEmail,
        role: newStaffRole,
      });
      // Reset form and close
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffRole('suporte');
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add staff member:", error);
      alert('Falha ao adicionar membro da equipe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Equipe Interna</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {isAdding ? 'Cancelar' : '+ Adicionar Membro'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 mb-6 bg-gray-50 border rounded-lg space-y-4">
          <h4 className="font-semibold">Novo Membro da Equipe</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome Completo"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              type="email"
              placeholder="E-mail de Acesso"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <select
            value={newStaffRole}
            onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
            className="block w-full rounded-md border-gray-300 shadow-sm"
          >
            {Object.entries(roleNames).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <button type="submit" disabled={isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
            {isLoading ? 'Adicionando...' : 'Salvar Novo Membro'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr key={member.email}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{roleNames[member.role!]}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTeamManagement;