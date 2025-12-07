import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import {
  trackTourStarted,
  trackTourCompleted,
  trackTourSkipped,
} from '../services/analyticsService';

interface ProspectorOnboardingProps {
  userId: string;
  isActive?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: '.prospector-stats-section',
    content:
      '👋 Bem-vindo ao seu painel de prospector! Aqui você vê suas métricas principais: recrutas, comissões ganhas e seu badge atual.',
    disableBeacon: true,
    placement: 'bottom',
    title: 'Suas Métricas',
  },
  {
    target: '.referral-link-section',
    content:
      '🔗 Este é SEU link personalizado de indicação. Copie e compartilhe com prestadores de serviço para começar a ganhar comissões!',
    placement: 'bottom',
    title: 'Link de Indicação',
  },
  {
    target: '.template-selector',
    content:
      '💬 Use nossos templates prontos para WhatsApp, Email e SMS. Personalize com 1 clique e envie para seus contatos!',
    placement: 'top',
    title: 'Templates Rápidos',
  },
  {
    target: '.badge-progress',
    content:
      '🏆 Ganhe badges recrutando mais prestadores! Cada nível traz reconhecimento e você sobe no leaderboard.',
    placement: 'left',
    title: 'Sistema de Badges',
  },
  {
    target: '.leaderboard-section',
    content:
      '📊 Compare-se com outros prospectores. Entre no Top 10 e seja reconhecido como um dos melhores!',
    placement: 'left',
    title: 'Leaderboard',
  },
];

const STORAGE_KEY_PREFIX = 'servio-prospector-tour';

/**
 * ProspectorOnboarding - Tour guiado interativo para novos prospectores
 *
 * Features:
 * - 5 steps onboarding tour usando react-joyride
 * - Persiste estado no localStorage
 * - Auto-inicia na primeira visita
 * - Permite pular ou reiniciar tour
 * - Callbacks para tracking de conclusão
 *
 * @example
 * ```tsx
 * <ProspectorOnboarding
 *   userId={currentUser.email}
 *   onComplete={() => trackEvent('onboarding_completed')}
 * />
 * ```
 */
export function ProspectorOnboarding({
  userId,
  isActive = true,
  onComplete,
  onSkip,
}: Readonly<ProspectorOnboardingProps>) {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const storageKey = `${STORAGE_KEY_PREFIX}-${userId}`;

  // Verificar se usuário já completou o tour
  useEffect(() => {
    if (!isActive || !userId) return undefined;

    const hasSeenTour = localStorage.getItem(storageKey);

    if (!hasSeenTour) {
      // Track tour start
      const startTime = Date.now();
      sessionStorage.setItem(`tour-start-${userId}`, startTime.toString());
      trackTourStarted(userId);

      // Delay de 500ms para garantir que DOM está montado
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, userId, storageKey]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index, type } = data;

      // Atualizar step index quando navegar
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      }

      // Tour finalizado
      if (status === STATUS.FINISHED) {
        setRunTour(false);
        const startTime = sessionStorage.getItem(`tour-start-${userId}`);
        const completionTime = startTime
          ? Math.round((Date.now() - parseInt(startTime)) / 1000)
          : 0;

        localStorage.setItem(
          storageKey,
          JSON.stringify({
            completed: true,
            completedAt: Date.now(),
          })
        );

        trackTourCompleted(userId, completionTime);
        onComplete?.();
      }

      // Tour pulado
      if (status === STATUS.SKIPPED) {
        setRunTour(false);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            completed: false,
            skippedAt: Date.now(),
          })
        );

        trackTourSkipped(userId, index);
        onSkip?.();
      }
    },
    [storageKey, onComplete, onSkip, userId]
  );

  // Função pública para reiniciar tour
  const restartTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStepIndex(0);
    setRunTour(true);
  }, [storageKey]);

  // Expor função de restart via window para debug
  useEffect(() => {
    if (globalThis.window !== undefined) {
      (
        globalThis as typeof globalThis & { restartProspectorTour?: () => void }
      ).restartProspectorTour = restartTour;
    }
    return undefined;
  }, [restartTour]);

  if (!isActive) return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5', // Indigo-600
          textColor: '#1F2937', // Gray-800
          backgroundColor: '#FFFFFF',
          arrowColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          fontSize: '14px',
          padding: '8px 16px',
          borderRadius: '6px',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: '13px',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}

/**
 * Hook para controlar tour programaticamente
 */
export function useProspectorOnboarding(userId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}-${userId}`;

  const hasCompletedTour = useCallback(() => {
    const data = localStorage.getItem(storageKey);
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      return parsed.completed === true;
    } catch {
      return false;
    }
  }, [storageKey]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    hasCompletedTour: hasCompletedTour(),
    resetTour,
  };
}

export default ProspectorOnboarding;
