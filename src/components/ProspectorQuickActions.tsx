import { useState, useCallback } from 'react';

// Tipo local para evitar dependência circular
interface ProspectorStats {
  totalRecruits: number;
  totalCommissionsEarned: number;
  currentBadge?: string;  // opcional para retrocompatibilidade
  currentBadgeName?: string;  // novo nome do campo
}

interface ProspectorQuickActionsProps {
  prospectorId: string;
  referralLink: string;
  stats: ProspectorStats | null;
  onShareClick?: () => void;
}

type CopiedAction = 'link' | 'whatsapp' | 'email' | 'sms' | null;

/**
 * ProspectorQuickActions - Barra de ações rápidas sticky top
 * 
 * Features:
 * - Copiar link de indicação (1 clique)
 * - Copiar templates WhatsApp/Email/SMS (1 clique)
 * - Botão compartilhar modal
 * - Stats inline (recrutas, comissões, badge)
 * - Feedback visual de "copiado"
 * - Sticky positioning para acesso constante
 * 
 * @example
 * ```tsx
 * <ProspectorQuickActions 
 *   prospectorId={userId}
 *   referralLink="https://servio-ai.com?ref=ABC123"
 *   stats={prospectorStats}
 * />
 * ```
 */
export function ProspectorQuickActions({
  referralLink,
  stats,
  onShareClick,
}: Readonly<Omit<ProspectorQuickActionsProps, 'prospectorId'>>) {
  const [copiedAction, setCopiedAction] = useState<CopiedAction>(null);

  const copyToClipboard = useCallback(async (text: string, action: CopiedAction) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAction(action);
      setTimeout(() => setCopiedAction(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const quickCopyTemplate = useCallback(async (type: 'whatsapp' | 'email' | 'sms') => {
    // Templates simplificados para quick copy
    const templates = {
      whatsapp: `Oi! 👋 Quero te apresentar a Servio.AI, uma plataforma que conecta prestadores de serviço com clientes. Cadastro GRATUITO: ${referralLink}`,
      email: `Olá!\n\nGostaria de te apresentar a Servio.AI, uma plataforma que ajuda prestadores de serviço a encontrar novos clientes.\n\nCadastro gratuito: ${referralLink}\n\nQualquer dúvida, estou à disposição!`,
      sms: `Servio.AI - Plataforma GRÁTIS para prestadores de serviço encontrarem clientes. Cadastre-se: ${referralLink}`,
    };

    await copyToClipboard(templates[type], type);
  }, [referralLink, copyToClipboard]);

  const getBadgeIcon = (badgeName: string | undefined) => {
    if (!badgeName) return '🥉';
    const icons: Record<string, string> = {
      'Bronze': '🥉',
      'Prata': '🥈',
      'Ouro': '🥇',
      'Platina': '💎',
      'Diamante': '👑',
    };
    return icons[badgeName] || '🏅';
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg quick-actions-bar">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Ações Rápidas */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-semibold text-sm hidden sm:inline">⚡ Ações Rápidas:</span>
            
            {/* Copiar Link */}
            <button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              type="button"
              aria-label="Copiar link de indicação"
            >
              {copiedAction === 'link' ? (
                <>
                  <span>✅</span>
                  <span className="hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span className="hidden sm:inline">Copiar Link</span>
                </>
              )}
            </button>

            {/* WhatsApp Rápido */}
            <button
              onClick={() => quickCopyTemplate('whatsapp')}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              type="button"
              aria-label="Copiar template WhatsApp"
            >
              {copiedAction === 'whatsapp' ? (
                <>
                  <span>✅</span>
                  <span className="hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <span>💬</span>
                  <span className="hidden sm:inline">WhatsApp</span>
                </>
              )}
            </button>

            {/* Email Rápido */}
            <button
              onClick={() => quickCopyTemplate('email')}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              type="button"
              aria-label="Copiar template Email"
            >
              {copiedAction === 'email' ? (
                <>
                  <span>✅</span>
                  <span className="hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <span>📧</span>
                  <span className="hidden sm:inline">Email</span>
                </>
              )}
            </button>

            {/* SMS Rápido */}
            <button
              onClick={() => quickCopyTemplate('sms')}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap hidden md:flex"
              type="button"
              aria-label="Copiar template SMS"
            >
              {copiedAction === 'sms' ? (
                <>
                  <span>✅</span>
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <span>📱</span>
                  <span>SMS</span>
                </>
              )}
            </button>

            {/* Compartilhar */}
            {onShareClick && (
              <button
                onClick={onShareClick}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap hidden lg:flex"
                type="button"
                aria-label="Compartilhar link"
              >
                <span>📤</span>
                <span>Compartilhar</span>
              </button>
            )}
          </div>

          {/* Stats Inline */}
          {stats && (
            <div className="flex items-center gap-4 text-white text-sm">
              <div className="flex items-center gap-1" title="Total de recrutas">
                <span className="font-bold text-lg">{stats.totalRecruits}</span>
                <span className="opacity-80 hidden sm:inline">recrutas</span>
              </div>
              <div className="flex items-center gap-1" title="Comissões ganhas">
                <span className="font-bold text-lg">R$ {stats.totalCommissionsEarned.toFixed(0)}</span>
                <span className="opacity-80 hidden sm:inline">ganhos</span>
              </div>
              <div className="flex items-center gap-1" title={`Badge atual: ${stats.currentBadgeName || stats.currentBadge}`}>
                <span className="text-2xl">{getBadgeIcon(stats.currentBadgeName || stats.currentBadge || '')}</span>
                <span className="hidden lg:inline">{stats.currentBadgeName || stats.currentBadge}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProspectorQuickActions;
