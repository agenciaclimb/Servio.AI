import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Cobertura focada em fluxo de disputa cliente->admin->prestador (visão de UI)

test.describe('[E2E] Disputas - Fluxos críticos', () => {
  test('cliente vê disputa aberta na lista de jobs', async ({ page, loginAsClient }) => {
    await loginAsClient();
    await expect(page.getByText(/em disputa|aguardando mediação/i).first()).toBeVisible();
  });

  test('admin abre disputa específica a partir do painel', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    await page
      .getByRole('link', { name: /disputas|mediação/i })
      .first()
      .click();
    const disputeCard = page
      .getByText(/serviço não foi concluído|problema com serviço|disputa/i)
      .first();
    await disputeCard.click();

    await expect(page.getByRole('dialog', { name: /disputa|mediação/i })).toBeVisible();
  });
});
