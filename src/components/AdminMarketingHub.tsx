import React, { useState, useEffect } from 'react';

// Supondo que este tipo será adicionado a types.ts
interface MarketingProposal {
  id: string;
  type: 'blog_post' | 'social_media_post' | 'seo_page';
  title: string;
  details: {
    topic?: string;
    summary?: string;
    platform?: string;
    text?: string;
    category?: string;
    location?: string;
  };
  justification: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: string;
}

const typeLabels = {
  blog_post: 'Post de Blog',
  social_media_post: 'Post para Rede Social',
  seo_page: 'Página de SEO',
};

const AdminMarketingHub: React.FC = () => {
  const [proposals, setProposals] = useState<MarketingProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pendente' | 'aprovado' | 'rejeitado'>('pendente');

  useEffect(() => {
    // Placeholder local enquanto o endpoint não existe
    setLoading(true);
    const mock: MarketingProposal[] = [
      {
        id: 'm1',
        type: 'blog_post',
        title: 'Como escolher um eletricista de confiança',
        details: { summary: 'Guia prático para clientes' },
        justification: 'Aumentar tráfego orgânico para a categoria de reparos',
        status: 'pendente',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'm2',
        type: 'seo_page',
        title: 'Serviços de Pintura em São Paulo',
        details: { category: 'pintura', location: 'São Paulo' },
        justification: 'Melhorar ranqueamento local',
        status: 'pendente',
        createdAt: new Date().toISOString(),
      },
    ];
    setTimeout(() => {
      setProposals(mock.filter(p => p.status === filterStatus));
      setLoading(false);
    }, 300);
  }, [filterStatus]);

  const handleUpdateStatus = async (proposalId: string, newStatus: 'aprovado' | 'rejeitado') => {
    // Atualiza localmente por enquanto
    setProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">💡 Hub de Marketing da IA</h3>
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
          {(['pendente', 'aprovado', 'rejeitado'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1 text-sm font-semibold rounded-md capitalize transition-colors ${filterStatus === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando propostas da IA...</p>
      ) : proposals.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Nenhuma proposta encontrada para este filtro.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal.id} className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-bold text-blue-600">{typeLabels[proposal.type]}</p>
              <h4 className="text-lg font-semibold text-gray-900 mt-1">{proposal.title}</h4>
              <p className="text-xs text-gray-500 mt-1 italic">"{proposal.justification}"</p>
              
              <div className="mt-3 p-3 bg-white border rounded-md text-sm">
                <p><strong>Detalhes:</strong> {proposal.details.summary || proposal.details.text || `Criar página para ${proposal.details.category}`}</p>
              </div>

              {filterStatus === 'pendente' && (
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => handleUpdateStatus(proposal.id, 'rejeitado')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(proposal.id, 'aprovado')}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Aprovar Ação
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMarketingHub;