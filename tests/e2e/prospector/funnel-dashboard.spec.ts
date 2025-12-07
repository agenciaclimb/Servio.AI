
import { test, expect } from '../fixtures/roles.fixture';

test.describe('Prospector - Painel de Funil (Dashboard)', () => {

  // Antes de cada teste neste grupo, executa o login como Prospector
  test.beforeEach(async ({ page, loginAsProspector }) => {
    // 1. Executa a rotina de login definida no fixture
    await loginAsProspector();
    
    // 2. Navega diretamente para a página principal do prospector
    // A baseURL já está configurada no playwright.config.ts
    await page.goto('/prospector');
    
    // 3. Aguarda a página carregar completamente para evitar instabilidade
    await page.waitForLoadState('networkidle');
  });

  // O teste agora verifica o fluxo real do usuário de forma automatizada
  test('deve exibir as métricas chave do funil após o login', async ({ page }) => {
    // O beforeEach já nos logou e nos levou para a página /prospector

    // Clica no botão para abrir o dashboard do funil
    const dashboardButton = page.getByTestId('btn-funnel-dashboard');
    await expect(dashboardButton).toBeVisible({ timeout: 10000 });
    await dashboardButton.click();

    // Verifica se os componentes e textos essenciais do dashboard estão visíveis
    await expect(page.getByText('Taxa de Conversão do Funil')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Novos/i)).toBeVisible();
    await expect(page.getByText(/Contatados/i)).toBeVisible();
    await expect(page.getByText(/Engajados/i)).toBeVisible();
    await expect(page.getByText(/Convertidos/i)).toBeVisible();
  });
});
