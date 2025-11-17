import { describe, it, expect } from 'vitest';
import {
  translateApiError,
  getProfileErrorMessage,
  getPaymentErrorMessage,
  getAIErrorMessage,
  formatErrorForToast,
  canRetryError,
  getErrorAction,
} from '../services/errorTranslator';
import { ApiError } from '../services/api';

describe('errorTranslator', () => {
  describe('translateApiError', () => {
    it('traduz E_NETWORK para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Sem Conexão');
      expect(result.message).toContain('conectar ao servidor');
      expect(result.action).toContain('Verifique sua conexão');
      expect(result.canRetry).toBe(true);
    });

    it('traduz E_TIMEOUT para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 0,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Tempo Esgotado');
      expect(result.message).toContain('demorou muito');
      expect(result.canRetry).toBe(true);
    });

    it('traduz E_AUTH para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Sessão Expirada');
      expect(result.message).toContain('sessão expirou');
      expect(result.action).toContain('login');
      expect(result.canRetry).toBe(false);
    });

    it('traduz E_NOT_FOUND para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_NOT_FOUND',
        message: 'Not found',
        status: 404,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Não Encontrado');
      expect(result.message).toContain('não foi encontrado');
      expect(result.canRetry).toBe(false);
    });

    it('traduz E_SERVER para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Erro no Servidor');
      expect(result.message).toContain('Erro interno');
      expect(result.canRetry).toBe(true);
    });

    it('traduz E_UNKNOWN para mensagem amigável', () => {
      const error: ApiError = {
        code: 'E_UNKNOWN',
        message: 'Unknown error',
        status: 0,
        details: {},
      };

      const result = translateApiError(error);

      expect(result.title).toBe('Erro Desconhecido');
      expect(result.message).toContain('inesperado');
      expect(result.canRetry).toBe(true);
    });

    it('trata erro genérico (não ApiError) com fallback', () => {
      const error = new Error('Generic error');

      const result = translateApiError(error);

      expect(result.title).toBe('Erro Inesperado');
      expect(result.message).toContain('inesperado');
      expect(result.canRetry).toBe(true);
    });

    it('usa mensagem customizada do details quando disponível', () => {
      const error: ApiError = {
        code: 'E_NOT_FOUND',
        message: 'Not found',
        status: 404,
        details: { message: 'Usuário não encontrado no sistema' },
      };

      const result = translateApiError(error);

      expect(result.message).toBe('Usuário não encontrado no sistema');
    });

    it('usa mensagem de erro específica do details para E_SERVER', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 400,
        details: { error: 'CPF inválido' },
      };

      const result = translateApiError(error);

      expect(result.message).toBe('CPF inválido');
    });
  });

  describe('getProfileErrorMessage', () => {
    it('retorna mensagem contextualizada para E_NETWORK', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const message = getProfileErrorMessage(error);

      expect(message).toContain('salvar seu perfil');
      expect(message).toContain('conexão');
    });

    it('retorna mensagem contextualizada para E_TIMEOUT', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 0,
        details: {},
      };

      const message = getProfileErrorMessage(error);

      expect(message).toContain('salvamento do perfil');
      expect(message).toContain('demorando');
    });

    it('retorna mensagem contextualizada para E_AUTH', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      const message = getProfileErrorMessage(error);

      expect(message).toContain('sessão expirou');
      expect(message).toContain('salvar o perfil');
    });

    it('retorna mensagem padrão para outros erros', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: {},
      };

      const message = getProfileErrorMessage(error);

      expect(message).toContain('Erro interno');
    });
  });

  describe('getPaymentErrorMessage', () => {
    it('retorna mensagem contextualizada para E_NETWORK', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const message = getPaymentErrorMessage(error);

      expect(message).toContain('processar o pagamento');
      expect(message).toContain('conexão');
    });

    it('retorna mensagem específica para erro do Stripe', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: { error: 'Stripe: card declined' },
      };

      const message = getPaymentErrorMessage(error);

      expect(message).toContain('processar pagamento');
      expect(message).toContain('dados de pagamento');
    });

    it('retorna mensagem contextualizada para E_AUTH', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      const message = getPaymentErrorMessage(error);

      expect(message).toContain('sessão expirou');
      expect(message).toContain('pagamento');
    });
  });

  describe('getAIErrorMessage', () => {
    it('retorna mensagem contextualizada para E_NETWORK', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const message = getAIErrorMessage(error);

      expect(message).toContain('sugestões da IA');
      expect(message).toContain('conexão');
    });

    it('retorna mensagem contextualizada para E_TIMEOUT', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 0,
        details: {},
      };

      const message = getAIErrorMessage(error);

      expect(message).toContain('IA está demorando');
    });

    it('retorna mensagem contextualizada para E_SERVER', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: {},
      };

      const message = getAIErrorMessage(error);

      expect(message).toContain('serviço de IA');
      expect(message).toContain('temporariamente indisponível');
    });

    it('retorna mensagem padrão para erro genérico', () => {
      const error = new Error('Generic error');

      const message = getAIErrorMessage(error);

      expect(message).toContain('sugestões da IA');
      expect(message).toContain('neste momento');
    });
  });

  describe('formatErrorForToast', () => {
    it('formata erro E_NETWORK como warning', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const result = formatErrorForToast(error);

      expect(result.title).toBe('Sem Conexão');
      expect(result.variant).toBe('warning');
    });

    it('formata erro E_TIMEOUT como warning', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 0,
        details: {},
      };

      const result = formatErrorForToast(error);

      expect(result.title).toBe('Tempo Esgotado');
      expect(result.variant).toBe('warning');
    });

    it('formata erro E_AUTH como info', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      const result = formatErrorForToast(error);

      expect(result.title).toBe('Sessão Expirada');
      expect(result.variant).toBe('info');
    });

    it('formata outros erros como error', () => {
      const error: ApiError = {
        code: 'E_SERVER',
        message: 'Server error',
        status: 500,
        details: {},
      };

      const result = formatErrorForToast(error);

      expect(result.title).toBe('Erro no Servidor');
      expect(result.variant).toBe('error');
    });
  });

  describe('canRetryError', () => {
    it('retorna true para erros recuperáveis (E_NETWORK)', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      expect(canRetryError(error)).toBe(true);
    });

    it('retorna true para erros recuperáveis (E_TIMEOUT)', () => {
      const error: ApiError = {
        code: 'E_TIMEOUT',
        message: 'Timeout',
        status: 0,
        details: {},
      };

      expect(canRetryError(error)).toBe(true);
    });

    it('retorna false para erros não recuperáveis (E_AUTH)', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      expect(canRetryError(error)).toBe(false);
    });

    it('retorna false para erros não recuperáveis (E_NOT_FOUND)', () => {
      const error: ApiError = {
        code: 'E_NOT_FOUND',
        message: 'Not found',
        status: 404,
        details: {},
      };

      expect(canRetryError(error)).toBe(false);
    });
  });

  describe('getErrorAction', () => {
    it('retorna ação sugerida para E_NETWORK', () => {
      const error: ApiError = {
        code: 'E_NETWORK',
        message: 'Network error',
        status: 0,
        details: {},
      };

      const action = getErrorAction(error);

      expect(action).toContain('Verifique sua conexão');
    });

    it('retorna ação sugerida para E_AUTH', () => {
      const error: ApiError = {
        code: 'E_AUTH',
        message: 'Unauthorized',
        status: 401,
        details: {},
      };

      const action = getErrorAction(error);

      expect(action).toContain('login');
    });

    it('retorna ação para erro genérico', () => {
      const error = new Error('Generic error');

      const action = getErrorAction(error);

      expect(action).toBeTruthy();
    });
  });
});
