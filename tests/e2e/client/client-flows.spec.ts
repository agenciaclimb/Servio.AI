import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Fluxos críticos do cliente: criar job, acompanhar, disputa (esqueleto E2E)

test.describe('[E2E] Cliente - Fluxos críticos', () => {
  test('criar job simples e visualizar na lista', async ({ page, loginAsClient }) => {
    await loginAsClient();
    await page
      .getByRole('button', { name: /solicitar serviço|criar serviço|novo job/i })
      .first()
      .click();

    const wizard = page.getByRole('dialog', { name: /criar serviço|solicitar serviço/i });
    await wizard
      .getByLabelText(/descrição|o que você precisa/i)
      .fill('Instalar tomadas em 2 quartos');
    await wizard.getByLabelText(/endereço|local/i).fill('Rua E2E, 123 - São Paulo');

    await wizard.getByRole('button', { name: /publicar|criar/i }).click();

    await expect(page.getByText(/instalar tomadas/i)).toBeVisible();
  });

  test('abrir disputa a partir de job em andamento (happy path visual)', async ({
    page,
    loginAsClient,
  }) => {
    await loginAsClient();
    // Este teste assume que há ao menos um job em andamento visível em tela
    const jobCard = page.getByText(/em andamento|in progress|in_progress/i).first();
    await jobCard.click();

    await page
      .getByRole('button', { name: /problema|abrir disputa|contestar/i })
      .first()
      .click();
    const modal = page.getByRole('dialog', { name: /disputa|problema/i });
    await modal
      .getByLabelText(/motivo|descrição/i)
      .fill('Fluxo E2E: qualidade abaixo do esperado.');
    await modal.getByRole('button', { name: /abrir disputa|enviar/i }).click();

    await expect(page.getByText(/em disputa|aguardando mediação/i)).toBeVisible();
  });
});
