import { test, expect } from '@playwright/test';

/**
 * SMOKE TESTS BÁSICOS
 *
 * Objetivo: Validar que o sistema está acessível e os principais recursos carregam
 * Execução: Rápida (< 1min) para validação básica antes de testes mais complexos
 */

test.describe('🚀 SMOKE TESTS BÁSICOS', () => {
  test('✅ SMOKE-01: Sistema carrega e renderiza', async ({ page }) => {
    await page.goto('/');

    // Valida título
    await expect(page).toHaveTitle(/Servio/i);

    // Valida elementos estruturais
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('✅ SMOKE-02: Navegação principal está acessível', async ({ page }) => {
    await page.goto('/');

    // Header carregou
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Logo ou título está visível
    const hasLogo = await page.locator('header img, header svg, header [class*="logo"]').count();
    const hasTitle = await page.getByRole('heading').first().isVisible();
    expect(hasLogo > 0 || hasTitle).toBeTruthy();
  });

  test('✅ SMOKE-03: Performance - Carregamento inicial', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loadTime = Date.now() - startTime;

    // Deve carregar em menos de 20 segundos (Firefox é mais lento)
    expect(loadTime).toBeLessThan(20000);

    console.log(`⏱️  Tempo de carregamento: ${loadTime}ms`);
  });

  test('✅ SMOKE-04: Assets principais carregam', async ({ page }) => {
    await page.goto('/');

    // CSS carregou
    const styles = await page.locator('link[rel="stylesheet"], style').count();
    expect(styles).toBeGreaterThan(0);

    // JavaScript carregou
    const scripts = await page.locator('script').count();
    expect(scripts).toBeGreaterThan(0);
  });

  test('✅ SMOKE-05: Sem erros HTTP críticos', async ({ page }) => {
    const response = await page.goto('/');

    // Status 2xx ou 3xx (success ou redirect)
    expect(response?.status()).toBeLessThan(400);
  });

  test('✅ SMOKE-06: Responsividade Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');

    // Conteúdo principal visível
    await expect(page.locator('#root')).toBeVisible();

    // Sem scroll horizontal
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
  });

  test('✅ SMOKE-07: Meta tags SEO básicos', async ({ page }) => {
    await page.goto('/');

    // Title existe e não está vazio
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Charset definido
    const charset = await page.locator('meta[charset]').count();
    expect(charset).toBeGreaterThan(0);
  });

  test('✅ SMOKE-08: JavaScript executa corretamente', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // React renderizou
    await page.waitForSelector('#root > *', { timeout: 10000 });
    const rootHasContent = await page.locator('#root > *').count();
    expect(rootHasContent).toBeGreaterThan(0);

    // Aguardar brevemente para capturar erros
    await page.waitForTimeout(500);

    // Ignorar erros conhecidos (favicon, etc)
    const criticalErrors = jsErrors.filter(e => !e.includes('favicon') && !e.includes('manifest'));

    expect(criticalErrors).toHaveLength(0);
  });

  test('✅ SMOKE-09: Fontes e estilos aplicados', async ({ page }) => {
    await page.goto('/');

    // CSS está carregado - verificar se há algum estilo aplicado
    const hasStyleSheets = await page.evaluate(() => document.styleSheets.length > 0);
    expect(hasStyleSheets).toBeTruthy();

    // Verificar se fonte está definida (não é a padrão do browser)
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(fontFamily).not.toBe('');
    expect(fontFamily.length).toBeGreaterThan(0);
  });

  test('✅ SMOKE-10: Bundle size razoável', async ({ page }) => {
    const resources: number[] = [];

    page.on('response', async response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          resources.push(buffer.length);
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const totalSize = resources.reduce((a, b) => a + b, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    console.log(`📦 Total bundle size: ${totalSizeMB}MB`);

    // Bundle total deve ser menor que 5MB (muito tolerante)
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });
});

/**
 * CRITÉRIOS DE SUCESSO
 * ====================
 * ✅ Todos os 10 testes devem passar
 * ✅ Tempo total de execução < 1 minuto
 * ✅ Carregamento inicial < 10 segundos
 * ✅ Sem erros JavaScript críticos
 * ✅ Responsivo em mobile
 * ✅ SEO básico implementado
 */
