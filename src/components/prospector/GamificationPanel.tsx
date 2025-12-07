import type { ProspectLead } from '../ProspectorCRM';
import { useMemo } from 'react';

interface GamificationPanelProps {
  leads: ProspectLead[];
  onClose: () => void;
}

export default function GamificationPanel({ leads, onClose }: GamificationPanelProps) {
  const metrics = useMemo(() => {
    const contacted = leads.filter(l => l.stage === 'contacted').length;
    const negotiating = leads.filter(l => l.stage === 'negotiating').length;
    const won = leads.filter(l => l.stage === 'won').length;
    const total = leads.length || 1;
    const conversion = ((won / total) * 100).toFixed(1);

    // Meta diária simples: 20 contatos
    const dailyGoal = 20;
    const progressPercent = Math.min(100, (contacted / dailyGoal) * 100);

    // Ranking fictício (placeholder)
    const ranking = [
      { name: 'Você', score: won * 10 + negotiating * 5 + contacted * 2 },
      { name: 'Prospector A', score: 280 },
      { name: 'Prospector B', score: 195 },
    ].sort((a, b) => b.score - a.score);

    const position = ranking.findIndex(r => r.name === 'Você') + 1;

    return {
      contacted,
      negotiating,
      won,
      total,
      conversion,
      dailyGoal,
      progressPercent,
      ranking,
      position,
    };
  }, [leads]);

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-[76]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[760px] max-w-[92vw] max-h-[85vh] overflow-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">🏆 Painel de Gamificação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-blue-50">
            <div className="text-xs font-bold text-blue-600">CONTATADOS HOJE</div>
            <div className="text-3xl font-extrabold text-blue-800">{metrics.contacted}</div>
            <div className="text-xs text-blue-700 mt-1">Meta: {metrics.dailyGoal}</div>
            <div className="h-2 bg-blue-100 rounded mt-2 overflow-hidden">
              <div
                style={{ width: `${metrics.progressPercent}%` }}
                className="h-full bg-blue-500 transition-all"
              ></div>
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-purple-50">
            <div className="text-xs font-bold text-purple-600">NEGOCIANDO</div>
            <div className="text-3xl font-extrabold text-purple-800">{metrics.negotiating}</div>
            <div className="text-xs text-purple-700 mt-1">
              Conversão atual: {metrics.conversion}%
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-green-50">
            <div className="text-xs font-bold text-green-600">CONVERTIDOS</div>
            <div className="text-3xl font-extrabold text-green-800">{metrics.won}</div>
            <div className="text-xs text-green-700 mt-1">Taxa Global: {metrics.conversion}%</div>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg border bg-yellow-50">
          <div className="font-bold text-yellow-700 mb-1">📈 Pontuação & Ranking</div>
          <div className="text-sm text-yellow-800">
            Sua posição no ranking atual: <strong>#{metrics.position}</strong>
          </div>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-1">Posição</th>
                <th>Nome</th>
                <th>Pontuação</th>
              </tr>
            </thead>
            <tbody>
              {metrics.ranking.map((r, idx) => (
                <tr
                  key={r.name}
                  className={`border-t text-gray-700 ${r.name === 'Você' ? 'font-bold bg-indigo-50' : ''}`}
                >
                  <td className="py-1">#{idx + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-bold mb-2">🎯 Próximos Objetivos</h3>
            <ul className="text-sm space-y-1 text-gray-700 list-disc ml-4">
              <li>Atingir 20 contatos (progresso {metrics.progressPercent.toFixed(0)}%)</li>
              <li>Elevar conversão para 30% (atual {metrics.conversion}%)</li>
              <li>Fechar +5 negociações esta semana</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-bold mb-2">💡 Recomendações</h3>
            <ul className="text-sm space-y-1 text-gray-700 list-disc ml-4">
              <li>Priorize leads quentes sem atividade há 3+ dias</li>
              <li>Use sequência de reativação em negociações paradas</li>
              <li>Envie mensagem customizada para top 5 leads com maior score</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          * Pontuação e ranking são placeholders. Próximas fases: sistema real baseado em
          atividades.
        </div>
      </div>
    </div>
  );
}
