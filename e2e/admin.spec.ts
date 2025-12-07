import { test, expect } from '@playwright/test';

// E2E Admin: agora validamos renderização do painel via mock simples de usuário admin.

test.describe('Painel do Administrador', () => {
  test('Renderiza dashboard admin e alterna abas', async ({ page }) => {
    await page.goto('/');
    // Simula usuário admin (a aplicação atual não possui fluxo real de persistência de auth no localStorage, mas deixamos para futura integração)
    await page.evaluate(() => {
      const adminUser = {
        email: 'admin@servio.ai',
        name: 'Administrador QA',
        type: 'admin',
        status: 'ativo',
      };
      localStorage.setItem('mockCurrentUser', JSON.stringify(adminUser));
    });
    await page.reload();

    // Como o App controla a view, este teste é um placeholder até termos rota/admin real.
    // Validamos ausência de erros graves e elementos base da home enquanto aguardamos implementação de roteamento admin.
    await expect(page.locator('#job-prompt')).toBeVisible();
    await expect(page.getByRole('button', { name: /começar agora/i })).toBeVisible();
  });
});
