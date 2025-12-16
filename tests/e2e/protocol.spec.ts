import { test, expect } from '@playwright/test';

// Suite principal cobrindo 10 passos do ciclo (v4.0)
test.describe('🧪 Protocolo v4.0 — Ciclo completo (10 passos)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header', { timeout: 15000 });
  });

  test('Passo 1: Home acessível e header visível', async ({ page }) => {
    await expect(page).toHaveTitle(/Servio/i);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByTestId('header-login-button')).toBeVisible();
    await expect(page.getByTestId('header-register-button')).toBeVisible();
  });

  test('Passo 2: Abrir modal de autenticação e inputs presentes', async ({ page }) => {
    await page.getByTestId('header-login-button').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
    const inputs = page.locator('input[type="email"], input[type="password"]');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('Passo 3: Trocar para cadastro e validar campo de confirmação', async ({ page }) => {
    await page.getByTestId('header-login-button').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
    await page.getByTestId('auth-modal').getByRole('button', { name: 'Cadastre-se' }).click();
    // Campo de confirmação só aparece em modo cadastro
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('Passo 4: Fechar modal e navegar para "Encontrar Profissionais"', async ({ page }) => {
    await page.getByTestId('header-login-button').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
    await page.getByTestId('auth-modal-close').click();
    await page.getByRole('button', { name: 'Encontrar Profissionais' }).click();
    // Durante carregamento inicial, a página mostra texto de loading
    const loading = page.locator('text=Carregando profissionais…');
    await expect(loading).toBeVisible({ timeout: 5000 });
  });

  test('Passo 5: Navegar para "Loja"', async ({ page }) => {
    await page.getByRole('button', { name: 'Loja' }).click();
    // Verifica que o conteúdo principal segue renderizado
    await expect(page.locator('#root')).toBeVisible();
  });

  test('Passo 6: Verificar responsividade em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header', { timeout: 15000 });
    await expect(page.locator('header')).toBeVisible();
  });

  test('Passo 7: Sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(
      e =>
        !e.includes('favicon') &&
        !e.includes('manifest') &&
        !e.includes('Stripe') &&
        !e.includes('CORS')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Passo 8: Performance de carregamento aceitável', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test('Passo 9: Acessar "Seja um Prestador"', async ({ page }) => {
    await page.getByRole('button', { name: 'Seja um Prestador' }).click();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('Passo 10: Abrir novamente o modal de login via header', async ({ page }) => {
    await page.getByTestId('header-login-button').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
  });
});
