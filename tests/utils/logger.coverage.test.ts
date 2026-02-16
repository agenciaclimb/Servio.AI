import { describe, it, expect, vi, afterEach } from 'vitest';
import { logInfo, logError, logWarn } from '../../src/utils/logger';

describe('logger - Coverage Boost', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('logInfo', () => {
    it('logs info message in development', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logInfo('test message', { component: 'TestComponent', action: 'test' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('does not log in production by default', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logInfo('test message');
      
      // Should not log in production unless forced
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logError', () => {
    it('logs error in all environments', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logError('error message', { component: 'TestComponent', severity: 'error' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logWarn', () => {
    it('logs warning message', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      logWarn('warning message', { component: 'test', action: 'warn' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
