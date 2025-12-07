import { expect } from '@playwright/test';
import { test as rolesTest } from '../fixtures/roles.fixture';

// Reutiliza fixtures de roles, mas permite cenário cliente-prestador no chat
const test = rolesTest.extend({});

test.describe('[E2E] Chat interno - Fluxos críticos', () => {
  test('cliente abre chat de um job em andamento e envia mensagem', async ({
    page,
    loginAsClient,
  }) => {
    await loginAsClient();

    const jobCard = page.getByText(/em andamento|in progress|in_progress/i).first();
    await jobCard.click();

    await page
      .getByRole('button', { name: /chat|conversar|mensagens/i })
      .first()
      .click();

    const modal = page.getByRole('dialog', { name: /chat|mensagens/i });
    await expect(modal).toBeVisible();

    const input = modal.getByPlaceholderText(/digite sua mensagem/i);
    await input.fill('Fluxo E2E: mensagem enviada pelo cliente.');
    await modal.getByRole('button', { name: /enviar/i }).click();

    await expect(modal.getByText(/fluxo e2e: mensagem enviada pelo cliente/i)).toBeVisible();
  });
});
