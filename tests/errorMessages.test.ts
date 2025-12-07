import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  formatErrorForToast,
  isRecoverableError,
  getErrorAction,
  createErrorHandler,
} from '../services/errorMessages';
import { ApiError } from '../services/api';

describe('errorMessages', () => {
  describe('getErrorMessage', () => {
    it('retorna mensagem correta para E_NETWORK', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      const result = getErrorMessage(error);

      expect(result.title).toBe('Sem conexão');
      expect(result.message).toContain('Verifique sua conexão');
      expect(result.icon).toBe('⚠️');
    });

    it('retorna mensagem correta para E_TIMEOUT', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Timeout',
        code: 'E_TIMEOUT',
      };

      const result = getErrorMessage(error);

      expect(result.title).toBe('Tempo esgotado');
      expect(result.icon).toBe('⏱️');
    });

    it('retorna mensagem correta para E_AUTH', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        code: 'E_AUTH',
        status: 401,
      };

      const result = getErrorMessage(error);

      expect(result.title).toBe('Não autorizado');
      expect(result.message).toContain('sessão expirou');
      expect(result.action).toBe('Fazer login');
    });

    it('usa mensagem contextual quando fornecido', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      const result = getErrorMessage(error, 'payment');

      expect(result.message).toContain('processar o pagamento');
    });

    it('extrai mensagem de details quando disponível', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        code: 'E_SERVER',
        details: { error: 'Proposta já existe para este job' },
      };

      const result = getErrorMessage(error);

      expect(result.message).toBe('Proposta já existe para este job');
    });

    it('retorna E_UNKNOWN para erro não estruturado', () => {
      const error = new Error('Random error');

      const result = getErrorMessage(error);

      expect(result.title).toBe('Erro inesperado');
    });
  });

  describe('formatErrorForToast', () => {
    it('formata erro com ícone para toast', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      const result = formatErrorForToast(error);

      expect(result).toContain('⚠️');
      expect(result).toContain('Verifique sua conexão');
    });

    it('usa contexto para mensagem específica', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        code: 'E_SERVER',
      };

      const result = formatErrorForToast(error, 'profile');

      expect(result).toContain('salvar seu perfil');
    });
  });

  describe('isRecoverableError', () => {
    it('retorna true para E_NETWORK', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('retorna true para E_TIMEOUT', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Timeout',
        code: 'E_TIMEOUT',
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it('retorna false para E_AUTH', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        code: 'E_AUTH',
      };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('retorna false para E_NOT_FOUND', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Not found',
        code: 'E_NOT_FOUND',
      };

      expect(isRecoverableError(error)).toBe(false);
    });

    it('retorna false para erro não estruturado', () => {
      const error = new Error('Random');

      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('getErrorAction', () => {
    it('retorna "retry" para E_NETWORK', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      expect(getErrorAction(error)).toBe('retry');
    });

    it('retorna "retry" para E_TIMEOUT', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Timeout',
        code: 'E_TIMEOUT',
      };

      expect(getErrorAction(error)).toBe('retry');
    });

    it('retorna "login" para E_AUTH', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        code: 'E_AUTH',
      };

      expect(getErrorAction(error)).toBe('login');
    });

    it('retorna "back" para E_NOT_FOUND', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Not found',
        code: 'E_NOT_FOUND',
      };

      expect(getErrorAction(error)).toBe('back');
    });

    it('retorna "wait" para E_SERVER', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        code: 'E_SERVER',
      };

      expect(getErrorAction(error)).toBe('wait');
    });

    it('retorna "support" para erro desconhecido', () => {
      const error = new Error('Random');

      expect(getErrorAction(error)).toBe('support');
    });
  });

  describe('createErrorHandler', () => {
    it('cria handler que retorna mensagem e ação', () => {
      const handler = createErrorHandler({ context: 'payment' });

      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      const result = handler.handle(error);

      expect(result.message.message).toContain('processar o pagamento');
      expect(result.action).toBe('retry');
      expect(result.canRetry).toBe(true);
    });

    it('chama callback de retry quando ação é executada', () => {
      let retryCalled = false;
      const handler = createErrorHandler({
        onRetry: () => {
          retryCalled = true;
        },
      });

      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'E_NETWORK',
      };

      const result = handler.handle(error);
      result.onAction();

      expect(retryCalled).toBe(true);
    });

    it('chama callback de auth quando ação é login', () => {
      let authCalled = false;
      const handler = createErrorHandler({
        onAuth: () => {
          authCalled = true;
        },
      });

      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        code: 'E_AUTH',
      };

      const result = handler.handle(error);
      result.onAction();

      expect(authCalled).toBe(true);
    });
  });
});
