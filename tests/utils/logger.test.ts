import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, logWarn, logInfo } from '../../src/utils/logger';

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('logError', () => {
    it('deve logar erro com mensagem e timestamp', () => {
      logError('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        undefined
      );
      // Verifica formato ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        undefined
      );
    });

    it('deve incluir prefixo do componente quando fornecido', () => {
      logError('Test error', { component: 'TestComponent' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent]'),
        expect.objectContaining({ component: 'TestComponent' })
      );
    });

    it('deve usar timestamp customizado quando fornecido', () => {
      const customDate = new Date('2025-01-15T10:30:00.000Z');
      logError('Test error', { timestamp: customDate, component: 'Auth' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('2025-01-15T10:30:00.000Z'),
        expect.objectContaining({ timestamp: customDate, component: 'Auth' })
      );
    });

    it('deve logar contexto completo', () => {
      const context = {
        component: 'PaymentService',
        action: 'processPayment',
        timestamp: new Date('2025-01-20T14:00:00.000Z'),
        severity: 'error' as const,
      };

      logError('Payment failed', context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PaymentService]'),
        context
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('2025-01-20T14:00:00.000Z'),
        context
      );
    });

    it('deve logar sem contexto quando não fornecido', () => {
      logError('Simple error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Simple error'),
        undefined
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('['),
        undefined
      );
    });
  });

  describe('logWarn', () => {
    it('deve logar warning com mensagem e timestamp', () => {
      logWarn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message'),
        undefined
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        undefined
      );
    });

    it('deve incluir prefixo do componente quando fornecido', () => {
      logWarn('Deprecated API', { component: 'APIClient' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[APIClient]'),
        expect.objectContaining({ component: 'APIClient' })
      );
    });

    it('deve usar timestamp customizado quando fornecido', () => {
      const customDate = new Date('2025-02-10T08:15:30.000Z');
      logWarn('Rate limit approaching', { timestamp: customDate });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('2025-02-10T08:15:30.000Z'),
        expect.objectContaining({ timestamp: customDate })
      );
    });

    it('deve logar contexto completo com severidade', () => {
      const context = {
        component: 'CacheService',
        action: 'invalidateCache',
        severity: 'warn' as const,
      };

      logWarn('Cache miss rate high', context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheService]'),
        context
      );
    });

    it('deve logar sem prefixo quando componente não fornecido', () => {
      logWarn('Generic warning');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Generic warning'),
        undefined
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('['),
        undefined
      );
    });
  });

  describe('logInfo', () => {
    it('deve logar info em ambiente de desenvolvimento', () => {
      process.env.NODE_ENV = 'development';
      logInfo('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message'),
        undefined
      );
    });

    it('não deve logar info em ambiente de produção', () => {
      process.env.NODE_ENV = 'production';
      logInfo('Test info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('não deve logar info em ambiente de teste', () => {
      process.env.NODE_ENV = 'test';
      logInfo('Test info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('deve incluir prefixo e timestamp em desenvolvimento', () => {
      process.env.NODE_ENV = 'development';
      const customDate = new Date('2025-03-01T12:00:00.000Z');

      logInfo('User logged in', { component: 'AuthService', timestamp: customDate });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AuthService]'),
        expect.objectContaining({ component: 'AuthService', timestamp: customDate })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('2025-03-01T12:00:00.000Z'),
        expect.objectContaining({ timestamp: customDate })
      );
    });

    it('deve usar timestamp atual quando não fornecido', () => {
      process.env.NODE_ENV = 'development';
      logInfo('System started');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        undefined
      );
    });

    it('deve logar contexto completo em desenvolvimento', () => {
      process.env.NODE_ENV = 'development';
      const context = {
        component: 'DatabaseService',
        action: 'connect',
        severity: 'info' as const,
      };

      logInfo('Database connected', context);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DatabaseService]'),
        context
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Database connected'),
        context
      );
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com mensagens vazias', () => {
      process.env.NODE_ENV = 'development';
      logError('');
      logWarn('');
      logInfo('');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: '),
        undefined
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: '),
        undefined
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: '),
        undefined
      );
    });

    it('deve lidar com caracteres especiais na mensagem', () => {
      logError('Error: [critical] "payment" failed @ 10:30 - status: 500');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: [critical] "payment" failed @ 10:30 - status: 500'),
        undefined
      );
    });

    it('deve lançar erro com timestamp inválido', () => {
      const invalidDate = new Date('invalid');
      
      // Timestamp inválido causa RangeError no toISOString()
      expect(() => logError('Test error', { timestamp: invalidDate })).toThrow(RangeError);
      expect(() => logError('Test error', { timestamp: invalidDate })).toThrow('Invalid time value');
    });

    it('deve logar múltiplas mensagens em sequência', () => {
      process.env.NODE_ENV = 'development';
      
      logInfo('First message');
      logWarn('Second message');
      logError('Third message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
