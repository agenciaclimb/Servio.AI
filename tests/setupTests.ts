// Setup global para testes
// Este arquivo é carregado antes de cada teste (via vitest.config.ts)
// 
// NOTA: Não adicione vi.mock() aqui pois eles precisam ser hoisted e podem
// conflitar com mocks específicos de cada teste.
// 
// Use este arquivo apenas para:
// - Configurações globais
// - Polyfills
// - Setup de ambiente de teste

// Silenciar warnings de console esperados em testes
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Silenciar erros esperados do Firebase em testes
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('PERMISSION_DENIED') ||
      message.includes('Missing or insufficient permissions') ||
      message.includes('Firebase')
    ) {
      return; // Silenciar
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Firebase') || message.includes('Firestore')) {
      return; // Silenciar
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
