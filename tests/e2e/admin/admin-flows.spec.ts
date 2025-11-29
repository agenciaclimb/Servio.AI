import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Fluxos críticos do admin: aprovar prestador, ver disputas

test.describe('[E2E] Admin - Fluxos críticos', () => {
  test('ver dashboard com KPIs principais', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page.getByText(/usuários|jobs|receita|disputas/i).first()).toBeVisible();
  });

  test('acessar lista de disputas e abrir detalhes', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page.getByRole('link', { name: /disputas|mediação/i }).first().click();

    const disputeCard = page.getByText(/disputa|problema|contestação/i).first();
    await disputeCard.click();

    await expect(page.getByRole('dialog', { name: /disputa|mediação/i })).toBeVisible();
  });
});
