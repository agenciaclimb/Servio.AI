import { describe, it, expect } from 'vitest';

// Mock das funções de role (baseado em firestore.rules)
function isAdmin(user: { type?: string } | null): boolean {
  return !!user && user.type === 'admin';
}
function isClient(user: { type?: string } | null): boolean {
  return !!user && user.type === 'cliente';
}
function isProvider(user: { type?: string } | null): boolean {
  return !!user && user.type === 'prestador';
}
function isProspector(user: { type?: string } | null): boolean {
  return !!user && user.type === 'prospector';
}

describe('Funções de Role - Firestore', () => {
  const admin = { email: 'admin@teste.com', type: 'admin' };
  const client = { email: 'cliente@teste.com', type: 'cliente' };
  const provider = { email: 'prestador@teste.com', type: 'prestador' };
  const prospector = { email: 'prospector@teste.com', type: 'prospector' };
  const anon = null;

  it('isAdmin deve retornar true apenas para admin', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(client)).toBe(false);
    expect(isAdmin(provider)).toBe(false);
    expect(isAdmin(prospector)).toBe(false);
    expect(isAdmin(anon)).toBe(false);
  });

  it('isClient deve retornar true apenas para cliente', () => {
    expect(isClient(client)).toBe(true);
    expect(isClient(admin)).toBe(false);
    expect(isClient(provider)).toBe(false);
    expect(isClient(prospector)).toBe(false);
    expect(isClient(anon)).toBe(false);
  });

  it('isProvider deve retornar true apenas para prestador', () => {
    expect(isProvider(provider)).toBe(true);
    expect(isProvider(admin)).toBe(false);
    expect(isProvider(client)).toBe(false);
    expect(isProvider(prospector)).toBe(false);
    expect(isProvider(anon)).toBe(false);
  });

  it('isProspector deve retornar true apenas para prospector', () => {
    expect(isProspector(prospector)).toBe(true);
    expect(isProspector(admin)).toBe(false);
    expect(isProspector(client)).toBe(false);
    expect(isProspector(provider)).toBe(false);
    expect(isProspector(anon)).toBe(false);
  });
});
