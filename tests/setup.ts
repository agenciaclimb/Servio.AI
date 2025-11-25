import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Vitest/jsdom não expõe Notification por padrão, então mockamos o básico para destravar fluxos Prospector
if (typeof globalThis.Notification === 'undefined') {
  class NotificationMock {
    static permission: NotificationPermission = 'granted';
    title: string;
    options?: NotificationOptions;

    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.options = options;
    }

    static async requestPermission(): Promise<NotificationPermission> {
      return NotificationMock.permission;
    }

    close() {
      /* noop */
    }
  }

  (globalThis as any).Notification = NotificationMock;
}

// Mock MSW server if not available
let server: any;
try {
  const mswModule = await import('./msw/server');
  server = mswModule.server;
} catch {
  server = { listen: vi.fn(), close: vi.fn(), resetHandlers: vi.fn() };
}

// Silenciar warnings/erros ruidosos e esperados em testes
const originalWarn = console.warn;
const originalError = console.error;

const shouldSilenceMsg = (msg: string) =>
  (
    // Fallbacks e mocks esperados
    msg.includes('Failed to fetch') ||
    msg.includes('using mock data') ||
    msg.includes('Fallback heuristic used') ||
    msg.includes('AI matching failed, using basic local matching') ||
    // Warnings de libs durante testes
    msg.includes('not wrapped in act(') ||
    msg.includes('React Router Future Flag Warning') ||
  msg.includes('ReactDOMTestUtils.act is deprecated') ||
  msg.includes('ReactDOMTestUtils.act') ||
    // Firebase Messaging em ambiente de teste/jsdom
    msg.includes('Messaging not supported in this browser')
  );

const shouldSilenceArgs = (args: any[]) => {
  try {
    for (const a of args) {
      // Verifica string direta
      if (typeof a === 'string' && shouldSilenceMsg(a)) return true;
      // Verifica Error com message
      if (a && typeof a === 'object' && typeof a.message === 'string' && shouldSilenceMsg(a.message)) {
        return true;
      }
      // Tenta serializar objetos simples
      if (a && typeof a === 'object') {
        const maybe = (() => {
          try { return JSON.stringify(a); } catch { return undefined; }
        })();
        if (maybe && shouldSilenceMsg(maybe)) return true;
      }
    }
  } catch {
    // ignora erros na filtragem
  }
  return false;
};

console.warn = (...args: any[]) => {
  if (shouldSilenceArgs(args)) return;
  originalWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  if (shouldSilenceArgs(args)) return;
  originalError.apply(console, args);
};

// MSW opcional: ativar apenas se ENABLE_MSW estiver definido no global para não afetar spies de fetch.
const mswActive = Boolean((globalThis as any).ENABLE_MSW);
if (mswActive) {
  server.listen({ onUnhandledRequest: 'bypass' });
  (globalThis as any).__MSW_SERVER__ = server;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
  if (mswActive) {
    (globalThis as any).__MSW_SERVER__?.resetHandlers();
  }
});
// Vitest não oferece afterAll aqui sem import; se mswActive, fechar em process.on('exit')
if (mswActive) {
  process.on('exit', () => {
    (globalThis as any).__MSW_SERVER__?.close();
  });
}
