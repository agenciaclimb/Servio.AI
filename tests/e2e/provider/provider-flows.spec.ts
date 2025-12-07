import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Fluxos críticos do prestador: ver jobs, enviar proposta, acompanhar job

test.describe('[E2E] Prestador - Fluxos críticos', () => {
  test('ver lista de jobs compatíveis e abrir detalhes', async ({ page, loginAsProvider }) => {
    await loginAsProvider();

    await expect(
      page.getByText(/jobs disponíveis|serviços perto de você|oportunidades/i).first()
    ).toBeVisible();

    const jobCard = page
      .getByRole('button', { name: /ver detalhes|detalhes/i })
      .first()
      .or(page.getByText(/detalhes/i).first());
    await jobCard.click();

    await expect(page.getByText(/descrição do serviço|detalhes do job/i).first()).toBeVisible();
  });

  test('enviar proposta rápida para um job visível', async ({ page, loginAsProvider }) => {
    await loginAsProvider();

    const jobCard = page.getByText(/serviço|job|vaga/i).first();
    await jobCard.click();

    await page
      .getByRole('button', { name: /enviar proposta|propor/i })
      .first()
      .click();
    const modal = page.getByRole('dialog', { name: /proposta|enviar proposta/i });

    await modal.getByLabelText(/preço|valor/i).fill('120');
    await modal.getByLabelText(/mensagem/i).fill('Fluxo E2E: posso executar o serviço amanhã.');
    await modal.getByRole('button', { name: /enviar/i }).click();

    await expect(page.getByText(/proposta enviada/i)).toBeVisible();
  });
});
