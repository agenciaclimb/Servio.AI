import { useState } from 'react';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { ProspectLead } from '../ProspectorCRM';
import { getAnalyticsIfSupported } from '../../../firebaseConfig';
import { logEvent } from 'firebase/analytics';

interface LeadEnrichmentModalProps {
  lead: ProspectLead | null;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<ProspectLead>) => void;
}

// Simulação de enriquecimento (placeholder)
function fakeEnrichment(lead: ProspectLead) {
  return new Promise<{
    linkedin?: string;
    website?: string;
    company?: string;
    title?: string;
    location?: string;
  }>(resolve => {
    setTimeout(() => {
      resolve({
        linkedin: `https://linkedin.com/in/${(lead.name || 'prospect').toLowerCase().replace(/\s+/g, '-')}`,
        website: `https://www.${lead.category || 'servico'}.expert/${lead.id.substring(0, 5)}`,
        company: 'Servio.AI Network',
        title: lead.category ? `Profissional em ${lead.category}` : 'Prestador de Serviços',
        location: 'Brasil',
      });
    }, 900);
  });
}

export default function LeadEnrichmentModal({ lead, onClose, onUpdate }: LeadEnrichmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [enriched, setEnriched] = useState<{
    linkedin?: string;
    website?: string;
    company?: string;
    title?: string;
    location?: string;
  } | null>(null);
  const [notes, setNotes] = useState('');

  if (!lead) return null;

  async function handleEnrich() {
    if (!lead) return;
    setLoading(true);
    try {
      const analytics = await getAnalyticsIfSupported();
      if (analytics && lead) logEvent(analytics, 'enrichment_started', { lead_id: lead.id });

      const data = await fakeEnrichment(lead);
      setEnriched(data);
      if (analytics && lead) logEvent(analytics, 'enrichment_completed', { lead_id: lead.id });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!lead) return;
    try {
      const updates: Partial<
        ProspectLead & {
          linkedin?: string;
          website?: string;
          company?: string;
          title?: string;
          location?: string;
          enrichmentNotes?: string;
        }
      > = {
        linkedin: enriched?.linkedin,
        website: enriched?.website,
        company: enriched?.company,
        title: enriched?.title,
        location: enriched?.location,
        enrichmentNotes: notes,
        updatedAt: new Date(),
      };
      await updateDoc(doc(db, 'prospector_prospects', lead.id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      onUpdate(lead.id, updates);
      const analytics = await getAnalyticsIfSupported();
      if (analytics && lead) logEvent(analytics, 'enrichment_saved', { lead_id: lead.id });
      onClose();
    } catch (e) {
      console.error('Erro ao salvar enriquecimento', e);
      alert('Erro ao salvar enriquecimento');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-[75]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[720px] max-w-[92vw] max-h-[85vh] overflow-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">🔍 Enriquecimento de Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="font-semibold text-gray-700 mb-1">Lead Selecionado</div>
            <div className="text-sm text-gray-600">
              <strong>Nome:</strong> {lead.name} | <strong>Categoria:</strong>{' '}
              {lead.category || '—'} | <strong>Score:</strong> {lead.score || 0}
            </div>
          </div>

          {/* Enrichment Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleEnrich}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '⏳ Enriquecendo...' : enriched ? '🔄 Reprocessar' : '🚀 Enriquecer Dados'}
            </button>
          </div>

          {enriched && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <h3 className="font-bold mb-2">Dados Encontrados</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>
                    <strong>LinkedIn:</strong>{' '}
                    <a
                      className="text-indigo-600 underline"
                      href={enriched.linkedin}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {enriched.linkedin}
                    </a>
                  </li>
                  <li>
                    <strong>Website:</strong> {enriched.website}
                  </li>
                  <li>
                    <strong>Empresa:</strong> {enriched.company}
                  </li>
                  <li>
                    <strong>Título:</strong> {enriched.title}
                  </li>
                  <li>
                    <strong>Localização:</strong> {enriched.location}
                  </li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg bg-white flex flex-col">
                <h3 className="font-bold mb-2">Observações Estratégicas</h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Adicionar pontos relevantes, objeções, necessidades percebidas..."
                  className="flex-1 resize-none rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Ex: Parece focado em serviços corporativos — oferecer pacote premium.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!enriched}
            className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
          >
            💾 Salvar Enriquecimento
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          * Dados simulados. Integração real (LinkedIn / Clearbit / Apollo) será adicionada em fase
          posterior.
        </div>
      </div>
    </div>
  );
}
