import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIJobRequestWizard from '../../components/AIJobRequestWizard';

// Mock do Firebase Auth
vi.mock('../../firebaseConfig', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('test-token'),
    },
  },
}));

// Mock do Gemini Service
vi.mock('../../services/geminiService', () => ({
  enhanceJobRequest: vi.fn().mockResolvedValue({
    enhancedDescription: 'Enhanced description for the job',
    suggestedCategory: 'eletrica',
    suggestedServiceType: 'personalizado',
  }),
}));

// Mock do LoadingSpinner
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock do a11yHelpers
vi.mock('../../components/utils/a11yHelpers', () => ({
  getModalOverlayProps: vi.fn(() => ({})),
  getModalContentProps: vi.fn(() => ({})),
}));

// Mock do errorMessages
vi.mock('../../services/errorMessages', () => ({
  formatErrorForToast: vi.fn(() => 'Error message'),
}));

describe('AIJobRequestWizard Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Initial Step Tests
  describe('Initial Step', () => {
    it('should render the initial step by default', () => {
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      expect(screen.getByText('Assistente de Criação de Job')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Descreva sua necessidade/)).toBeInTheDocument();
    });

    it('should have disabled analyze button when request is empty', () => {
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      expect(analyzeButton).toBeDisabled();
    });

    it('should enable analyze button when request has text', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Preciso de um encanador para consertar um vazamento');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should allow address input', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const addressInput = screen.getByPlaceholderText(/Rua das Flores/);
      await user.type(addressInput, 'Avenida Paulista, 1000, São Paulo - SP');
      
      expect(addressInput).toHaveValue('Avenida Paulista, 1000, São Paulo - SP');
    });

    it('should show error when request is too short', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Curto');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Por favor, descreva um pouco mais/)).toBeInTheDocument();
      });
    });

    it('should close wizard when close button is clicked', async () => {
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const closeButton = screen.getByTestId('wizard-close');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Loading Step Tests
  describe('Loading Step', () => {
    it('should transition to loading step when analyze is clicked', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Preciso de um serviço de limpeza para meu apartamento');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('should show loading message and animations', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Preciso reformar meu banheiro completamente');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Analisando sua solicitação/)).toBeInTheDocument();
      });
    });

    it('should transition to review step after AI analysis', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Preciso de um eletricista para instalar pontos de luz');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Revise o seu Pedido')).toBeInTheDocument();
      });
    });

    it('should handle AI service errors gracefully', async () => {
      const geminiService = await import('../services/geminiService');
      vi.mocked(geminiService.enhanceJobRequest).mockRejectedValueOnce(new Error('API Error'));
      
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      await user.type(textarea, 'Preciso de um serviço muito especifico');
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/A IA não está disponível no momento/)).toBeInTheDocument();
      });
    });
  });

  // Review Step Tests
  describe('Review Step', () => {
    it('should render review form with pre-filled data', async () => {
      const initialData = {
        description: 'Preciso de um encanador',
        category: 'encanaria',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Revise o seu Pedido')).toBeInTheDocument();
      });
    });

    it('should allow editing description in review step', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Original description',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '1semana' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const textarea = screen.getByDisplayValue('Original description');
      await user.clear(textarea);
      await user.type(textarea, 'Updated description');
      
      expect(textarea).toHaveValue('Updated description');
    });

    it('should show urgency selection buttons', async () => {
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hoje')).toBeInTheDocument();
        expect(screen.getByText('Amanhã')).toBeInTheDocument();
        expect(screen.getByText('Em 3 dias')).toBeInTheDocument();
        expect(screen.getByText('Em 1 semana')).toBeInTheDocument();
      });
    });

    it('should allow changing urgency', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const urgencyButton = screen.getByRole('button', { name: /Hoje/ });
      await user.click(urgencyButton);
      
      expect(urgencyButton).toHaveClass('bg-blue-600');
    });

    it('should show job mode selection', async () => {
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText('Leilão')).toBeInTheDocument();
      });
    });

    it('should allow selecting Normal job mode', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const normalButton = screen.getByRole('button', { name: /Normal/ });
      await user.click(normalButton);
      
      expect(normalButton.parentElement).toHaveClass('bg-blue-50');
    });

    it('should allow selecting Leilão job mode', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const leilaoButton = screen.getByRole('button', { name: /Leilão/ });
      await user.click(leilaoButton);
      
      expect(leilaoButton.parentElement).toHaveClass('bg-orange-50');
    });

    it('should show auction duration options when Leilão selected', async () => {
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
        jobMode: 'leilao' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('24 Horas')).toBeInTheDocument();
        expect(screen.getByText('48 Horas')).toBeInTheDocument();
        expect(screen.getByText('72 Horas')).toBeInTheDocument();
      });
    });

    it('should allow selecting auction duration', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
        jobMode: 'leilao' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const durationButton = await screen.findByRole('button', { name: /48 Horas/ });
      await user.click(durationButton);
      
      expect(durationButton).toHaveClass('bg-orange-600');
    });

    it('should have working Cancel button', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have working Publish button', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test service',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const publishButton = screen.getByTestId('wizard-publish-button');
      await user.click(publishButton);
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should show correct button text for auction mode', async () => {
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
        jobMode: 'leilao' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-publish-button')).toHaveTextContent('Publicar Leilão');
      });
    });

    it('should show "Publicar Job" button text for normal mode', async () => {
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
        jobMode: 'normal' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-publish-button')).toHaveTextContent('Publicar Job');
      });
    });
  });

  // Initial Prompt Tests
  describe('Initial Prompt Mode', () => {
    it('should skip to loading when initialPrompt provided', async () => {
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialPrompt="Preciso reformar meu banheiro"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('should auto-analyze initialPrompt', async () => {
      const geminiService = await import('../services/geminiService');
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialPrompt="Preciso de um eletricista"
        />
      );
      
      await waitFor(() => {
        expect(geminiService.enhanceJobRequest).toHaveBeenCalledWith('Preciso de um eletricista', undefined, undefined);
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
        );
      }).not.toThrow();
    });

    it('should handle null initial values', () => {
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={undefined}
        />
      );
      
      expect(screen.getByText('Assistente de Criação de Job')).toBeInTheDocument();
    });

    it('should maintain state between transitions', async () => {
      const user = userEvent.setup();
      render(
        <AIJobRequestWizard onClose={mockOnClose} onSubmit={mockOnSubmit} />
      );
      
      const textarea = screen.getByPlaceholderText(/Descreva sua necessidade/);
      const testText = 'Preciso de um serviço de limpeza profissional';
      await user.type(textarea, testText);
      
      const analyzeButton = screen.getByTestId('wizard-analyze-button');
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        const reviewDescription = screen.getByDisplayValue(/Enhanced description/);
        expect(reviewDescription).toBeInTheDocument();
      });
    });

    it('should submit job data for normal mode', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Preciso de um encanador',
        category: 'encanaria',
        serviceType: 'personalizado' as const,
        urgency: 'hoje' as const,
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const publishButton = screen.getByTestId('wizard-publish-button');
      await user.click(publishButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should include address in submission', async () => {
      const user = userEvent.setup();
      const initialData = {
        description: 'Test',
        category: 'reparos',
        serviceType: 'personalizado' as const,
        urgency: '3dias' as const,
        address: 'Rua das Flores, 123',
      };
      
      render(
        <AIJobRequestWizard 
          onClose={mockOnClose} 
          onSubmit={mockOnSubmit}
          initialData={initialData}
        />
      );
      
      const publishButton = screen.getByTestId('wizard-publish-button');
      await user.click(publishButton);
      
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
});
