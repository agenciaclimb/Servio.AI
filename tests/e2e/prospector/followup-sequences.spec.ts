import { test, expect } from '@playwright/test';

test.describe('Sequências de Follow-up', () => {
  test('abre modal e exibe lista de sequências', async ({ page }) => {
    await page.goto('/prospector');

    await page.getByTestId('btn-followup-sequences').click();

    await expect(page.getByText('Sequências Automatizadas')).toBeVisible();
    await expect(page.getByText('Onboarding Rápido')).toBeVisible();
    await expect(page.getByText('Nutrição Longa')).toBeVisible();
    await expect(page.getByText('Reativação de Inativos')).toBeVisible();
  });
});
