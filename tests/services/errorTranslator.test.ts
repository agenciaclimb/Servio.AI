import { describe, it, expect } from 'vitest';
import {
  translateApiError,
  getProfileErrorMessage,
  getPaymentErrorMessage,
  getAIErrorMessage,
  formatErrorForToast,
  canRetryError,
  getErrorAction,
} from '../../services/errorTranslator';
import type { ApiError } from '../../services/api';

describe('Error Translator', () => {
  describe('translateApiError', () => {
    describe('Error genérico (não ApiError)', () => {
      it('deve traduzir Error padrão', () => {
        const error = new Error('Generic error');
        const result = translateApiError(error);
        
        expect(result.title).toBe('Erro Inesperado');
        expect(result.message).toBe('Ocorreu um erro inesperado. Por favor, tente novamente.');
        expect(result.action).toBe('Tente novamente em alguns instantes');
        expect(result.canRetry).toBe(true);
      });

      it('deve ter estrutura UserFriendlyError', () => {
        const error = new Error('Test');
        const result = translateApiError(error);
        
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('action');
        expect(result).toHaveProperty('canRetry');
      });
    });

    describe('E_NETWORK', () => {
      it('deve traduzir erro de rede', () => {
        const error: ApiError = {
          code: 'E_NETWORK',
          message: 'Network error',
          status: 0,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Sem Conexão');
        expect(result.message).toContain('conectar ao servidor');
        expect(result.message).toContain('conexão com a internet');
        expect(result.action).toContain('Verifique sua conexão');
        expect(result.canRetry).toBe(true);
      });
    });

    describe('E_TIMEOUT', () => {
      it('deve traduzir erro de timeout', () => {
        const error: ApiError = {
          code: 'E_TIMEOUT',
          message: 'Timeout',
          status: 408,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Tempo Esgotado');
        expect(result.message).toContain('demorou muito');
        expect(result.message).toContain('sobrecarregado');
        expect(result.action).toContain('Aguarde');
        expect(result.canRetry).toBe(true);
      });
    });

    describe('E_AUTH', () => {
      it('deve traduzir erro de autenticação', () => {
        const error: ApiError = {
          code: 'E_AUTH',
          message: 'Unauthorized',
          status: 401,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Sessão Expirada');
        expect(result.message).toContain('sessão expirou');
        expect(result.message).toContain('login novamente');
        expect(result.action).toBe('Fazer login novamente');
        expect(result.canRetry).toBe(false);
      });
    });

    describe('E_NOT_FOUND', () => {
      it('deve traduzir erro 404 sem detalhes', () => {
        const error: ApiError = {
          code: 'E_NOT_FOUND',
          message: 'Not found',
          status: 404,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Não Encontrado');
        expect(result.message).toContain('não foi encontrado');
        expect(result.message).toContain('removido ou movido');
        expect(result.action).toContain('Verifique');
        expect(result.canRetry).toBe(false);
      });

      it('deve usar mensagem customizada se fornecida em details', () => {
        const error: ApiError = {
          code: 'E_NOT_FOUND',
          message: 'Not found',
          status: 404,
          details: { message: 'Usuário não encontrado' },
        };
        const result = translateApiError(error);
        
        expect(result.message).toBe('Usuário não encontrado');
      });

      it('deve usar mensagem genérica para status diferente de 404', () => {
        const error: ApiError = {
          code: 'E_NOT_FOUND',
          message: 'Not found',
          status: 410, // Gone
        };
        const result = translateApiError(error);
        
        expect(result.message).toBe('Não foi possível encontrar a informação solicitada.');
      });
    });

    describe('E_SERVER', () => {
      it('deve traduzir erro de servidor sem detalhes', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Server error',
          status: 500,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Erro no Servidor');
        expect(result.message).toContain('Erro interno no servidor');
        expect(result.action).toContain('Tente novamente');
        expect(result.canRetry).toBe(true);
      });

      it('deve usar mensagem de details.error se disponível', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Server error',
          status: 500,
          details: { error: 'Database connection failed' },
        };
        const result = translateApiError(error);
        
        expect(result.message).toBe('Database connection failed');
      });

      it('deve usar mensagem de details.message se error não disponível', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Server error',
          status: 500,
          details: { message: 'Custom server message' },
        };
        const result = translateApiError(error);
        
        expect(result.message).toBe('Custom server message');
      });

      it('deve traduzir erro 400 (bad request)', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Bad request',
          status: 400,
        };
        const result = translateApiError(error);
        
        expect(result.message).toContain('dados enviados estão incorretos');
      });

      it('deve traduzir erro 409 (conflict)', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Conflict',
          status: 409,
        };
        const result = translateApiError(error);
        
        expect(result.message).toContain('conflita com dados existentes');
      });

      it('deve traduzir erro 503 (service unavailable)', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Service unavailable',
          status: 503,
        };
        const result = translateApiError(error);
        
        expect(result.message).toContain('temporariamente indisponível');
      });

      it('deve usar mensagem genérica para status desconhecido', () => {
        const error: ApiError = {
          code: 'E_SERVER',
          message: 'Server error',
          status: 502, // Bad Gateway
        };
        const result = translateApiError(error);
        
        expect(result.message).toBe('Ocorreu um erro no servidor. Por favor, tente novamente.');
      });
    });

    describe('E_UNKNOWN', () => {
      it('deve traduzir erro desconhecido', () => {
        const error: ApiError = {
          code: 'E_UNKNOWN',
          message: 'Unknown error',
          status: 500,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Erro Desconhecido');
        expect(result.message).toContain('erro inesperado');
        expect(result.message).toContain('equipe foi notificada');
        expect(result.action).toContain('suporte');
        expect(result.canRetry).toBe(true);
      });

      it('deve usar default para código não reconhecido', () => {
        const error: ApiError = {
          code: 'E_CUSTOM_CODE' as any,
          message: 'Custom error',
          status: 500,
        };
        const result = translateApiError(error);
        
        expect(result.title).toBe('Erro Desconhecido');
      });
    });
  });

  describe('getProfileErrorMessage', () => {
    it('deve contextualizar mensagem para erro de rede no perfil', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const message = getProfileErrorMessage(error);
      
      expect(message).toBe('Não foi possível salvar seu perfil. Verifique sua conexão.');
    });

    it('deve contextualizar mensagem para timeout no perfil', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      const message = getProfileErrorMessage(error);
      
      expect(message).toBe('O salvamento do perfil está demorando. Tente novamente.');
    });

    it('deve contextualizar mensagem para auth no perfil', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      const message = getProfileErrorMessage(error);
      
      expect(message).toBe('Sua sessão expirou. Faça login para salvar o perfil.');
    });

    it('deve usar mensagem padrão para outros erros', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
      };
      const message = getProfileErrorMessage(error);
      
      expect(message).toContain('Erro interno no servidor');
    });

    it('deve lidar com Error genérico', () => {
      const error = new Error('Generic error');
      const message = getProfileErrorMessage(error);
      
      expect(message).toBe('Ocorreu um erro inesperado. Por favor, tente novamente.');
    });
  });

  describe('getPaymentErrorMessage', () => {
    it('deve contextualizar mensagem para erro de rede no pagamento', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toBe('Não foi possível processar o pagamento. Verifique sua conexão.');
    });

    it('deve contextualizar mensagem para timeout no pagamento', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toContain('processamento do pagamento está demorando');
    });

    it('deve contextualizar mensagem para auth no pagamento', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toBe('Sua sessão expirou. Faça login para continuar o pagamento.');
    });

    it('deve detectar erro do Stripe', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Payment failed',
        status: 500,
        details: { error: 'Stripe card declined' },
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toBe('Erro ao processar pagamento. Verifique seus dados de pagamento.');
    });

    it('deve usar mensagem padrão para erro de servidor sem Stripe', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { error: 'Database error' },
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toBe('Database error');
    });

    it('deve usar mensagem padrão para outros erros', () => {
      const error: ApiError = {
        code: 'E_UNKNOWN',
        message: 'Unknown error',
        status: 500,
      };
      const message = getPaymentErrorMessage(error);
      
      expect(message).toContain('erro inesperado');
    });

    it('deve lidar com Error genérico', () => {
      const error = new Error('Generic error');
      const message = getPaymentErrorMessage(error);
      
      expect(message).toBe('Ocorreu um erro inesperado. Por favor, tente novamente.');
    });
  });

  describe('getAIErrorMessage', () => {
    it('deve contextualizar mensagem para erro de rede na IA', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const message = getAIErrorMessage(error);
      
      expect(message).toBe('Não foi possível obter sugestões da IA. Verifique sua conexão.');
    });

    it('deve contextualizar mensagem para timeout na IA', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      const message = getAIErrorMessage(error);
      
      expect(message).toBe('A IA está demorando para responder. Tente novamente.');
    });

    it('deve contextualizar mensagem para erro de servidor na IA', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
      };
      const message = getAIErrorMessage(error);
      
      expect(message).toBe('O serviço de IA está temporariamente indisponível. Tente novamente em breve.');
    });

    it('deve usar mensagem padrão para outros erros', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      const message = getAIErrorMessage(error);
      
      expect(message).toBe('Não foi possível obter sugestões da IA neste momento.');
    });

    it('deve lidar com Error genérico', () => {
      const error = new Error('Generic error');
      const message = getAIErrorMessage(error);
      
      expect(message).toBe('Não foi possível obter sugestões da IA neste momento.');
    });
  });

  describe('formatErrorForToast', () => {
    it('deve formatar erro de rede com variant warning', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const result = formatErrorForToast(error);
      
      expect(result.title).toBe('Sem Conexão');
      expect(result.message).toContain('conectar ao servidor');
      expect(result.variant).toBe('warning');
    });

    it('deve formatar timeout com variant warning', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      const result = formatErrorForToast(error);
      
      expect(result.variant).toBe('warning');
    });

    it('deve formatar erro de auth com variant info', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      const result = formatErrorForToast(error);
      
      expect(result.variant).toBe('info');
    });

    it('deve formatar erro de servidor com variant error', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
      };
      const result = formatErrorForToast(error);
      
      expect(result.variant).toBe('error');
    });

    it('deve formatar erro desconhecido com variant error', () => {
      const error: ApiError = {
        code: 'E_UNKNOWN',
        message: 'Unknown error',
        status: 500,
      };
      const result = formatErrorForToast(error);
      
      expect(result.variant).toBe('error');
    });

    it('deve lidar com Error genérico', () => {
      const error = new Error('Generic error');
      const result = formatErrorForToast(error);
      
      expect(result.title).toBe('Erro Inesperado');
      expect(result.variant).toBe('error');
    });

    it('deve ter estrutura completa', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const result = formatErrorForToast(error);
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('variant');
      expect(['error', 'warning', 'info']).toContain(result.variant);
    });
  });

  describe('canRetryError', () => {
    it('deve retornar true para erro de rede', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      expect(canRetryError(error)).toBe(true);
    });

    it('deve retornar true para timeout', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      expect(canRetryError(error)).toBe(true);
    });

    it('deve retornar false para erro de autenticação', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      expect(canRetryError(error)).toBe(false);
    });

    it('deve retornar false para erro not found', () => {
      const error: ApiError = {
        code: 'E_NOT_FOUND',
        message: 'Not found',
        status: 404,
      };
      expect(canRetryError(error)).toBe(false);
    });

    it('deve retornar true para erro de servidor', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
      };
      expect(canRetryError(error)).toBe(true);
    });

    it('deve retornar true para erro desconhecido', () => {
      const error: ApiError = {
        code: 'E_UNKNOWN',
        message: 'Unknown error',
        status: 500,
      };
      expect(canRetryError(error)).toBe(true);
    });

    it('deve retornar true para Error genérico', () => {
      const error = new Error('Generic error');
      expect(canRetryError(error)).toBe(true);
    });
  });

  describe('getErrorAction', () => {
    it('deve retornar ação para erro de rede', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const action = getErrorAction(error);
      
      expect(action).toBe('Verifique sua conexão e tente novamente');
    });

    it('deve retornar ação para timeout', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 408,
      };
      const action = getErrorAction(error);
      
      expect(action).toBe('Aguarde alguns instantes e tente novamente');
    });

    it('deve retornar ação para auth', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
      };
      const action = getErrorAction(error);
      
      expect(action).toBe('Fazer login novamente');
    });

    it('deve retornar ação para not found', () => {
      const error: ApiError = {
        code: 'E_NOT_FOUND',
        message: 'Not found',
        status: 404,
      };
      const action = getErrorAction(error);
      
      expect(action).toBe('Verifique se a informação está correta');
    });

    it('deve retornar ação para erro de servidor', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
      };
      const action = getErrorAction(error);
      
      expect(action).toBe('Tente novamente em alguns instantes');
    });

    it('deve retornar ação para erro desconhecido', () => {
      const error: ApiError = {
        code: 'E_UNKNOWN',
        message: 'Unknown error',
        status: 500,
      };
      const action = getErrorAction(error);
      
      expect(action).toContain('suporte');
    });

    it('deve retornar ação para Error genérico', () => {
      const error = new Error('Generic error');
      const action = getErrorAction(error);
      
      expect(action).toBe('Tente novamente em alguns instantes');
    });

    it('deve retornar string ou undefined', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
      };
      const action = getErrorAction(error);
      
      expect(typeof action === 'string' || action === undefined).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com ApiError sem status', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: undefined as any,
      };
      const result = translateApiError(error);
      
      expect(result.title).toBe('Erro no Servidor');
    });

    it('deve lidar com ApiError sem details', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: undefined,
      };
      const result = translateApiError(error);
      
      expect(result.message).toContain('Erro interno no servidor');
    });

    it('deve lidar com details vazio', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: {},
      };
      const result = translateApiError(error);
      
      expect(result.message).toContain('Erro interno no servidor');
    });

    it('deve lidar com Error sem message', () => {
      const error = new Error();
      const result = translateApiError(error);
      
      expect(result.title).toBe('Erro Inesperado');
    });

    it('deve preservar estrutura UserFriendlyError em todos os casos', () => {
      const errors: (ApiError | Error)[] = [
        new Error('Test'),
        { code: 'E_NETWORK', message: 'Net', status: 0 },
        { code: 'E_AUTH', message: 'Auth', status: 401 },
        { code: 'E_SERVER', message: 'Server', status: 500 },
      ];

      errors.forEach(error => {
        const result = translateApiError(error);
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('canRetry');
        expect(typeof result.title).toBe('string');
        expect(typeof result.message).toBe('string');
        expect(typeof result.canRetry).toBe('boolean');
      });
    });
  });
});
