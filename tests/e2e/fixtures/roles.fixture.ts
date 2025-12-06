import { test as base } from '@playwright/test';

/**
 * Fixture de contexto autenticado para cada tipo de usuário de negócio.
 * Pressupõe que o app está acessível em baseURL definida no playwright.config.
 */

export type UserRole = 'cliente' | 'prestador' | 'admin' | 'prospector';

interface RoleFixtures {
  loginAsClient: () => Promise<void>;
  loginAsProvider: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  loginAsProspector: () => Promise<void>;
}

export const test = base.extend<RoleFixtures>({
  loginAsClient: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.getByRole('button', { name: /entrar|login/i }).click();
      await page.getByRole('dialog').filter({ hasText: /bem-vindo de volta|acesse para continuar/i }).waitFor();
      await page.getByLabel(/email/i).fill('e2e-cliente@servio.ai');
      await page.getByLabel(/senha/i).fill('SenhaE2E!123');
      await page.getByTestId('auth-submit-button').click();
      await page.getByText(/minha conta|meus serviços|dashboard|painel/i).first().waitFor({ timeout: 10000 });
    });
  },

  loginAsProvider: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.getByRole('button', { name: /entrar|login/i }).first().click();
      await page.getByRole('dialog').filter({ hasText: /bem-vindo de volta/i }).waitFor();
      await page.getByLabel(/email/i).fill('e2e-prestador@servio.ai');
      await page.getByLabel(/senha/i).fill('SenhaE2E!123');
      await page.getByTestId('auth-submit-button').click();
      await page.getByText(/dashboard|prestador|meus jobs|painel/i).first().waitFor({ timeout: 10000 });
    });
  },

  loginAsAdmin: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.getByRole('button', { name: /entrar|login/i }).click();
      await page.getByRole('dialog').filter({ hasText: /bem-vindo de volta/i }).waitFor();
      await page.getByLabel(/email/i).fill('admin@servio.ai');
      await page.getByLabel(/senha/i).fill('AdminE2E!123');
      await page.getByTestId('auth-submit-button').click();
      await page.getByText(/admin|painel.*administrativo|dashboard/i).first().waitFor({ timeout: 10000 });
    });
  },

  loginAsProspector: async ({ page }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.getByRole('button', { name: /entrar|login/i }).click();
      await page.getByRole('dialog').filter({ hasText: /bem-vindo de volta|acesse para continuar/i }).waitFor();
      await page.getByLabel(/email/i).fill('e2e-prospector@servio.ai');
      await page.getByLabel(/senha/i).fill('SenhaE2E!123');
      await page.getByTestId('auth-submit-button').click();
      await page.getByText(/prospector|crm|pipeline/i).first().waitFor({ timeout: 10000 });
    });
  },
});

export const expect = test.expect;
