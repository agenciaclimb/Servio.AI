import { test, expect } from '@playwright/test';

test.describe('Painel de Gamificação', () => {
  test('abre painel e mostra ranking', async ({ page }) => {
    await page.goto('/prospector');

    await page.getByTestId('btn-gamification').click();
    await expect(page.getByText('Painel de Gamificação')).toBeVisible();
    await expect(page.getByText('Pontuação & Ranking')).toBeVisible();
    await expect(page.getByText(/CONVERTIDOS/i)).toBeVisible();
  });
});
