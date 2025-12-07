/**
 * Error Messages - Mapeia códigos de erro estruturados para mensagens amigáveis
 *
 * Uso:
 * ```typescript
 * try {
 *   await apiCall('/endpoint', options);
 * } catch (error) {
 *   const message = getErrorMessage(error as ApiError);
 *   showToast(message, 'error');
 * }
 * ```
 */

import { ApiError } from './api';

export interface ErrorMessageConfig {
  title: string;
  message: string;
  action?: string;
  icon?: '⚠️' | '🔒' | '❌' | '⏱️' | '🔍' | 'ℹ️';
}

/**
 * Catálogo de mensagens de erro amigáveis
 */
const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  // Erros de rede
  E_NETWORK: {
    title: 'Sem conexão',
    message:
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
    action: 'Tentar novamente',
    icon: '⚠️',
  },

  // Timeout
  E_TIMEOUT: {
    title: 'Tempo esgotado',
    message: 'A operação demorou muito tempo. Por favor, tente novamente.',
    action: 'Tentar novamente',
    icon: '⏱️',
  },

  // Autenticação
  E_AUTH: {
    title: 'Não autorizado',
    message: 'Sua sessão expirou. Por favor, faça login novamente.',
    action: 'Fazer login',
    icon: '🔒',
  },

  // Recurso não encontrado
  E_NOT_FOUND: {
    title: 'Não encontrado',
    message: 'O recurso solicitado não foi encontrado.',
    action: 'Voltar',
    icon: '🔍',
  },

  // Erro do servidor
  E_SERVER: {
    title: 'Erro no servidor',
    message: 'Ocorreu um erro no servidor. Estamos trabalhando para resolver.',
    action: 'Tentar mais tarde',
    icon: '❌',
  },

  // Erro desconhecido
  E_UNKNOWN: {
    title: 'Erro inesperado',
    message: 'Algo deu errado. Por favor, tente novamente ou entre em contato com o suporte.',
    action: 'Tentar novamente',
    icon: 'ℹ️',
  },
};

/**
 * Mensagens específicas por contexto
 */
const CONTEXT_MESSAGES: Record<string, Record<string, string>> = {
  profile: {
    E_NETWORK: 'Não foi possível carregar seu perfil. Verifique sua conexão.',
    E_TIMEOUT: 'Demoramos muito para carregar seu perfil. Tente novamente.',
    E_SERVER: 'Erro ao salvar seu perfil. Tente novamente em alguns instantes.',
  },

  payment: {
    E_NETWORK: 'Não foi possível processar o pagamento. Verifique sua conexão.',
    E_AUTH: 'Você precisa estar logado para realizar pagamentos.',
    E_SERVER: 'Erro ao processar pagamento. Seu cartão não foi cobrado.',
  },

  job: {
    E_NETWORK: 'Não foi possível criar o serviço. Verifique sua conexão.',
    E_TIMEOUT: 'A criação do serviço demorou muito. Tente novamente.',
    E_SERVER: 'Erro ao criar serviço. Por favor, tente novamente.',
  },

  proposal: {
    E_NETWORK: 'Não foi possível enviar sua proposta. Verifique sua conexão.',
    E_SERVER: 'Erro ao enviar proposta. Tente novamente.',
  },

  ai: {
    E_TIMEOUT: 'A IA demorou para responder. Usando sugestões básicas.',
    E_SERVER: 'Serviço de IA temporariamente indisponível. Usando sugestões padrão.',
  },
};

/**
 * Extrai mensagem amigável de um ApiError
 *
 * @param error - O erro retornado pela API
 * @param context - Contexto opcional para mensagem mais específica (profile, payment, job, etc)
 * @returns Configuração de mensagem amigável
 */
export function getErrorMessage(
  error: ApiError | Error | unknown,
  context?: string
): ErrorMessageConfig {
  // Se não for ApiError, retorna mensagem genérica
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return ERROR_MESSAGES.E_UNKNOWN;
  }

  const apiError = error as ApiError;
  const code = apiError.code || 'E_UNKNOWN';

  // Se há mensagem específica do contexto, usa ela
  if (context && CONTEXT_MESSAGES[context]?.[code]) {
    return {
      ...ERROR_MESSAGES[code],
      message: CONTEXT_MESSAGES[context][code],
    };
  }

  // Se há detalhes no erro, tenta extrair mensagem mais específica
  if (apiError.details && typeof apiError.details === 'object' && 'error' in apiError.details) {
    const detailMessage = (apiError.details as { error: string }).error;
    return {
      ...ERROR_MESSAGES[code],
      message: detailMessage || ERROR_MESSAGES[code].message,
    };
  }

  // Retorna mensagem padrão do catálogo
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.E_UNKNOWN;
}

/**
 * Formata mensagem de erro para exibição em toast/alert
 *
 * @param error - O erro retornado pela API
 * @param context - Contexto opcional
 * @returns String formatada para exibição
 */
export function formatErrorForToast(error: ApiError | Error | unknown, context?: string): string {
  const config = getErrorMessage(error, context);
  return `${config.icon || '⚠️'} ${config.message}`;
}

/**
 * Verifica se erro é recuperável (retry pode resolver)
 *
 * @param error - O erro retornado pela API
 * @returns true se vale a pena tentar novamente
 */
export function isRecoverableError(error: ApiError | Error | unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const apiError = error as ApiError;
  const recoverableCodes = ['E_NETWORK', 'E_TIMEOUT'];

  return recoverableCodes.includes(apiError.code);
}

/**
 * Sugere ação apropriada para o erro
 *
 * @param error - O erro retornado pela API
 * @returns Ação sugerida (retry, login, contact-support, etc)
 */
export function getErrorAction(
  error: ApiError | Error | unknown
): 'retry' | 'login' | 'back' | 'wait' | 'support' {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return 'support';
  }

  const apiError = error as ApiError;

  switch (apiError.code) {
    case 'E_NETWORK':
    case 'E_TIMEOUT':
      return 'retry';
    case 'E_AUTH':
      return 'login';
    case 'E_NOT_FOUND':
      return 'back';
    case 'E_SERVER':
      return 'wait';
    default:
      return 'support';
  }
}

/**
 * Log estruturado de erro (para monitoramento)
 *
 * @param error - O erro retornado pela API
 * @param context - Contexto da operação
 * @param metadata - Metadados adicionais
 */
export function logError(
  error: ApiError | Error | unknown,
  context: string,
  metadata?: Record<string, unknown>
): void {
  if (!error) return;

  const isApiError = typeof error === 'object' && 'code' in error;
  const apiError = error as ApiError;

  const logData = {
    timestamp: new Date().toISOString(),
    context,
    code: isApiError ? apiError.code : 'UNKNOWN',
    message: (error as Error).message,
    status: isApiError ? apiError.status : undefined,
    details: isApiError ? apiError.details : undefined,
    stack: (error as Error).stack,
    ...metadata,
  };

  // Em desenvolvimento, loga no console
  if (import.meta.env.DEV) {
    console.error('[Error]', logData);
  }

  // Em produção, enviaria para serviço de logging (Sentry, Cloud Logging, etc)
  // if (import.meta.env.PROD) {
  //   sendToLoggingService(logData);
  // }
}

/**
 * Hook de exemplo para usar em componentes React
 * Extrair para hook separado se necessário
 */
export interface UseErrorHandlerOptions {
  context?: string;
  onRetry?: () => void;
  onAuth?: () => void;
}

export function createErrorHandler(options: UseErrorHandlerOptions = {}) {
  return {
    handle: (error: ApiError | Error | unknown) => {
      const message = getErrorMessage(error, options.context);
      const action = getErrorAction(error);

      logError(error, options.context || 'unknown');

      return {
        message,
        action,
        canRetry: isRecoverableError(error),
        onAction: () => {
          switch (action) {
            case 'retry':
              options.onRetry?.();
              break;
            case 'login':
              options.onAuth?.();
              break;
            default:
              break;
          }
        },
      };
    },
  };
}
