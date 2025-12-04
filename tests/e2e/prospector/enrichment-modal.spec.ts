import { test, expect } from '@playwright/test';

test.describe('Enriquecimento de Lead', () => {
  test('abre modal e executa enriquecimento simulado', async ({ page }) => {
    await page.goto('/prospector');

    await page.getByTestId('btn-enrichment').click();
    await expect(page.getByText('Enriquecimento de Lead')).toBeVisible();

    const enrichButton = page.getByRole('button', { name: /Enriquecer Dados/i });
    await enrichButton.click();

    // Espera dados encontrados (simulado ~900ms)
    await expect(page.getByText(/Dados Encontrados/)).toBeVisible({ timeout: 5000 });
  });
});
