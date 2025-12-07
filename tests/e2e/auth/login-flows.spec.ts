import { expect } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// Fluxos básicos de login para cada papel de usuário

test.describe('[E2E] Login - Fluxos principais', () => {
  test('cliente consegue fazer login e ver dashboard básico', async ({ page, loginAsClient }) => {
    await loginAsClient();
    await expect(page.getByText(/meus jobs|meus serviços|meus pedidos/i).first()).toBeVisible();
  });

  test('prestador consegue fazer login e ver painel do prestador', async ({
    page,
    loginAsProvider,
  }) => {
    await loginAsProvider();
    await expect(
      page.getByText(/meus jobs|ganhos|onboarding|painel do prestador/i).first()
    ).toBeVisible();
  });

  test('admin consegue fazer login e acessar painel administrativo', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await expect(page.getByText(/dashboard.*admin|painel.*administrativo/i).first()).toBeVisible();
  });
});
