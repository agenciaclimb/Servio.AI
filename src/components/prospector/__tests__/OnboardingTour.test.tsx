/**
 * Testes para OnboardingTour - Tour Interativo com IA
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingTour from '../OnboardingTour';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Mock do Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
}));

// Mock do canvas-confetti
const mockConfetti = vi.fn().mockResolvedValue(undefined);
vi.mock('canvas-confetti', () => ({
  default: mockConfetti
}));

// Mock do react-joyride
vi.mock('react-joyride', () => ({
  default: ({ run, steps, callback }: any) => {
    if (!run) return null;
    return (
      <div data-testid="joyride-tour">
        <div>Tour Active</div>
        <button onClick={() => callback({ status: 'finished', action: 'next', index: steps.length - 1 })}>
          Finish Tour
        </button>
        <button onClick={() => callback({ status: 'skipped', action: 'skip', index: 0 })}>
          Skip Tour
        </button>
      </div>
    );
  },
  STATUS: {
    FINISHED: 'finished',
    SKIPPED: 'skipped'
  }
}));

describe('OnboardingTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
  });

  it('deve iniciar tour automaticamente no primeiro acesso', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false
    } as any);

    render(<OnboardingTour prospectorId="user-123" prospectorName="Test User" />);

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          completed: false,
          currentStep: 0
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });
  });

  it('deve perguntar para continuar se onboarding incompleto', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 2,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: false,
          addedLead: false,
          configuredNotifications: false,
          exploredMaterials: false
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('continuar de onde parou')
      );
    });
  });

  it('não deve iniciar tour se já completado', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: true,
        currentStep: 7,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: true,
          configuredNotifications: true,
          exploredMaterials: true
        },
        startedAt: new Date(),
        completedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.queryByTestId('joyride-tour')).not.toBeInTheDocument();
    });
  });

  it('deve exibir checklist de tarefas', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 0,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: false,
          addedLead: false,
          configuredNotifications: false,
          exploredMaterials: false
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Checklist de Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Copiar link de indicação')).toBeInTheDocument();
      expect(screen.getByText('Compartilhar no WhatsApp')).toBeInTheDocument();
    });
  });

  it('deve calcular progresso corretamente', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 0,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: true,
          configuredNotifications: false,
          exploredMaterials: false
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument(); // 3 de 5 = 60%
    });
  });

  it('deve marcar tarefas como completas', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 0,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: false,
          addedLead: false,
          configuredNotifications: false,
          exploredMaterials: false
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      const completedTask = screen.getByText('Copiar link de indicação');
      expect(completedTask).toHaveClass('line-through');
    });
  });

  it('deve disparar confetti ao completar tour', async () => {
    const confetti = await import('canvas-confetti');
    
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    const finishButton = screen.getByText('Finish Tour');
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(confetti.default).toHaveBeenCalled();
    });
  });

  it('deve atualizar Firestore ao completar', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    const finishButton = screen.getByText('Finish Tour');
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          completed: true
        })
      );
    });
  });

  it('deve exibir badge de conquista após completar', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: true,
        currentStep: 7,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: true,
          configuredNotifications: true,
          exploredMaterials: true
        },
        startedAt: new Date(),
        completedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });
  });

  it('deve permitir retomar tour', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 3,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: false,
          configuredNotifications: false,
          exploredMaterials: false
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('Checklist de Onboarding')).toBeInTheDocument();
    });

    const resumeButton = screen.getByText('Retomar Tour');
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });
  });

  it('deve exibir botão de finalizar quando todas as tarefas estiverem completas', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: false,
        currentStep: 7,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: true,
          configuredNotifications: true,
          exploredMaterials: true
        },
        startedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('🎉 Finalizar Onboarding')).toBeInTheDocument();
    });
  });

  it('não deve exibir checklist se onboarding completo', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        completed: true,
        currentStep: 7,
        tasksCompleted: {
          generatedLink: true,
          sharedWhatsApp: true,
          addedLead: true,
          configuredNotifications: true,
          exploredMaterials: true
        },
        startedAt: new Date(),
        completedAt: new Date()
      })
    } as any);

    render(<OnboardingTour prospectorId="user-123" />);

    await waitFor(() => {
      expect(screen.queryByText('Checklist de Onboarding')).not.toBeInTheDocument();
    });
  });
});
