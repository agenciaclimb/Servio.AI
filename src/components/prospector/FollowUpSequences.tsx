import { useState } from 'react';
import { db, getAnalyticsIfSupported } from '../../../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import type { ProspectLead } from '../ProspectorCRM';

interface FollowUpSequence {
  id: string;
  name: string;
  description: string;
  steps: FollowUpStep[];
  active: boolean;
}

interface FollowUpStep {
  dayOffset: number;
  channel: 'email' | 'whatsapp' | 'call';
  template: string;
  subject?: string;
}

const DEFAULT_SEQUENCES: FollowUpSequence[] = [
  {
    id: 'onboarding',
    name: '🎯 Onboarding Rápido',
    description: 'Sequência agressiva para leads quentes (4 dias)',
    active: true,
    steps: [
      {
        dayOffset: 0,
        channel: 'whatsapp',
        template: 'Olá {nome}! 👋\n\nObrigado pelo interesse na Servio.AI! Vi que você trabalha com {categoria}.\n\nTenho uma oportunidade perfeita para aumentar sua renda. Posso te explicar em 2 minutos?'
      },
      {
        dayOffset: 1,
        channel: 'email',
        subject: 'Como a Servio.AI pode triplicar sua renda',
        template: 'Olá {nome},\n\nOntem tentei te contatar por WhatsApp sobre uma oportunidade na Servio.AI.\n\nResumo rápido:\n✅ Clientes pré-qualificados\n✅ Pagamento garantido\n✅ Sem mensalidades\n✅ Você define horários e valores\n\nMais de 500 profissionais já estão aumentando sua renda conosco.\n\nQuer uma demo rápida hoje?'
      },
      {
        dayOffset: 3,
        channel: 'whatsapp',
        template: '{nome}, notei que você ainda não respondeu 🤔\n\nSó para garantir que não perdeu a mensagem: temos clientes procurando por {categoria} AGORA.\n\nSe tiver interesse, me avise. Caso contrário, sem problemas! 👍'
      },
      {
        dayOffset: 7,
        channel: 'call',
        template: 'Ligação de acompanhamento final - última tentativa'
      }
    ]
  },
  {
    id: 'nurture',
    name: '🌱 Nutrição Longa',
    description: 'Sequência suave para leads frios (14 dias)',
    active: true,
    steps: [
      {
        dayOffset: 0,
        channel: 'email',
        subject: 'Bem-vindo à Servio.AI - Vamos começar?',
        template: 'Olá {nome},\n\nVi seu perfil e acredito que a Servio.AI pode ser útil para você.\n\nSomos uma plataforma que conecta profissionais {categoria} a clientes verificados.\n\nQue tal conhecer melhor? Sem compromisso.'
      },
      {
        dayOffset: 3,
        channel: 'whatsapp',
        template: 'Oi {nome}! 👋\n\nEnviei um email há alguns dias sobre a Servio.AI.\n\nEm resumo: conectamos você a clientes pagantes. Quer saber mais?'
      },
      {
        dayOffset: 7,
        channel: 'email',
        subject: 'Case de sucesso: como João aumentou 200% sua renda',
        template: 'Olá {nome},\n\nQuero compartilhar uma história inspiradora:\n\nJoão, eletricista como você, estava com agenda vazia. Cadastrou-se na Servio.AI e em 30 dias tinha 15 jobs fechados.\n\nResultado: +R$8.500 no primeiro mês.\n\nQuer saber como ele fez? Te conto tudo.'
      },
      {
        dayOffset: 14,
        channel: 'whatsapp',
        template: '{nome}, última mensagem! 😊\n\nSe não tiver interesse agora, sem problemas. Mas guarde nosso contato - quando precisar de clientes extras, estamos aqui!\n\nSucesso! 🚀'
      }
    ]
  },
  {
    id: 'reactivation',
    name: '🔄 Reativação de Inativos',
    description: 'Para leads sem resposta há 30+ dias',
    active: true,
    steps: [
      {
        dayOffset: 0,
        channel: 'whatsapp',
        template: 'E aí {nome}! 👋\n\nFaz tempo que não conversamos...\n\nNovidade: agora temos uma OFERTA ESPECIAL para profissionais {categoria}:\n\n🎁 30 dias SEM TAXA\n🎁 Cliente garantido na primeira semana\n\nInteresse?'
      },
      {
        dayOffset: 2,
        channel: 'email',
        subject: '🎁 Oferta exclusiva de reativação - 48h apenas',
        template: 'Olá {nome},\n\nNotamos sua ausência e queremos te ter de volta!\n\nOferta especial (válida por 48h):\n✅ 30 dias sem taxa de plataforma\n✅ Prioridade no matching de clientes\n✅ Suporte dedicado\n\nVale a pena dar uma segunda chance?\n\nAbraços!'
      }
    ]
  }
];

interface FollowUpSequencesProps {
  prospectorId: string;
  selectedLeads: ProspectLead[];
  onClose: () => void;
  onActivated?: (sequenceId: string, leadCount: number) => void;
}

export default function FollowUpSequences({ prospectorId, selectedLeads, onClose, onActivated }: FollowUpSequencesProps) {
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleActivateSequence = async () => {
    if (!selectedSequence || selectedLeads.length === 0) return;

    setLoading(true);
    try {
      const sequence = DEFAULT_SEQUENCES.find(s => s.id === selectedSequence);
      if (!sequence) return;

      // Create follow-up schedule for each lead
      const promises = selectedLeads.map(async (lead) => {
        const scheduleData = {
          prospectorId,
          leadId: lead.id,
          leadName: lead.name,
          sequenceId: sequence.id,
          sequenceName: sequence.name,
          currentStep: 0,
          steps: sequence.steps.map((step, idx) => ({
            stepIndex: idx,
            dayOffset: step.dayOffset,
            scheduledFor: Timestamp.fromDate(new Date(Date.now() + step.dayOffset * 24 * 60 * 60 * 1000)),
            channel: step.channel,
            template: step.template
              .replace(/{nome}/g, lead.name)
              .replace(/{categoria}/g, lead.category || 'seu segmento'),
            subject: step.subject,
            completed: false,
            sentAt: null
          })),
          createdAt: Timestamp.now(),
          status: 'active' as const
        };

        await addDoc(collection(db, 'prospector_followups'), scheduleData);
      });

      await Promise.all(promises);

      // Analytics
      try {
        const analytics = await getAnalyticsIfSupported();
        if (analytics) {
          logEvent(analytics, 'sequence_activated', {
            sequence_id: sequence.id,
            sequence_name: sequence.name,
            lead_count: selectedLeads.length
          });
        }
      } catch {
        // Analytics falhou, mas ativação continua
      }

      // Callback externo
      if (onActivated) onActivated(sequence.id, selectedLeads.length);

      alert(`✅ Sequência "${sequence.name}" ativada para ${selectedLeads.length} lead(s)!\n\nOs follow-ups serão enviados automaticamente nos dias programados.`);
      onClose();
    } catch (error) {
      console.error('Error activating sequence:', error);
      alert('❌ Erro ao ativar sequência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-[70]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-w-[90vw] max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔄 Sequências Automatizadas</h2>
            <p className="text-sm text-gray-600">Follow-up inteligente para {selectedLeads.length} lead(s) selecionado(s)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          {DEFAULT_SEQUENCES.map((seq) => (
            <div
              key={seq.id}
              onClick={() => setSelectedSequence(seq.id)}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedSequence === seq.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    selectedSequence === seq.id
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300'
                  } flex items-center justify-center`}>
                    {selectedSequence === seq.id && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{seq.name}</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {seq.steps.length} passos
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{seq.description}</p>

                  {/* Timeline preview */}
                  <div className="space-y-2">
                    {seq.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-gray-500 min-w-[60px]">D+{step.dayOffset}</span>
                        <span className="px-2 py-1 rounded-md bg-white border border-gray-200 font-semibold">
                          {step.channel === 'whatsapp' ? '📲 WhatsApp' : step.channel === 'email' ? '✉️ Email' : '📞 Call'}
                        </span>
                        <span className="text-gray-600 truncate flex-1">
                          {step.subject || step.template.substring(0, 50)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleActivateSequence}
            disabled={!selectedSequence || loading}
            className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Ativando...' : '🚀 Ativar Sequência'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {selectedSequence && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>💡 Dica:</strong> Os follow-ups serão personalizados automaticamente com o nome e categoria de cada lead. Você pode acompanhar o progresso no dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
