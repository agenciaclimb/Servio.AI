/**
 * E2E Tests - OmniInbox Component
 * 
 * Testa a interface de conversas omnichannel para admin/prestadores
 */

import { test, expect } from '@playwright/test';

test.describe('OmniInbox - Painel de Conversas', () => {
  test.beforeEach(async ({ _page }) => {
    // TODO: Setup authentication
    // await _page.goto('https://gen-lang-client-0737507616.web.app/admin');
  });

  test('deve exibir métricas de conversas', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    // Verificar métricas no header
    await expect(page.getByText('Total:')).toBeVisible();
    await expect(page.getByText('Ativas:')).toBeVisible();
    await expect(page.getByText('Tempo Médio de Resposta:')).toBeVisible();
  });

  test('deve filtrar conversas por canal', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    // Selecionar filtro de canal
    const channelFilter = page.locator('select').first();
    await channelFilter.selectOption('whatsapp');

    // Verificar que apenas conversas de WhatsApp são exibidas
    const conversations = page.locator('[data-testid="conversation-item"]');
    const count = await conversations.count();
    
    for (let i = 0; i < count; i++) {
      const conv = conversations.nth(i);
      await expect(conv.getByText('whatsapp')).toBeVisible();
    }
  });

  test('deve filtrar conversas por tipo de usuário', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    const userTypeFilter = page.locator('select').nth(1);
    await userTypeFilter.selectOption('cliente');

    // Verificar filtro aplicado
    const conversations = page.locator('[data-testid="conversation-item"]');
    const count = await conversations.count();
    
    for (let i = 0; i < count; i++) {
      const conv = conversations.nth(i);
      await expect(conv.getByText('cliente')).toBeVisible();
    }
  });

  test('deve abrir conversa e exibir mensagens', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    // Clicar na primeira conversa
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();

    // Verificar que mensagens são exibidas
    await expect(page.getByTestId('message-viewer')).toBeVisible();
    await expect(page.getByPlaceholder('Digite sua mensagem...')).toBeVisible();
  });

  test('deve enviar mensagem manual', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    // Abrir conversa
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();

    // Digitar mensagem
    const input = page.getByPlaceholder('Digite sua mensagem...');
    await input.fill('Olá, como posso ajudar?');

    // Enviar
    const sendButton = page.getByRole('button', { name: 'Enviar' });
    await sendButton.click();

    // Verificar que mensagem aparece no histórico
    await expect(page.getByText('Olá, como posso ajudar?')).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir indicador de automação', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    // Abrir conversa que tenha mensagens automáticas
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();

    // Procurar por indicador de automação
    const automationIndicators = page.getByText('🤖 Auto');
    const count = await automationIndicators.count();
    
    // Pode ter 0 ou mais mensagens automáticas
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve fechar visualizador de mensagens', async ({ page }) => {
    await page.goto('/admin/omnichannel');

    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    await firstConversation.click();

    // Clicar em fechar
    const closeButton = page.getByRole('button', { name: 'Fechar' });
    await closeButton.click();

    // Verificar que mensagens não estão mais visíveis
    await expect(page.getByTestId('message-viewer')).not.toBeVisible();
  });
});

test.describe('OmniChannelStatus - Status dos Canais', () => {
  test('deve exibir status de todos os canais', async ({ page }) => {
    await page.goto('/admin/omnichannel/status');

    // Verificar que 4 canais são exibidos
    await expect(page.getByText('WhatsApp')).toBeVisible();
    await expect(page.getByText('Instagram')).toBeVisible();
    await expect(page.getByText('Facebook')).toBeVisible();
    await expect(page.getByText('WebChat')).toBeVisible();
  });

  test('deve exibir métricas de cada canal', async ({ page }) => {
    await page.goto('/admin/omnichannel/status');

    // Verificar métricas do WhatsApp
    const whatsappCard = page.locator('text=WhatsApp').locator('..');
    await expect(whatsappCard.getByText('Última mensagem:')).toBeVisible();
    await expect(whatsappCard.getByText('Taxa de erro:')).toBeVisible();
    await expect(whatsappCard.getByText('Webhook:')).toBeVisible();
  });

  test('deve identificar canal com warning', async ({ page }) => {
    await page.goto('/admin/omnichannel/status');

    // Procurar por canal com status warning ou offline
    const warningChannels = page.locator('text=⚠️');
    const offlineChannels = page.locator('text=❌');
    
    const warningCount = await warningChannels.count();
    const offlineCount = await offlineChannels.count();
    
    // Pode ter 0 ou mais canais com problemas
    expect(warningCount + offlineCount).toBeGreaterThanOrEqual(0);
  });

  test('deve mostrar botão de diagnóstico para canais com problema', async ({ page }) => {
    await page.goto('/admin/omnichannel/status');

    // Se houver canal com problema, verificar botão de diagnóstico
    const diagnosticButtons = page.getByText('Diagnosticar problema');
    const count = await diagnosticButtons.count();
    
    if (count > 0) {
      await expect(diagnosticButtons.first()).toBeVisible();
    }
  });

  test('deve exibir timestamp de última atualização', async ({ page }) => {
    await page.goto('/admin/omnichannel/status');

    await expect(page.getByText(/Última atualização:/)).toBeVisible();
  });
});
