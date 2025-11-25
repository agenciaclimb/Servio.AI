/**
 * QuickActionsBar - Barra de Ações Rápidas Sticky
 * 
 * Barra flutuante com as 4 ações mais importantes para prospectores:
 * - Compartilhar Link (WhatsApp 1-click)
 * - Adicionar Lead (modal rápido)
 * - Notificações (badge count + configurações)
 * - Próxima Tarefa IA (sugestão inteligente)
 * 
 * Features:
 * - Sticky no topo do viewport
 * - Mobile: FAB (Floating Action Button) expansível
 * - Integração com IA para sugestões contextuais
 * - Animações suaves e haptic feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { generateSmartActions, type SmartAction } from '../../services/smartActionsService';

interface QuickActionsBarProps {
  prospectorId: string;
  prospectorName?: string; // Opcional - não usado
  referralLink: string;
  unreadNotifications: number;
  onAddLead: () => void;
  onOpenNotifications: () => void;
}

export default function QuickActionsBar({
  prospectorId,
  referralLink,
  unreadNotifications,
  onAddLead,
  onOpenNotifications
}: QuickActionsBarProps) {
  const [nextAction, setNextAction] = useState<SmartAction | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  useEffect(() => {
    // Detectar mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadNextAction = useCallback(async () => {
    try {
      // TODO: Buscar stats reais quando disponível
      const mockStats = {
        prospectorId: prospectorId,
        activeRecruits: 0,
        totalRecruits: 0,
        totalCommissionsEarned: 0,
        averageCommissionPerRecruit: 0,
        pendingCommissions: 0,
        currentBadge: 'Iniciante',
        nextBadge: 'Bronze',
        progressToNextBadge: 0,
        badgeTiers: []
      };
      const actions = await generateSmartActions(prospectorId, mockStats, [], []);
      if (actions.length > 0) {
        // Pegar apenas a primeira (maior prioridade)
        setNextAction(actions[0]);
      }
    } catch (error) {
      console.error('[QuickActions] Erro ao carregar próxima ação:', error);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadNextAction();
    // Atualizar ação a cada 5 minutos
    const interval = setInterval(loadNextAction, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNextAction]);

  function handleShareLink() {
    const message = `🚀 Olá! Que tal oferecer seus serviços na melhor plataforma do Brasil?\n\nCadastre-se aqui: ${referralLink}\n\n✅ Grátis para começar\n✅ Pagamentos seguros\n✅ Clientes garantidos\n\nQualquer dúvida, estou aqui para ajudar! 😊`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Vibração de sucesso (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  function handleExecuteNextAction() {
    if (!nextAction) return;

    // Vibração
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Executar ação baseada no tipo
    switch (nextAction.actionType) {
      case 'follow_up':
        // Redirecionar para CRM com filtro de leads inativos
        window.location.hash = '#crm?filter=inactive';
        break;
      case 'share':
        handleShareLink();
        break;
      case 'engage':
        onAddLead();
        break;
      case 'goal':
        onOpenNotifications();
        break;
      default:
        alert(nextAction.description);
    }

    // Recarregar próxima ação
    setTimeout(loadNextAction, 1000);
  }

  // Mobile: FAB expansível
  if (isMobile) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* FAB Principal */}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform active:scale-95"
        >
          {fabExpanded ? '✕' : '⚡'}
        </button>

        {/* Menu Expansível */}
        {fabExpanded && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/30 -z-10"
              onClick={() => setFabExpanded(false)}
            />

            {/* Botões de Ação */}
            <div className="absolute bottom-20 right-0 space-y-3 animate-slide-up">
              {/* Próxima Tarefa IA */}
              {nextAction && (
                <button
                  onClick={handleExecuteNextAction}
                  className="flex items-center gap-3 bg-white rounded-full shadow-xl pl-4 pr-5 py-3 hover:shadow-2xl transition-all"
                >
                  <span className="text-2xl">{nextAction.icon}</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-gray-600">Próxima Tarefa IA</div>
                    <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
                      {nextAction.title}
                    </div>
                  </div>
                </button>
              )}

              {/* Notificações */}
              <button
                onClick={onOpenNotifications}
                className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:shadow-2xl transition-all relative"
              >
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Adicionar Lead */}
              <button
                onClick={onAddLead}
                className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:shadow-2xl transition-all"
              >
                ➕
              </button>

              {/* Compartilhar Link */}
              <button
                onClick={handleShareLink}
                className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:shadow-2xl transition-all"
              >
                💬
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop: Barra sticky no topo
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Título */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Ações Rápidas</h2>
              <p className="text-xs text-gray-500">Produtividade turbinada por IA</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {/* Próxima Tarefa IA */}
            {nextAction && (
              <button
                onClick={handleExecuteNextAction}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md ${
                  nextAction.priority === 'high'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse'
                    : nextAction.priority === 'medium'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                }`}
                title={nextAction.description}
              >
                <span className="text-xl">{nextAction.icon}</span>
                <div className="text-left">
                  <div className="text-xs opacity-90">Próxima Tarefa IA</div>
                  <div className="text-sm font-bold max-w-[200px] truncate">{nextAction.title}</div>
                </div>
              </button>
            )}

            {/* Compartilhar Link */}
            <button
              onClick={handleShareLink}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all"
              title="Compartilhar no WhatsApp"
              data-tour="share-whatsapp"
            >
              <span className="text-xl">💬</span>
              <span className="text-sm">Compartilhar</span>
            </button>

            {/* Adicionar Lead */}
            <button
              onClick={onAddLead}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all"
              title="Adicionar novo lead"
              data-tour="add-lead"
            >
              <span className="text-xl">➕</span>
              <span className="text-sm">Novo Lead</span>
            </button>

            {/* Notificações */}
            <button
              onClick={onOpenNotifications}
              className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all"
              title="Ver notificações"
              data-tour="notifications"
            >
              <span className="text-xl">🔔</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
              <span className="text-sm">Alertas</span>
            </button>
          </div>
        </div>

        {/* Dica Contextual */}
        {nextAction && nextAction.priority === 'high' && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-red-600 font-bold text-sm">⚠️ Urgente:</span>
            <span className="text-red-800 text-sm">{nextAction.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Animação customizada para FAB mobile
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
document.head.appendChild(style);
