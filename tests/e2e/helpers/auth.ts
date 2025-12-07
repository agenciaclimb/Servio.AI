/**
 * E2E Test Authentication Helper
 * Fornece funções para login/logout em testes Playwright
 * 
 * @see tests/e2e/prospector/crm-kanban.spec.ts - Exemplos de uso
 */

import { Page, expect } from '@playwright/test';

// Credenciais de teste (mocks do Firebase)
const TEST_USERS = {
  provider: {
    email: 'provider@servio.test',
    password: 'TestPassword123!',
    type: 'prestador',
  },
  client: {
    email: 'client@servio.test',
    password: 'TestPassword123!',
    type: 'cliente',
  },
  admin: {
    email: 'admin@servio.test',
    password: 'TestPassword123!',
    type: 'admin',
  },
  prospector: {
    email: 'prospector@servio.test',
    password: 'TestPassword123!',
    type: 'prospector',
  },
};

/**
 * Login como Provider (Prestador de Serviços)
 * @param page - Página Playwright
 * @param email - Email customizado (opcional)
 * @param password - Senha customizada (opcional)
 */
export async function loginAsProvider(
  page: Page,
  email: string = TEST_USERS.provider.email,
  password: string = TEST_USERS.provider.password
): Promise<void> {
  await navigateToLogin(page);
  await fillLoginForm(page, email, password);
  await submitLogin(page);
  
  // Aguardar redirecionamento para provider dashboard
  await page.waitForURL(/\/(dashboard|provider)/, { timeout: 10000 });
  
  // Verificar que estamos autenticado
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Login como Client (Cliente)
 * @param page - Página Playwright
 * @param email - Email customizado (opcional)
 * @param password - Senha customizada (opcional)
 */
export async function loginAsClient(
  page: Page,
  email: string = TEST_USERS.client.email,
  password: string = TEST_USERS.client.password
): Promise<void> {
  await navigateToLogin(page);
  await fillLoginForm(page, email, password);
  await submitLogin(page);
  
  // Aguardar redirecionamento para client dashboard
  await page.waitForURL(/\/(dashboard|jobs)/, { timeout: 10000 });
  
  // Verificar que estamos autenticado
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Login como Admin
 * @param page - Página Playwright
 * @param email - Email customizado (opcional)
 * @param password - Senha customizada (opcional)
 */
export async function loginAsAdmin(
  page: Page,
  email: string = TEST_USERS.admin.email,
  password: string = TEST_USERS.admin.password
): Promise<void> {
  await navigateToLogin(page);
  await fillLoginForm(page, email, password);
  await submitLogin(page);
  
  // Aguardar redirecionamento para admin dashboard
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 });
  
  // Verificar que estamos autenticado
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Login como Prospector (Prospector de Leads)
 * @param page - Página Playwright
 * @param email - Email customizado (opcional)
 * @param password - Senha customizada (opcional)
 */
export async function loginAsProspector(
  page: Page,
  email: string = TEST_USERS.prospector.email,
  password: string = TEST_USERS.prospector.password
): Promise<void> {
  await navigateToLogin(page);
  await fillLoginForm(page, email, password);
  await submitLogin(page);
  
  // Aguardar redirecionamento para prospector dashboard
  await page.waitForURL(/\/(prospector|crm|campaigns)/, { timeout: 10000 });
  
  // Verificar que estamos autenticado
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Fazer logout
 * @param page - Página Playwright
 */
export async function logout(page: Page): Promise<void> {
  // Clicar no menu de usuário
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    
    // Clicar em logout
    const logoutButton = page.locator('[data-testid="logout-button"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  // Aguardar retorno à página de login
  await page.waitForURL(/\/(login|auth)/, { timeout: 5000 });
}

/**
 * Navegar para página de login
 * @param page - Página Playwright
 */
async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'networkidle' });
  
  // Aguardar formulário de login carregar
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Preencher formulário de login
 * @param page - Página Playwright
 * @param email - Email
 * @param password - Senha
 */
async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  // Preencher email
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);
  
  // Preencher senha
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  
  // Aguardar que os campos sejam preenchidos
  await page.waitForTimeout(500);
}

/**
 * Submeter formulário de login
 * @param page - Página Playwright
 */
async function submitLogin(page: Page): Promise<void> {
  // Clicar no botão de login
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Aguardar que o login seja processado
  // (não aguarda navegação aqui, deixa para a função chamadora)
  await page.waitForTimeout(1000);
}

/**
 * Aguardar redirecionamento após autenticação
 * @param page - Página Playwright
 * @param expectedUrl - URL esperada (regex ou string)
 */
export async function waitForAuthRedirect(
  page: Page,
  expectedUrl: string | RegExp = /\/(dashboard|provider|client|prospector)/
): Promise<void> {
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

/**
 * Verificar se usuário está autenticado
 * @param page - Página Playwright
 * @returns boolean - True se autenticado
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  try {
    const userMenu = page.locator('[data-testid="user-menu"]');
    return await userMenu.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

/**
 * Esperar que a página esteja completamente carregada
 * Usa networkidle para garantir que todas as requisições completaram
 * @param page - Página Playwright
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Buffer adicional
}

/**
 * Limpar localStorage e sessionStorage (logout programático)
 * Útil para resetar estado entre testes
 * @param page - Página Playwright
 */
export async function clearAuthStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Definir auth token diretamente (para testes que precisam bypass do login UI)
 * @param page - Página Playwright
 * @param token - Token de autenticação
 * @param userId - ID do usuário
 */
export async function setAuthToken(page: Page, token: string, userId: string): Promise<void> {
  await page.evaluate(
    ({ token, userId }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
    },
    { token, userId }
  );
}

/**
 * Obter token de autenticação do localStorage
 * @param page - Página Playwright
 * @returns Token ou null
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('authToken');
  });
}

/**
 * Resetar para estado de não-autenticado
 * Limpa localStorage, sessionStorage e volta para /
 * @param page - Página Playwright
 */
export async function resetAuthState(page: Page): Promise<void> {
  await clearAuthStorage(page);
  await page.goto('/', { waitUntil: 'networkidle' });
}

export { TEST_USERS };
