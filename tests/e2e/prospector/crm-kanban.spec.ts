/**
 * E2E Tests - Prospector CRM Kanban
 * Validates modern Kanban CRM features including:
 * - Lead creation and display
 * - Notes and activities
 * - Follow-up scheduling
 * - Drag-and-drop stage changes
 * - Contact action logging
 */

import { test, expect } from '@playwright/test';

test.describe('Prospector CRM - Kanban Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como prospector (ajustar credenciais conforme ambiente de teste)
    await page.goto('https://servio-ai.com');
    
    // Esperar pela página carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se já está logado (evitar re-autenticação)
    const isLoggedIn = await page.locator('[data-testid="prospector-dashboard"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // Simular login de prospector
      // Nota: Em produção, usar conta de teste dedicada
      await page.click('button:has-text("Entrar")');
      await page.fill('input[type="email"]', 'prospector-test@servio.ai');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/prospector-dashboard', { timeout: 10000 });
    }
    
    // Navegar para o CRM
    await page.click('text=CRM');
    await page.waitForSelector('text=Pipeline de Prospecção', { timeout: 5000 });
  });

  test('✅ Criar lead via quick add → aparece em "Novos"', async ({ page }) => {
    // Encontrar coluna "Novos" vazia e clicar em adicionar
    const addButton = page.locator('button:has-text("+ Adicionar Lead")').first();
    await addButton.click();
    
    // Preencher formulário de quick add
    await page.fill('input[placeholder*="Nome"]', 'Lead Teste E2E');
    await page.fill('input[placeholder*="Telefone"]', '(11) 98765-4321');
    await page.fill('input[placeholder*="Email"]', 'lead-teste-e2e@example.com');
    await page.selectOption('select[name="category"]', 'design');
    
    // Submeter formulário
    await page.click('button:has-text("Adicionar")');
    
    // Validar que lead aparece na coluna "Novos"
    await expect(page.locator('text=Lead Teste E2E')).toBeVisible({ timeout: 3000 });
    
    // Validar que está na coluna correta
    const newColumn = page.locator('.rounded-lg:has-text("🆕 Novos")');
    await expect(newColumn.locator('text=Lead Teste E2E')).toBeVisible();
  });

  test('✅ Adicionar nota → aparece em Notas e Histórico', async ({ page }) => {
    // Clicar no primeiro lead disponível
    const firstLead = page.locator('[data-draggable-id]').first();
    await firstLead.click();
    
    // Esperar modal abrir
    await expect(page.locator('text=Visão Geral')).toBeVisible();
    
    // Navegar para aba de Notas
    await page.click('button:has-text("📝 Notas")');
    
    // Adicionar nota
    const noteText = `Nota de teste E2E - ${Date.now()}`;
    await page.fill('textarea[placeholder*="anotação"]', noteText);
    await page.click('button:has-text("Salvar Nota")');
    
    // Validar que nota aparece na lista
    await expect(page.locator(`text=${noteText}`)).toBeVisible({ timeout: 3000 });
    
    // Navegar para aba de Histórico
    await page.click('button:has-text("📅 Histórico")');
    
    // Validar que nota também aparece no histórico com ícone correto
    const activityEntry = page.locator('.border-l-4:has-text("📝")').first();
    await expect(activityEntry.locator(`text=${noteText}`)).toBeVisible();
  });

  test('✅ Agendar follow-up hoje → badge "Hoje" no card', async ({ page }) => {
    // Clicar no primeiro lead
    const firstLead = page.locator('[data-draggable-id]').first();
    const leadName = await firstLead.locator('.font-medium').first().textContent();
    await firstLead.click();
    
    // Esperar modal abrir - aba Overview já ativa
    await expect(page.locator('text=Visão Geral')).toBeVisible();
    
    // Agendar follow-up para hoje
    const today = new Date();
    const dateTimeString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T14:00`;
    await page.fill('input[type="datetime-local"]', dateTimeString);
    await page.click('button:has-text("Agendar")');
    
    // Fechar modal
    await page.click('button[class*="text-white"]:has-text("×")');
    
    // Validar que badge "Hoje" aparece no card
    const leadCard = page.locator(`text=${leadName}`).locator('..').locator('..');
    await expect(leadCard.locator('text=Hoje')).toBeVisible({ timeout: 3000 });
    await expect(leadCard.locator('text=🔔')).toBeVisible();
  });

  test('✅ Drag para "Convertidos" → atividade stage_change registrada', async ({ page }) => {
    // Clicar no primeiro lead da coluna "Novos"
    const newColumn = page.locator('.rounded-lg:has-text("🆕 Novos")');
    const firstLead = newColumn.locator('[data-draggable-id]').first();
    const leadName = await firstLead.locator('.font-medium').first().textContent();
    
    // Abrir modal para verificar atividades atuais
    await firstLead.click();
    await page.click('button:has-text("📅 Histórico")');
    const initialActivityCount = await page.locator('.border-l-4').count();
    await page.click('button[class*="text-white"]:has-text("×")');
    
    // Fazer drag-and-drop para coluna "Convertidos"
    const wonColumn = page.locator('.rounded-lg:has-text("✅ Convertidos")');
    await firstLead.dragTo(wonColumn);
    
    // Aguardar atualização
    await page.waitForTimeout(1000);
    
    // Validar que lead agora está em "Convertidos"
    await expect(wonColumn.locator(`text=${leadName}`)).toBeVisible({ timeout: 3000 });
    
    // Abrir modal novamente e verificar nova atividade
    await wonColumn.locator(`text=${leadName}`).click();
    await page.click('button:has-text("📅 Histórico")');
    
    // Validar que há nova atividade com ícone de stage_change
    const newActivityCount = await page.locator('.border-l-4').count();
    expect(newActivityCount).toBeGreaterThan(initialActivityCount);
    
    // Validar que a atividade menciona "Convertidos"
    await expect(page.locator('text=Movido para').first()).toBeVisible();
    await expect(page.locator('text=Convertidos').first()).toBeVisible();
  });

  test('✅ Clicar WhatsApp → atividade "message" registrada', async ({ page }) => {
    // Clicar no primeiro lead
    const firstLead = page.locator('[data-draggable-id]').first();
    await firstLead.click();
    
    // Ir para aba de Histórico e contar atividades atuais
    await page.click('button:has-text("📅 Histórico")');
    const initialCount = await page.locator('.border-l-4').count();
    
    // Voltar para Overview
    await page.click('button:has-text("📊 Visão Geral")');
    
    // Clicar no botão WhatsApp (não vai abrir o app em teste, mas vai registrar)
    await page.click('button:has-text("WhatsApp")');
    
    // Aguardar atualização
    await page.waitForTimeout(1500);
    
    // Ir para Histórico novamente
    await page.click('button:has-text("📅 Histórico")');
    
    // Validar que há nova atividade
    const newCount = await page.locator('.border-l-4').count();
    expect(newCount).toBeGreaterThan(initialCount);
    
    // Validar que a atividade é do tipo "message" (ícone 💬)
    await expect(page.locator('.border-l-4:has-text("💬")').first()).toBeVisible();
    await expect(page.locator('text=Contato via WhatsApp').first()).toBeVisible();
  });

  test('✅ Clicar Email → atividade "email" registrada', async ({ page }) => {
    // Encontrar um lead com email cadastrado
    const leadsWithEmail = page.locator('[data-draggable-id]:has(text="@")');
    const count = await leadsWithEmail.count();
    
    if (count === 0) {
      test.skip('Nenhum lead com email disponível para teste');
    }
    
    const leadWithEmail = leadsWithEmail.first();
    await leadWithEmail.click();
    
    // Ir para Histórico e contar
    await page.click('button:has-text("📅 Histórico")');
    const initialCount = await page.locator('.border-l-4').count();
    
    // Voltar para Overview
    await page.click('button:has-text("📊 Visão Geral")');
    
    // Clicar no botão Email
    await page.click('button:has-text("Email")');
    
    // Aguardar registro
    await page.waitForTimeout(1500);
    
    // Verificar histórico
    await page.click('button:has-text("📅 Histórico")');
    const newCount = await page.locator('.border-l-4').count();
    expect(newCount).toBeGreaterThan(initialCount);
    
    // Validar ícone de email
    await expect(page.locator('.border-l-4:has-text("📧")').first()).toBeVisible();
  });

  test('✅ Filtro "Follow-up hoje" → exibe apenas leads com follow-up hoje', async ({ page }) => {
    // Selecionar filtro de follow-up
    await page.selectOption('select[title="Filtro de Follow-up"]', 'today');
    
    // Aguardar filtragem
    await page.waitForTimeout(500);
    
    // Validar que apenas leads com badge "Hoje" são exibidos
    const visibleLeads = page.locator('[data-draggable-id]');
    const count = await visibleLeads.count();
    
    if (count > 0) {
      // Se há leads visíveis, todos devem ter badge "Hoje"
      for (let i = 0; i < count; i++) {
        const lead = visibleLeads.nth(i);
        await expect(lead.locator('text=Hoje')).toBeVisible();
      }
    }
    
    // Validar que filtro está ativo
    const filterSelect = page.locator('select[title="Filtro de Follow-up"]');
    await expect(filterSelect).toHaveValue('today');
  });

  test('✅ Toast de lembretes ao carregar (se houver follow-ups)', async ({ page }) => {
    // Recarregar página para disparar useEffect de lembretes
    await page.reload();
    await page.waitForSelector('text=Pipeline de Prospecção', { timeout: 5000 });
    
    // Aguardar toasts aparecerem (delay de 1-2s no código)
    await page.waitForTimeout(3000);
    
    // Validar se toasts de lembrete aparecem (caso haja follow-ups)
    const overdueToast = page.locator('.fixed.bottom-4.right-4:has-text("atrasados")');
    const todayToast = page.locator('.fixed.bottom-4.right-4:has-text("hoje")');
    
    // Pelo menos um dos toasts pode estar visível
    const hasOverdue = await overdueToast.isVisible().catch(() => false);
    const hasToday = await todayToast.isVisible().catch(() => false);
    
    // Se não há follow-ups, teste passa; se há, valida conteúdo
    if (hasOverdue) {
      await expect(overdueToast).toContainText('Follow-ups atrasados');
      await expect(overdueToast).toContainText('⚠️');
    }
    
    if (hasToday) {
      await expect(todayToast).toContainText('Follow-ups para hoje');
      await expect(todayToast).toContainText('🔔');
    }
  });
});
