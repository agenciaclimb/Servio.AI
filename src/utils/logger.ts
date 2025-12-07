/**
 * Logger utility for error and diagnostic logging
 */

export interface LogContext {
  component?: string;
  action?: string;
  timestamp?: Date;
  severity?: 'info' | 'warn' | 'error';
}

export function logError(message: string, context?: LogContext): void {
  const prefix = context?.component ? `[${context.component}]` : '';
  const timestamp = context?.timestamp ? `${context.timestamp.toISOString()}` : new Date().toISOString();
  console.error(`${timestamp} ${prefix} ERROR: ${message}`, context);
}

export function logWarn(message: string, context?: LogContext): void {
  const prefix = context?.component ? `[${context.component}]` : '';
  const timestamp = context?.timestamp ? `${context.timestamp.toISOString()}` : new Date().toISOString();
  console.warn(`${timestamp} ${prefix} WARN: ${message}`, context);
}

export function logInfo(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context?.component ? `[${context.component}]` : '';
    const timestamp = context?.timestamp ? `${context.timestamp.toISOString()}` : new Date().toISOString();
    console.log(`${timestamp} ${prefix} INFO: ${message}`, context);
  }
}
