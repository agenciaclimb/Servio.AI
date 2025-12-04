import { useState } from 'react';
import type { ProspectLead } from '../ProspectorCRM';
import { generateWhatsAppTemplate, generateEmailTemplate } from '../../utils/prospectorHelpers';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedLeads: ProspectLead[];
  onClearSelection: () => void;
  onBulkMove: (stage: ProspectLead['stage']) => void;
  onBulkTemperature: (temp: 'hot' | 'warm' | 'cold') => void;
  onBulkDelete: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  selectedLeads,
  onClearSelection,
  onBulkMove,
  onBulkTemperature,
  onBulkDelete
}: BulkActionsBarProps) {
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignType, setCampaignType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [customMessage, setCustomMessage] = useState('');

  if (selectedCount === 0) return null;

  const handleBulkCampaign = () => {
    const leadsWithContact = selectedLeads.filter(l => 
      campaignType === 'whatsapp' ? l.phone : l.email
    );

    if (leadsWithContact.length === 0) {
      alert(`❌ Nenhum lead selecionado possui ${campaignType === 'whatsapp' ? 'telefone' : 'email'}.`);
      return;
    }

    const message = customMessage || (campaignType === 'whatsapp' 
      ? generateWhatsAppTemplate(leadsWithContact[0]) 
      : generateEmailTemplate(leadsWithContact[0]));

    if (campaignType === 'whatsapp') {
      leadsWithContact.forEach(lead => {
        const phoneClean = lead.phone!.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`, '_blank');
      });
    } else {
      const emails = leadsWithContact.map(l => l.email).join(',');
      window.open(`mailto:${emails}?subject=Oportunidade Servio.AI&body=${encodeURIComponent(message)}`, '_blank');
    }

    setShowCampaignModal(false);
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 p-4 min-w-[600px]">
        <div className="flex items-center gap-4">
          {/* Selection indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
            <span className="text-2xl">✓</span>
            <span className="font-bold text-indigo-700">{selectedCount}</span>
            <span className="text-sm text-gray-600">selecionados</span>
          </div>

          <div className="flex-1 flex items-center gap-2">
            {/* Quick move actions */}
            <button
              onClick={() => onBulkMove('contacted')}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors"
              title="Mover para Contatados"
            >
              📞 Contatados
            </button>
            <button
              onClick={() => onBulkMove('negotiating')}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              title="Mover para Negociando"
            >
              🤝 Negociando
            </button>
            <button
              onClick={() => onBulkMove('won')}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              title="Marcar como Convertido"
            >
              ✅ Ganhos
            </button>

            {/* Temperature actions */}
            <div className="w-px h-8 bg-gray-300" />
            <button
              onClick={() => onBulkTemperature('hot')}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              title="Marcar como Quente"
            >
              🔥 Hot
            </button>
            <button
              onClick={() => onBulkTemperature('warm')}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Marcar como Morno"
            >
              ⚡ Warm
            </button>

            {/* Campaign action */}
            <div className="w-px h-8 bg-gray-300" />
            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              title="Enviar campanha em massa"
            >
              📢 Campanha
            </button>

            {/* Delete action */}
            <button
              onClick={onBulkDelete}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              title="Excluir selecionados"
            >
              🗑️ Excluir
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClearSelection}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ✕ Cancelar
          </button>
        </div>
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-[60]" onClick={() => setShowCampaignModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">📢 Campanha em Massa</h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              {/* Campaign type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Canal de envio</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCampaignType('whatsapp')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      campaignType === 'whatsapp'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    📲 WhatsApp ({selectedLeads.filter(l => l.phone).length})
                  </button>
                  <button
                    onClick={() => setCampaignType('email')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      campaignType === 'email'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    ✉️ Email ({selectedLeads.filter(l => l.email).length})
                  </button>
                </div>
              </div>

              {/* Message template */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mensagem (opcional - deixe vazio para usar template automático)</label>
                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder={campaignType === 'whatsapp' 
                    ? 'Olá {nome}! Tenho uma oportunidade incrível para você...'
                    : 'Assunto: Oportunidade Servio.AI\n\nOlá {nome},\n\n...'}
                  className="w-full h-32 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Use {'{nome}'} para personalização automática</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleBulkCampaign}
                  className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                  🚀 Enviar Campanha
                </button>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
