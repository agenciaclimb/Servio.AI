import { test, expect } from '@playwright/test';

import { test, expect } from '@playwright/test';

test.describe('Dashboard de Conversão', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://gen-lang-client-0737507616.web.app');
    await page.waitForLoadState('networkidle');
    // Nota: assumindo session/auth já tratada ou página pública
  });

  test('abre e exibe métricas básicas', async ({ page }) => {
    // Tentar acessar dashboard prospector (pode precisar login)
    await page.goto('https://gen-lang-client-0737507616.web.app/prospector');
    await page.waitForTimeout(2000);

    const dashboardButton = page.getByTestId('btn-funnel-dashboard');
    // Aumentar timeout e verificar visibilidade primeiro
    await expect(dashboardButton).toBeVisible({ timeout: 10000 });
    await dashboardButton.click();

    // Verifica presença de elementos chave
    await expect(page.getByText('Taxa de Conversão')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Novos/i)).toBeVisible();
    await expect(page.getByText(/Contatados/i)).toBeVisible();
  });

  test.skip('⚠️ Requer autenticação prospector - executar manualmente', () => {
    // Placeholder para documentar necessidade de auth
  });
});
