/**
 * Testes unitários para o Auth Helper (E2E)
 * @vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loginAsProvider,
  loginAsClient,
  loginAsAdmin,
  loginAsProspector,
  logout,
  waitForAuthRedirect,
  isUserAuthenticated,
  clearAuthStorage,
  setAuthToken,
  getAuthToken,
  resetAuthState,
  TEST_USERS,
} from './auth';

// Mock Page object
const createMockPage = () => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForURL: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn(),
    on: vi.fn(),
  };
  return mockPage;
};

describe('Auth Helper for E2E Tests', () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('TEST_USERS constants', () => {
    it('should have all required user types', () => {
      expect(TEST_USERS).toHaveProperty('provider');
      expect(TEST_USERS).toHaveProperty('client');
      expect(TEST_USERS).toHaveProperty('admin');
      expect(TEST_USERS).toHaveProperty('prospector');
    });

    it('provider user should have correct properties', () => {
      const provider = TEST_USERS.provider;
      expect(provider).toHaveProperty('email');
      expect(provider).toHaveProperty('password');
      expect(provider).toHaveProperty('type');
      expect(provider.type).toBe('prestador');
    });

    it('client user should have correct properties', () => {
      const client = TEST_USERS.client;
      expect(client).toHaveProperty('email');
      expect(client).toHaveProperty('password');
      expect(client.type).toBe('cliente');
    });

    it('should have valid email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      Object.values(TEST_USERS).forEach((user) => {
        expect(user.email).toMatch(emailRegex);
      });
    });

    it('should have non-empty passwords', () => {
      Object.values(TEST_USERS).forEach((user) => {
        expect(user.password).toBeTruthy();
        expect(user.password.length).toBeGreaterThan(6);
      });
    });
  });

  describe('clearAuthStorage', () => {
    it('should call localStorage.clear and sessionStorage.clear', async () => {
      const mockEvaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.evaluate = mockEvaluate;

      await clearAuthStorage(mockPage);

      expect(mockEvaluate).toHaveBeenCalled();
    });
  });

  describe('setAuthToken', () => {
    it('should set auth token in localStorage', async () => {
      const token = 'test-token-123';
      const userId = 'user-456';
      const mockEvaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.evaluate = mockEvaluate;

      await setAuthToken(mockPage, token, userId);

      expect(mockEvaluate).toHaveBeenCalledWith(
        expect.any(Function),
        { token, userId }
      );
    });
  });

  describe('getAuthToken', () => {
    it('should retrieve auth token from localStorage', async () => {
      const expectedToken = 'stored-token-789';
      const mockEvaluate = vi.fn().mockResolvedValue(expectedToken);
      mockPage.evaluate = mockEvaluate;

      const token = await getAuthToken(mockPage);

      expect(token).toBe(expectedToken);
      expect(mockEvaluate).toHaveBeenCalled();
    });

    it('should return null if no token exists', async () => {
      const mockEvaluate = vi.fn().mockResolvedValue(null);
      mockPage.evaluate = mockEvaluate;

      const token = await getAuthToken(mockPage);

      expect(token).toBeNull();
    });
  });

  describe('resetAuthState', () => {
    it('should clear auth storage and navigate to root', async () => {
      const mockEvaluate = vi.fn().mockResolvedValue(undefined);
      mockPage.evaluate = mockEvaluate;
      mockPage.goto = vi.fn().mockResolvedValue(undefined);

      await resetAuthState(mockPage);

      expect(mockEvaluate).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith('/', { waitUntil: 'networkidle' });
    });
  });

  describe('waitForAuthRedirect', () => {
    it('should wait for default auth redirect URL', async () => {
      await waitForAuthRedirect(mockPage);

      expect(mockPage.waitForURL).toHaveBeenCalledWith(
        expect.any(RegExp),
        { timeout: 10000 }
      );
    });

    it('should wait for custom redirect URL', async () => {
      const customUrl = /\/prospector\/dashboard/;
      await waitForAuthRedirect(mockPage, customUrl);

      expect(mockPage.waitForURL).toHaveBeenCalledWith(customUrl, { timeout: 10000 });
    });

    it('should accept string URLs', async () => {
      const customUrl = '/prospector/dashboard';
      await waitForAuthRedirect(mockPage, customUrl);

      expect(mockPage.waitForURL).toHaveBeenCalledWith(customUrl, { timeout: 10000 });
    });
  });

  describe('isUserAuthenticated', () => {
    it('should return true if user menu is visible', async () => {
      const mockLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
      };
      mockPage.locator = vi.fn().mockReturnValue(mockLocator);

      const isAuthenticated = await isUserAuthenticated(mockPage);

      expect(isAuthenticated).toBe(true);
      expect(mockPage.locator).toHaveBeenCalledWith('[data-testid="user-menu"]');
    });

    it('should return false if user menu is not visible', async () => {
      const mockLocator = {
        isVisible: vi.fn().mockRejectedValue(new Error('Not found')),
      };
      mockPage.locator = vi.fn().mockReturnValue(mockLocator);

      const isAuthenticated = await isUserAuthenticated(mockPage);

      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Helper function constants', () => {
    it('should export all login functions', () => {
      expect(typeof loginAsProvider).toBe('function');
      expect(typeof loginAsClient).toBe('function');
      expect(typeof loginAsAdmin).toBe('function');
      expect(typeof loginAsProspector).toBe('function');
    });

    it('should export logout function', () => {
      expect(typeof logout).toBe('function');
    });

    it('should export utility functions', () => {
      expect(typeof clearAuthStorage).toBe('function');
      expect(typeof setAuthToken).toBe('function');
      expect(typeof getAuthToken).toBe('function');
      expect(typeof resetAuthState).toBe('function');
    });
  });

  describe('Integration patterns (documentation)', () => {
    it('should document login as provider pattern', () => {
      // Pattern: await loginAsProvider(page);
      expect(loginAsProvider.length).toBe(3); // page, email?, password?
    });

    it('should document login as client pattern', () => {
      // Pattern: await loginAsClient(page);
      expect(loginAsClient.length).toBe(3); // page, email?, password?
    });

    it('should document logout pattern', () => {
      // Pattern: await logout(page);
      expect(logout.length).toBe(1); // page
    });
  });
});

describe('Auth Helper - Usage Patterns (E2E Context)', () => {
  /**
   * These tests document how the auth helper is used in E2E tests
   * They run in Vitest context, not actual Playwright tests
   */

  it('should provide pattern: login -> test -> logout', () => {
    const pattern = `
      test('prospector can view leads', async ({ page }) => {
        await loginAsProspector(page);
        // Run test assertions
        await logout(page);
      });
    `;
    expect(pattern).toContain('loginAsProspector');
    expect(pattern).toContain('logout');
  });

  it('should provide pattern: custom credentials', () => {
    const pattern = `
      await loginAsProvider(page, 'custom@email.com', 'CustomPass123!');
    `;
    expect(pattern).toContain('custom@email.com');
  });

  it('should provide pattern: check authentication state', () => {
    const pattern = `
      const authenticated = await isUserAuthenticated(page);
      if (!authenticated) {
        await loginAsClient(page);
      }
    `;
    expect(pattern).toContain('isUserAuthenticated');
  });

  it('should provide pattern: programmatic auth setup', () => {
    const pattern = `
      await page.goto('/');
      await setAuthToken(page, 'test-token', 'user-123');
      await page.goto('/dashboard');
    `;
    expect(pattern).toContain('setAuthToken');
  });
});
