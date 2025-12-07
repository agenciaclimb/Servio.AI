/**
 * Utilitário para traduzir erros de API em mensagens amigáveis para o usuário
 */

import { ApiError } from './api';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string; // Ação sugerida ao usuário
  canRetry: boolean;
}

/**
 * Traduz ApiError em mensagem amigável em português
 */
export function translateApiError(error: ApiError | Error): UserFriendlyError {
  // Se não for ApiError, trata como erro genérico
  if (!('code' in error)) {
    return {
      title: 'Erro Inesperado',
      message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      action: 'Tente novamente em alguns instantes',
      canRetry: true,
    };
  }

  const apiError = error as ApiError;

  switch (apiError.code) {
    case 'E_NETWORK':
      return {
        title: 'Sem Conexão',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        action: 'Verifique sua conexão e tente novamente',
        canRetry: true,
      };

    case 'E_TIMEOUT':
      return {
        title: 'Tempo Esgotado',
        message: 'A requisição demorou muito para responder. O servidor pode estar sobrecarregado.',
        action: 'Aguarde alguns instantes e tente novamente',
        canRetry: true,
      };

    case 'E_AUTH':
      return {
        title: 'Sessão Expirada',
        message: 'Sua sessão expirou. Por favor, faça login novamente.',
        action: 'Fazer login novamente',
        canRetry: false,
      };

    case 'E_NOT_FOUND':
      return {
        title: 'Não Encontrado',
        message: getNotFoundMessage(apiError),
        action: 'Verifique se a informação está correta',
        canRetry: false,
      };

    case 'E_SERVER':
      return {
        title: 'Erro no Servidor',
        message: getServerErrorMessage(apiError),
        action: 'Tente novamente em alguns instantes',
        canRetry: true,
      };

    case 'E_UNKNOWN':
    default:
      return {
        title: 'Erro Desconhecido',
        message: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.',
        action: 'Tente novamente ou entre em contato com o suporte',
        canRetry: true,
      };
  }
}

/**
 * Mensagem específica para erro 404 baseado no contexto
 */
function getNotFoundMessage(error: ApiError): string {
  const details = error.details as { message?: string } | undefined;

  if (details?.message) {
    return details.message;
  }

  // Mensagens baseadas no status HTTP
  switch (error.status) {
    case 404:
      return 'O recurso solicitado não foi encontrado. Pode ter sido removido ou movido.';
    default:
      return 'Não foi possível encontrar a informação solicitada.';
  }
}

/**
 * Mensagem específica para erro de servidor baseado nos detalhes
 */
function getServerErrorMessage(error: ApiError): string {
  const details = error.details as { error?: string; message?: string } | undefined;

  // Se o backend enviou uma mensagem específica
  if (details?.error) {
    return details.error;
  }

  if (details?.message) {
    return details.message;
  }

  // Mensagens baseadas no status HTTP
  switch (error.status) {
    case 400:
      return 'Os dados enviados estão incorretos. Verifique e tente novamente.';
    case 409:
      return 'Esta ação conflita com dados existentes. Verifique e tente novamente.';
    case 500:
      return 'Erro interno no servidor. Nossa equipe foi notificada.';
    case 503:
      return 'O serviço está temporariamente indisponível. Tente novamente em breve.';
    default:
      return 'Ocorreu um erro no servidor. Por favor, tente novamente.';
  }
}

/**
 * Retorna mensagem de erro específica para contexto de perfil
 */
export function getProfileErrorMessage(error: ApiError | Error): string {
  const { message } = translateApiError(error);

  // Mensagens contextualizadas para perfil
  if ('code' in error) {
    switch (error.code) {
      case 'E_NETWORK':
        return 'Não foi possível salvar seu perfil. Verifique sua conexão.';
      case 'E_TIMEOUT':
        return 'O salvamento do perfil está demorando. Tente novamente.';
      case 'E_AUTH':
        return 'Sua sessão expirou. Faça login para salvar o perfil.';
      default:
        return message;
    }
  }

  return message;
}

/**
 * Retorna mensagem de erro específica para contexto de pagamento
 */
export function getPaymentErrorMessage(error: ApiError | Error): string {
  const { message } = translateApiError(error);

  // Mensagens contextualizadas para pagamento
  if ('code' in error) {
    switch (error.code) {
      case 'E_NETWORK':
        return 'Não foi possível processar o pagamento. Verifique sua conexão.';
      case 'E_TIMEOUT':
        return 'O processamento do pagamento está demorando. Aguarde ou tente novamente.';
      case 'E_AUTH':
        return 'Sua sessão expirou. Faça login para continuar o pagamento.';
      case 'E_SERVER': {
        const details = (error as ApiError).details as { error?: string } | undefined;
        if (details?.error?.includes('Stripe')) {
          return 'Erro ao processar pagamento. Verifique seus dados de pagamento.';
        }
        return message;
      }
      default:
        return message;
    }
  }

  return message;
}

/**
 * Retorna mensagem de erro específica para contexto de IA
 */
export function getAIErrorMessage(error: ApiError | Error): string {
  // Mensagens contextualizadas para IA
  if ('code' in error) {
    switch (error.code) {
      case 'E_NETWORK':
        return 'Não foi possível obter sugestões da IA. Verifique sua conexão.';
      case 'E_TIMEOUT':
        return 'A IA está demorando para responder. Tente novamente.';
      case 'E_SERVER':
        return 'O serviço de IA está temporariamente indisponível. Tente novamente em breve.';
      default:
        return 'Não foi possível obter sugestões da IA neste momento.';
    }
  }

  return 'Não foi possível obter sugestões da IA neste momento.';
}

/**
 * Formata mensagem de erro para exibição em toast/alert
 */
export function formatErrorForToast(error: ApiError | Error): {
  title: string;
  message: string;
  variant: 'error' | 'warning' | 'info';
} {
  const { title, message } = translateApiError(error);

  // Define variante baseada no tipo de erro
  let variant: 'error' | 'warning' | 'info' = 'error';

  if ('code' in error) {
    switch (error.code) {
      case 'E_NETWORK':
      case 'E_TIMEOUT':
        variant = 'warning';
        break;
      case 'E_AUTH':
        variant = 'info';
        break;
    }
  }

  return {
    title,
    message,
    variant,
  };
}

/**
 * Verifica se o erro permite retry
 */
export function canRetryError(error: ApiError | Error): boolean {
  return translateApiError(error).canRetry;
}

/**
 * Retorna sugestão de ação para o usuário
 */
export function getErrorAction(error: ApiError | Error): string | undefined {
  return translateApiError(error).action;
}
