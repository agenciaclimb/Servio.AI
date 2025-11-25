/**
 * OnboardingTour - Tour Interativo Guiado por IA
 * 
 * Sistema de onboarding que ensina prospectores a usar a plataforma
 * com checklist inteligente e dicas contextuais geradas por IA.
 * 
 * Features:
 * - Tour passo-a-passo com react-joyride
 * - Checklist de tarefas essenciais
 * - Progresso salvo no Firestore
 * - Dicas IA contextuais
 * - Celebração ao completar
 */

import { useState, useEffect, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface OnboardingTourProps {
  prospectorId: string;
  prospectorName?: string; // Opcional - não usado no componente
}

interface OnboardingProgress {
  completed: boolean;
  currentStep: number;
  tasksCompleted: {
    generatedLink: boolean;
    sharedWhatsApp: boolean;
    addedLead: boolean;
    configuredNotifications: boolean;
    exploredMaterials: boolean;
  };
  startedAt: Date;
  completedAt?: Date;
}

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">🎉 Bem-vindo ao Prospector!</h2>
        <p className="text-gray-700">
          Vou te guiar pelos recursos essenciais para você começar a recrutar e ganhar comissões.
          Este tour leva apenas <strong>5 minutos</strong>!
        </p>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-sm text-indigo-800">
            💡 <strong>Dica IA:</strong> Prospectores que completam o onboarding convertem 3x mais leads!
          </p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="referral-link"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">🔗 Seu Link de Indicação</h3>
        <p className="text-gray-700">
          Este é seu link único de prospecção. Compartilhe com pessoas interessadas em oferecer serviços na plataforma.
        </p>
        <div className="bg-yellow-50 p-2 rounded text-sm">
          <strong>✅ Tarefa:</strong> Clique em "Copiar Link" e salve em algum lugar.
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="share-whatsapp"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">💬 Compartilhar no WhatsApp</h3>
        <p className="text-gray-700">
          Use este botão para enviar seu link diretamente no WhatsApp. Já vem com uma mensagem pronta otimizada por IA!
        </p>
        <div className="bg-green-50 p-2 rounded text-sm">
          <strong>✅ Tarefa:</strong> Compartilhe com pelo menos 1 contato agora.
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="crm-board"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">🎯 Pipeline de Prospecção</h3>
        <p className="text-gray-700">
          Organize seus leads neste quadro Kanban. Arraste e solte para mudar o status. A IA calcula o "score" de cada lead automaticamente!
        </p>
        <div className="bg-purple-50 p-2 rounded text-sm">
          <strong>💡 Dica:</strong> Leads com 🔥 são prioridade máxima.
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="add-lead"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">➕ Adicionar Lead</h3>
        <p className="text-gray-700">
          Cadastre manualmente leads que você contatou. Quanto mais informações você adicionar, maior o score do lead!
        </p>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <strong>✅ Tarefa:</strong> Adicione seu primeiro lead agora.
        </div>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="notifications"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">🔔 Notificações Inteligentes</h3>
        <p className="text-gray-700">
          Configure notificações para não perder nenhum follow-up. A IA te avisa quando é hora de contatar um lead!
        </p>
        <div className="bg-red-50 p-2 rounded text-sm">
          <strong>✅ Tarefa:</strong> Ative notificações push.
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="materials"]',
    content: (
      <div className="space-y-2">
        <h3 className="font-bold text-lg">📚 Materiais de Marketing</h3>
        <p className="text-gray-700">
          Baixe imagens, vídeos e textos prontos para compartilhar nas redes sociais e WhatsApp.
        </p>
        <div className="bg-indigo-50 p-2 rounded text-sm">
          <strong>✅ Tarefa:</strong> Explore os materiais disponíveis.
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-green-600">Parabéns!</h2>
        <p className="text-gray-700">
          Você completou o onboarding! Agora você está pronto para recrutar prestadores e ganhar comissões.
        </p>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <p className="font-semibold text-green-800 mb-2">🎯 Próximos Passos:</p>
          <ul className="text-sm text-left space-y-1 text-gray-700">
            <li>✅ Compartilhe seu link em grupos de WhatsApp</li>
            <li>✅ Poste nas redes sociais com os materiais</li>
            <li>✅ Entre em contato com seus leads diariamente</li>
            <li>✅ Use a IA para personalizar mensagens</li>
          </ul>
        </div>
        <p className="text-sm text-gray-600">
          💰 Meta: Recrute 10 prestadores este mês e ganhe até R$ 5.000 em comissões!
        </p>
      </div>
    ),
    placement: 'center',
  },
];

export default function OnboardingTour({ prospectorId }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const loadProgress = useCallback(async () => {
    try {
      const progressDoc = await getDoc(doc(db, 'prospector_onboarding', prospectorId));
      
      if (progressDoc.exists()) {
        const data = progressDoc.data();
        setProgress({
          ...data,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate()
        } as OnboardingProgress);
        
        // Se não completou, perguntar se quer continuar
        if (!data.completed) {
          const shouldContinue = confirm(
            '👋 Olá! Notei que você não completou o tour de onboarding.\n\nQuer continuar de onde parou? (Leva só 5 minutos)'
          );
          if (shouldContinue) {
            setStepIndex(data.currentStep || 0);
            setRunTour(true);
          }
        }
      } else {
        // Primeiro acesso - iniciar tour automaticamente
        const newProgress: OnboardingProgress = {
          completed: false,
          currentStep: 0,
          tasksCompleted: {
            generatedLink: false,
            sharedWhatsApp: false,
            addedLead: false,
            configuredNotifications: false,
            exploredMaterials: false
          },
          startedAt: new Date()
        };
        
        await setDoc(doc(db, 'prospector_onboarding', prospectorId), {
          ...newProgress,
          startedAt: new Date()
        });
        
        setProgress(newProgress);
        setRunTour(true);
      }
    } catch (error) {
      console.error('[Onboarding] Erro ao carregar progresso:', error);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  async function updateProgress(updates: Partial<OnboardingProgress>) {
    if (!progress) return;

    const updatedProgress = { ...progress, ...updates };
    setProgress(updatedProgress);

    try {
      await updateDoc(doc(db, 'prospector_onboarding', prospectorId), updates);
    } catch (error) {
      console.error('[Onboarding] Erro ao salvar progresso:', error);
    }
  }

  function handleJoyrideCallback(data: CallBackProps) {
    const { status, index, action } = data;

    // Atualizar step atual
    if (action === 'next' || action === 'prev') {
      setStepIndex(index);
      updateProgress({ currentStep: index });
    }

    // Onboarding completado
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      
      if (status === STATUS.FINISHED) {
        updateProgress({
          completed: true,
          currentStep: TOUR_STEPS.length - 1,
          completedAt: new Date()
        });

        // Celebração épica
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });

        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 250);

        // Toaster de parabéns
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-xl shadow-2xl z-50 animate-bounce';
        toast.innerHTML = `
          <div class="text-center">
            <div class="text-5xl mb-2">🏆</div>
            <div class="font-bold text-xl mb-1">Onboarding Completo!</div>
            <div class="text-sm">+50 XP desbloqueado 🎮</div>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.animation = 'fadeOut 1s';
          setTimeout(() => toast.remove(), 1000);
        }, 5000);
      }
    }
  }

  const completedTasksCount = progress 
    ? Object.values(progress.tasksCompleted).filter(Boolean).length
    : 0;
  const totalTasks = 5;
  const progressPercent = Math.round((completedTasksCount / totalTasks) * 100);

  return (
    <>
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#4f46e5',
            zIndex: 10000,
          },
          tooltip: {
            fontSize: 16,
            padding: 20,
          },
          buttonNext: {
            backgroundColor: '#4f46e5',
            fontSize: 14,
            padding: '10px 20px',
          },
          buttonBack: {
            color: '#6b7280',
            fontSize: 14,
          },
        }}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Finalizar',
          next: 'Próximo',
          skip: 'Pular',
        }}
      />

      {/* Checklist Sidebar (sempre visível até completar) */}
      {progress && !progress.completed && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl p-4 w-80 z-40 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              Checklist de Onboarding
            </h4>
            <button
              onClick={() => setRunTour(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Retomar Tour
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progresso</span>
              <span className="font-bold text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {[
              { key: 'generatedLink', label: 'Copiar link de indicação', icon: '🔗' },
              { key: 'sharedWhatsApp', label: 'Compartilhar no WhatsApp', icon: '💬' },
              { key: 'addedLead', label: 'Adicionar primeiro lead', icon: '➕' },
              { key: 'configuredNotifications', label: 'Ativar notificações', icon: '🔔' },
              { key: 'exploredMaterials', label: 'Explorar materiais', icon: '📚' },
            ].map((task) => {
              const completed = progress.tasksCompleted[task.key as keyof typeof progress.tasksCompleted];
              return (
                <div
                  key={task.key}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    completed ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{completed ? '✅' : task.icon}</span>
                  <span className={`text-sm flex-1 ${completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          {completedTasksCount === totalTasks && (
            <button
              onClick={() => {
                updateProgress({ completed: true, completedAt: new Date() });
                confetti({ particleCount: 100, spread: 70 });
              }}
              className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              🎉 Finalizar Onboarding
            </button>
          )}
        </div>
      )}

      {/* Badge de Conquista */}
      {progress?.completed && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full p-4 shadow-2xl z-40 cursor-pointer hover:scale-110 transition-transform"
             title="Onboarding Completo! 🏆">
          <span className="text-3xl">🏆</span>
        </div>
      )}
    </>
  );
}

/**
 * Hook para marcar tarefas como completas
 * Uso: Em cada componente, chamar quando tarefa for executada
 */
export function useOnboardingTask(prospectorId: string, taskKey: keyof OnboardingProgress['tasksCompleted']) {
  return async () => {
    try {
      const progressDoc = await getDoc(doc(db, 'prospector_onboarding', prospectorId));
      if (!progressDoc.exists()) return;

      const tasksCompleted = progressDoc.data().tasksCompleted || {};
      if (tasksCompleted[taskKey]) return; // Já completada

      await updateDoc(doc(db, 'prospector_onboarding', prospectorId), {
        [`tasksCompleted.${taskKey}`]: true
      });

      // Micro-celebração
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (error) {
      console.error('[Onboarding] Erro ao marcar tarefa:', error);
    }
  };
}
