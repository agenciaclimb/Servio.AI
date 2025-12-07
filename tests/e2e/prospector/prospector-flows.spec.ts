import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Fluxos básicos do módulo de prospecção (UI)

test.describe('[E2E] Prospector - Fluxos críticos', () => {
  test('prospector carrega painel principal com pipeline e ações sugeridas', async ({
    page,
    loginAsProspector,
  }) => {
    await loginAsProspector();
    await expect(page.getByText(/pipeline|funil|oportunidades/i).first()).toBeVisible();
    await expect(
      page.getByText(/ações sugeridas|smart actions|ações inteligentes/i).first()
    ).toBeVisible();
  });
});
