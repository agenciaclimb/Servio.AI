import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getErrorMessage,
  formatErrorForToast,
  isRecoverableError,
  getErrorAction,
  logError,
  createErrorHandler,
} from '../../services/errorMessages';
import type { ApiError } from '../../services/api';

describe('Error Messages', () => {
  describe('getErrorMessage', () => {
    it('deve retornar mensagem para E_NETWORK', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Sem conexão');
      expect(result.message).toContain('conectar ao servidor');
      expect(result.action).toBe('Tentar novamente');
      expect(result.icon).toBe('⚠️');
    });

    it('deve retornar mensagem para E_TIMEOUT', () => {
      const error: ApiError = { code: 'E_TIMEOUT', message: 'Timeout', status: 408 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Tempo esgotado');
      expect(result.message).toContain('demorou muito tempo');
      expect(result.action).toBe('Tentar novamente');
      expect(result.icon).toBe('⏱️');
    });

    it('deve retornar mensagem para E_AUTH', () => {
      const error: ApiError = { code: 'E_AUTH', message: 'Unauthorized', status: 401 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Não autorizado');
      expect(result.message).toContain('sessão expirou');
      expect(result.action).toBe('Fazer login');
      expect(result.icon).toBe('🔒');
    });

    it('deve retornar mensagem para E_NOT_FOUND', () => {
      const error: ApiError = { code: 'E_NOT_FOUND', message: 'Not found', status: 404 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Não encontrado');
      expect(result.message).toContain('não foi encontrado');
      expect(result.action).toBe('Voltar');
      expect(result.icon).toBe('🔍');
    });

    it('deve retornar mensagem para E_SERVER', () => {
      const error: ApiError = { code: 'E_SERVER', message: 'Server error', status: 500 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Erro no servidor');
      expect(result.message).toContain('erro no servidor');
      expect(result.action).toBe('Tentar mais tarde');
      expect(result.icon).toBe('❌');
    });

    it('deve retornar mensagem para E_UNKNOWN', () => {
      const error: ApiError = { code: 'E_UNKNOWN', message: 'Unknown', status: 500 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Erro inesperado');
      expect(result.message).toContain('Algo deu errado');
      expect(result.action).toBe('Tentar novamente');
      expect(result.icon).toBe('ℹ️');
    });

    it('deve retornar E_UNKNOWN para erro sem código', () => {
      const error = new Error('Generic error');
      const result = getErrorMessage(error);

      expect(result.title).toBe('Erro inesperado');
    });

    it('deve usar mensagem contextual para profile', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'profile');

      expect(result.message).toBe('Não foi possível carregar seu perfil. Verifique sua conexão.');
    });

    it('deve usar mensagem contextual para payment', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'payment');

      expect(result.message).toBe('Não foi possível processar o pagamento. Verifique sua conexão.');
    });

    it('deve usar mensagem contextual para job', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'job');

      expect(result.message).toBe('Não foi possível criar o serviço. Verifique sua conexão.');
    });

    it('deve usar mensagem contextual para proposal', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'proposal');

      expect(result.message).toBe('Não foi possível enviar sua proposta. Verifique sua conexão.');
    });

    it('deve usar mensagem contextual para ai', () => {
      const error: ApiError = { code: 'E_TIMEOUT', message: 'Timeout', status: 408 };
      const result = getErrorMessage(error, 'ai');

      expect(result.message).toBe('A IA demorou para responder. Usando sugestões básicas.');
    });

    it('deve usar mensagem de details.error se disponível', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { error: 'Custom error message from backend' },
      };
      const result = getErrorMessage(error);

      expect(result.message).toBe('Custom error message from backend');
    });

    it('deve fallback para mensagem padrão se details.error vazio', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { error: '' },
      };
      const result = getErrorMessage(error);

      expect(result.message).toContain('erro no servidor');
    });

    it('deve lidar com código desconhecido', () => {
      const error: ApiError = { code: 'E_CUSTOM' as any, message: 'Custom', status: 500 };
      const result = getErrorMessage(error);

      expect(result.title).toBe('Erro inesperado');
    });

    it('deve ter estrutura ErrorMessageConfig completa', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('icon');
    });

    it('deve preservar título e ícone mesmo com contexto', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'profile');

      expect(result.title).toBe('Sem conexão');
      expect(result.icon).toBe('⚠️');
      expect(result.action).toBe('Tentar novamente');
    });

    it('deve lidar com null como erro', () => {
      const result = getErrorMessage(null);

      expect(result.title).toBe('Erro inesperado');
    });

    it('deve lidar com undefined como erro', () => {
      const result = getErrorMessage(undefined);

      expect(result.title).toBe('Erro inesperado');
    });

    it('deve lidar com string como erro', () => {
      const result = getErrorMessage('string error' as any);

      expect(result.title).toBe('Erro inesperado');
    });

    it('deve lidar com contexto inexistente', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = getErrorMessage(error, 'nonexistent_context');

      expect(result.message).toContain('conectar ao servidor'); // mensagem padrão
    });
  });

  describe('formatErrorForToast', () => {
    it('deve formatar mensagem com ícone', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = formatErrorForToast(error);

      expect(result).toContain('⚠️');
      expect(result).toContain('conectar ao servidor');
    });

    it('deve usar ícone padrão se não houver', () => {
      const error: ApiError = { code: 'E_UNKNOWN', message: 'Unknown', status: 500 };
      const result = formatErrorForToast(error);

      expect(result).toContain('ℹ️'); // E_UNKNOWN tem ícone ℹ️
    });

    it('deve incluir mensagem contextual', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = formatErrorForToast(error, 'payment');

      expect(result).toContain('processar o pagamento');
    });

    it('deve retornar string não vazia', () => {
      const error: ApiError = { code: 'E_SERVER', message: 'Server error', status: 500 };
      const result = formatErrorForToast(error);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve formatar erro genérico', () => {
      const error = new Error('Generic error');
      const result = formatErrorForToast(error);

      expect(result).toContain('ℹ️'); // erro genérico → E_UNKNOWN com ℹ️
      expect(result).toContain('Algo deu errado');
    });

    it('deve separar ícone e mensagem com espaço', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = formatErrorForToast(error);

      expect(result).toMatch(/^.+ /); // emoji + espaço (emojis podem ter 2+ chars)
    });
  });

  describe('isRecoverableError', () => {
    it('deve retornar true para E_NETWORK', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar true para E_TIMEOUT', () => {
      const error: ApiError = { code: 'E_TIMEOUT', message: 'Timeout', status: 408 };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('deve retornar false para E_AUTH', () => {
      const error: ApiError = { code: 'E_AUTH', message: 'Unauthorized', status: 401 };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('deve retornar false para E_NOT_FOUND', () => {
      const error: ApiError = { code: 'E_NOT_FOUND', message: 'Not found', status: 404 };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('deve retornar false para E_SERVER', () => {
      const error: ApiError = { code: 'E_SERVER', message: 'Server error', status: 500 };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('deve retornar false para erro sem código', () => {
      const error = new Error('Generic error');

      expect(isRecoverableError(error)).toBe(false);
    });

    it('deve retornar false para null', () => {
      expect(isRecoverableError(null)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isRecoverableError(undefined)).toBe(false);
    });
  });

  describe('getErrorAction', () => {
    it('deve retornar retry para E_NETWORK', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };

      expect(getErrorAction(error)).toBe('retry');
    });

    it('deve retornar retry para E_TIMEOUT', () => {
      const error: ApiError = { code: 'E_TIMEOUT', message: 'Timeout', status: 408 };

      expect(getErrorAction(error)).toBe('retry');
    });

    it('deve retornar login para E_AUTH', () => {
      const error: ApiError = { code: 'E_AUTH', message: 'Unauthorized', status: 401 };

      expect(getErrorAction(error)).toBe('login');
    });

    it('deve retornar back para E_NOT_FOUND', () => {
      const error: ApiError = { code: 'E_NOT_FOUND', message: 'Not found', status: 404 };

      expect(getErrorAction(error)).toBe('back');
    });

    it('deve retornar wait para E_SERVER', () => {
      const error: ApiError = { code: 'E_SERVER', message: 'Server error', status: 500 };

      expect(getErrorAction(error)).toBe('wait');
    });

    it('deve retornar support para código desconhecido', () => {
      const error: ApiError = { code: 'E_CUSTOM' as any, message: 'Custom', status: 500 };

      expect(getErrorAction(error)).toBe('support');
    });

    it('deve retornar support para erro sem código', () => {
      const error = new Error('Generic error');

      expect(getErrorAction(error)).toBe('support');
    });

    it('deve retornar support para null', () => {
      expect(getErrorAction(null)).toBe('support');
    });

    it('deve retornar support para undefined', () => {
      expect(getErrorAction(undefined)).toBe('support');
    });

    it('deve retornar apenas valores permitidos', () => {
      const allowedActions = ['retry', 'login', 'back', 'wait', 'support'];
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const action = getErrorAction(error);

      expect(allowedActions).toContain(action);
    });
  });

  describe('logError', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Simula ambiente DEV
      vi.stubEnv('DEV', true);
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('deve logar ApiError', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };

      logError(error, 'test_context');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.context).toBe('test_context');
      expect(logData.code).toBe('E_NETWORK');
    });

    it('deve logar Error genérico', () => {
      const error = new Error('Generic error');

      logError(error, 'test_context');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.code).toBe('UNKNOWN');
    });

    it('deve incluir timestamp', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };

      logError(error, 'test_context');

      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.timestamp).toBeDefined();
      expect(new Date(logData.timestamp)).toBeInstanceOf(Date);
    });

    it('deve incluir metadata adicional', () => {
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const metadata = { userId: '123', action: 'fetch_profile' };

      logError(error, 'test_context', metadata);

      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.userId).toBe('123');
      expect(logData.action).toBe('fetch_profile');
    });

    it('não deve logar se erro for null', () => {
      logError(null, 'test_context');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('não deve logar se erro for undefined', () => {
      logError(undefined, 'test_context');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve incluir stack trace', () => {
      const error = new Error('Test error');

      logError(error, 'test_context');

      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.stack).toBeDefined();
    });

    it('deve incluir details de ApiError', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { error: 'Database connection failed' },
      };

      logError(error, 'test_context');

      const logData = consoleErrorSpy.mock.calls[0][1];
      expect(logData.details).toEqual({ error: 'Database connection failed' });
    });
  });

  describe('createErrorHandler', () => {
    it('deve criar handler com handle function', () => {
      const handler = createErrorHandler();

      expect(handler).toHaveProperty('handle');
      expect(typeof handler.handle).toBe('function');
    });

    it('deve retornar message e action', () => {
      const handler = createErrorHandler();
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = handler.handle(error);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('action');
      expect(result.action).toBe('retry');
    });

    it('deve retornar canRetry', () => {
      const handler = createErrorHandler();
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = handler.handle(error);

      expect(result.canRetry).toBe(true);
    });

    it('deve usar contexto fornecido', () => {
      const handler = createErrorHandler({ context: 'payment' });
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = handler.handle(error);

      expect(result.message.message).toContain('processar o pagamento');
    });

    it('deve chamar onRetry quando action é retry', () => {
      const onRetry = vi.fn();
      const handler = createErrorHandler({ onRetry });
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = handler.handle(error);

      result.onAction();

      expect(onRetry).toHaveBeenCalled();
    });

    it('deve chamar onAuth quando action é login', () => {
      const onAuth = vi.fn();
      const handler = createErrorHandler({ onAuth });
      const error: ApiError = { code: 'E_AUTH', message: 'Unauthorized', status: 401 };
      const result = handler.handle(error);

      result.onAction();

      expect(onAuth).toHaveBeenCalled();
    });

    it('não deve lançar erro quando callbacks não fornecidos', () => {
      const handler = createErrorHandler();
      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const result = handler.handle(error);

      expect(() => result.onAction()).not.toThrow();
    });

    it('deve lidar com erro genérico', () => {
      const handler = createErrorHandler();
      const error = new Error('Generic error');
      const result = handler.handle(error);

      expect(result.message.title).toBe('Erro inesperado');
      expect(result.canRetry).toBe(false);
    });

    it('onAction não deve fazer nada para action=back', () => {
      const onRetry = vi.fn();
      const onAuth = vi.fn();
      const handler = createErrorHandler({ onRetry, onAuth });
      const error: ApiError = { code: 'E_NOT_FOUND', message: 'Not found', status: 404 };
      const result = handler.handle(error);

      result.onAction();

      expect(onRetry).not.toHaveBeenCalled();
      expect(onAuth).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('getErrorMessage deve lidar com details sem error', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { message: 'Other detail' },
      };
      const result = getErrorMessage(error);

      expect(result.message).toContain('erro no servidor');
    });

    it('formatErrorForToast deve lidar com ícone undefined', () => {
      const error: ApiError = { code: 'E_UNKNOWN', message: 'Unknown', status: 500 };
      const result = formatErrorForToast(error);

      expect(result).toContain('ℹ️'); // E_UNKNOWN tem ℹ️
    });

    it('isRecoverableError deve lidar com código vazio', () => {
      const error: ApiError = { code: '' as any, message: 'Error', status: 500 };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('getErrorAction deve lidar com código vazio', () => {
      const error: ApiError = { code: '' as any, message: 'Error', status: 500 };

      expect(getErrorAction(error)).toBe('support');
    });

    it('logError deve lidar com metadados complexos', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubEnv('DEV', true);

      const error: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const metadata = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        fn: () => {},
      };

      logError(error, 'test_context', metadata);

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('createErrorHandler deve lidar com múltiplas chamadas', () => {
      const handler = createErrorHandler();
      const error1: ApiError = { code: 'E_NETWORK', message: 'Network error', status: 0 };
      const error2: ApiError = { code: 'E_AUTH', message: 'Unauthorized', status: 401 };

      const result1 = handler.handle(error1);
      const result2 = handler.handle(error2);

      expect(result1.action).toBe('retry');
      expect(result2.action).toBe('login');
    });
  });
});
