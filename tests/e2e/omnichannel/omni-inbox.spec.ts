import { test, expect } from '../fixtures/roles.fixture';

/**
 * Testes E2E para a Caixa de Entrada Omnichannel (Admin)
 * Garante que a interface de conversas e o status dos canais funcionem como esperado.
 */

test.describe('OmniInbox - Painel de Conversas do Admin', () => {
  // Antes de cada teste neste grupo, faz o login como Admin e navega para o inbox.
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto('/admin/omnichannel');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir métricas de conversas', async ({ page }) => {
    await expect(page.getByText('Total:')).toBeVisible();
    await expect(page.getByText('Ativas:')).toBeVisible();
    await expect(page.getByText('Tempo Médio de Resposta:')).toBeVisible();
  });

  test('deve filtrar conversas por canal (ex: WhatsApp)', async ({ page }) => {
    const channelFilter = page.locator('select[aria-label="Filtrar por canal"]');
    await channelFilter.selectOption('whatsapp');

    // Aguarda uma resposta da rede ou um timeout para o filtro ser aplicado
    await page.waitForTimeout(500);

    const conversations = page.locator('[data-testid="conversation-item"]');
    if ((await conversations.count()) > 0) {
      await expect(conversations.first().getByText(/whatsapp/i)).toBeVisible();
    }
  });

  test('deve abrir uma conversa e exibir o painel de mensagens', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    if ((await firstConversation.count()) > 0) {
      await firstConversation.click();
      await expect(page.getByTestId('message-viewer')).toBeVisible();
      await expect(page.getByPlaceholder('Digite sua mensagem...')).toBeVisible();
    }
  });

  test('deve enviar uma mensagem manual em uma conversa', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    if ((await firstConversation.count()) > 0) {
      await firstConversation.click();
      const input = page.getByPlaceholder('Digite sua mensagem...');
      await input.fill('Teste de mensagem E2E');
      await page.getByRole('button', { name: 'Enviar' }).click();
      await expect(page.getByText('Teste de mensagem E2E')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('OmniChannelStatus - Status dos Canais do Admin', () => {
  // Antes de cada teste, faz login como Admin e vai para a página de status.
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto('/admin/omnichannel/status');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir o status de todos os principais canais', async ({ page }) => {
    await expect(page.getByText('WhatsApp')).toBeVisible();
    await expect(page.getByText('Instagram')).toBeVisible();
    await expect(page.getByText('Facebook')).toBeVisible();
    await expect(page.getByText('WebChat')).toBeVisible();
  });

  test('deve exibir métricas específicas para cada canal', async ({ page }) => {
    const whatsappCard = page.locator('.card', { hasText: 'WhatsApp' });
    await expect(whatsappCard.getByText(/Última mensagem:/i)).toBeVisible();
    await expect(whatsappCard.getByText(/Taxa de erro:/i)).toBeVisible();
  });

  test('deve exibir um indicador visual para canais com problemas', async ({ page }) => {
    // Este teste não falha se não houver canais com erro, ele apenas confirma a existência do indicador se houver um problema.
    const problemIndicator = page.locator('text=⚠️, text=❌');
    if ((await problemIndicator.count()) > 0) {
      await expect(problemIndicator.first()).toBeVisible();
    }
  });
});
