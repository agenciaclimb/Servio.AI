import React, { useState } from 'react';
import { Contract, User } from '../../types';

interface ContractManagementDashboardProps {
  user: User;
  contracts: Contract[];
  onUpgradeClick: () => void;
  onCreateContract: (newContractData: any) => void; // Simplificado por enquanto
}

const statusStyles = {
  rascunho: 'bg-gray-100 text-gray-800',
  pendente_assinatura: 'bg-yellow-100 text-yellow-800',
  ativo: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const ContractManagementDashboard: React.FC<ContractManagementDashboardProps> = ({ user, contracts, onUpgradeClick, onCreateContract }) => {
  const [isCreating, setIsCreating] = useState(false);
  // Estados para o formulário de criação de contrato
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('');

  const isSubscribed = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

  const handleCreate = () => {
    if (!isSubscribed) {
      onUpgradeClick();
      return;
    }
    setIsCreating(true);
  };

  const handleSaveContract = () => {
    // Lógica para salvar o contrato, possivelmente chamando a IA para gerar o texto
    onCreateContract({ title, scope });
    setIsCreating(false);
    setTitle('');
    setScope('');
  };

  if (!isSubscribed) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Gestão de Contratos</h2>
        <p className="text-sm text-gray-500 mt-2">Crie, envie e gerencie contratos de serviço com assinatura digital e pagamentos por etapa.</p>
        <button onClick={onUpgradeClick} className="mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Desbloquear Gestão de Contratos 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Gestão de Contratos</h2>
        <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          + Novo Contrato
        </button>
      </div>

      {isCreating && (
        <div className="p-4 mb-6 bg-gray-50 border rounded-lg space-y-4">
          <h3 className="font-semibold">Criar Novo Contrato</h3>
          <input type="text" placeholder="Título do Contrato (ex: Manutenção Mensal de Ar Condicionado)" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md" />
          <textarea placeholder="Descreva o escopo do trabalho..." value={scope} onChange={e => setScope(e.target.value)} className="w-full rounded-md" rows={4}></textarea>
          {/* Adicionar campos para milestones de pagamento aqui */}
          <div className="text-right">
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-700">Cancelar</button>
            <button onClick={handleSaveContract} className="ml-2 px-4 py-2 text-sm text-white bg-green-600 rounded-md">Salvar Rascunho</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {contracts.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Nenhum contrato criado ainda.</p>}
        {contracts.map(contract => (
          <div key={contract.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">{contract.title}</p>
                <p className="text-xs text-gray-500">Prestador: {contract.providerId}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusStyles[contract.status]}`}>{contract.status.replace('_', ' ')}</span>
            </div>
            <div className="mt-3 text-right">
              <button className="text-sm font-medium text-blue-600 hover:underline">Ver Detalhes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractManagementDashboard;