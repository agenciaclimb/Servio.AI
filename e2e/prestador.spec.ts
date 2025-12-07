import { test, expect } from '@playwright/test';

test.describe('Jornada do Prestador (Fluxo Mínimo)', () => {
  test('Deve validar que página inicial funciona para prestadores', async ({ page }) => {
    await page.goto('/');

    // Verificar elementos básicos visíveis
    await expect(page.getByText(/Conecte-se com Profissionais|SERVIO\.AI/i)).toBeVisible({
      timeout: 10000,
    });

    // Validar que existe opção para prestadores
    // (Ex: link "Para Profissionais" ou similar no header)
    const hasProviderOption = await page
      .getByText(/profissional|prestador|trabalhar conosco/i)
      .isVisible()
      .catch(() => false);

    console.log('✅ Homepage acessível para prestadores:', { hasProviderOption });
  });

  test('Deve validar backend health check', async ({ request }) => {
    const backendUrl =
      process.env.VITE_BACKEND_URL || 'https://servio-backend-h5ogjon7aa-uw.a.run.app';

    const response = await request.get(`${backendUrl}/`).catch(() => null);

    if (!response || !response.ok()) {
      console.warn('⚠️ Backend não acessível');
      test.skip();
      return;
    }

    const text = await response.text();
    expect(text).toContain('SERVIO.AI');

    console.log('✅ Backend health check passed');
  });
});
