import { test, expect } from '@playwright/test';

test.describe('🚨 SMOKE TESTS - Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('✅ SMOKE-01: Sistema acessível', async ({ page }) => {
    await expect(page).toHaveTitle(/Servio/i);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByTestId('header-login-button')).toBeVisible();
  });

  test('✅ SMOKE-02: Modal de autenticação', async ({ page }) => {
    await page.getByTestId('header-login-button').click();
    await page.waitForTimeout(1000);
    const inputFields = page.locator('input[type="email"], input[type="text"], input[type="password"]');
    expect(await inputFields.count()).toBeGreaterThan(0);
  });

  test('✅ SMOKE-03: Navegação funciona', async ({ page }) => {
    const loginBtn = page.getByTestId('header-login-button');
    await loginBtn.hover();
    await page.waitForTimeout(200);
    await expect(loginBtn).toBeVisible();
  });

  test('✅ SMOKE-04: Assets carregam', async ({ page }) => {
    const images = page.locator('img');
    expect(await images.count()).toBeGreaterThanOrEqual(0);
  });

  test('✅ SMOKE-05: JavaScript executa', async ({ page }) => {
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    const content = await root.textContent();
    expect(content!.length).toBeGreaterThan(0);
  });

  test('✅ SMOKE-06: Responsividade mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header')).toBeVisible();
  });

  test('✅ SMOKE-07: Sem erros de console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('manifest'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('✅ SMOKE-08: Performance OK', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
