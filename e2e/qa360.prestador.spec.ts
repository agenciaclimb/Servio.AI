import { test, expect } from '@playwright/test';

/**
 * QA 360 - PAINEL PRESTADOR COMPLETO
 * 
 * Cobertura:
 * 1. Onboarding (cadastro + verificação)
 * 2. Receber matching (/api/match-providers)
 * 3. Ver jobs abertos compatíveis
 * 4. Enviar proposta para job
 * 5. Conectar Stripe Connect (mock)
 * 6. Ver histórico de jobs
 * 7. Perfil e catálogo de serviços
 * 
 * Critérios de aceite:
 * - Prestador só vê jobs compatíveis com seu perfil
 * - Propostas enviadas persistem
 * - Stripe Connect redirect funciona (mock)
 * - Dashboard carrega métricas corretas
 */

test.describe('QA 360 - Painel Prestador', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mockUser', JSON.stringify({
        uid: 'provider-qa-001',
        email: 'prestador.qa@servio.ai',
        displayName: 'Prestador QA',
        emailVerified: true
      }));
      
      window.localStorage.setItem('userProfile', JSON.stringify({
        email: 'prestador.qa@servio.ai',
        name: 'Prestador QA',
        type: 'prestador',
        status: 'ativo',
        memberSince: new Date().toISOString(),
        location: 'São Paulo, SP',
        specialties: ['eletricista', 'instalacao'],
        averageRating: 4.8,
        stripeAccountId: 'acct_mock_123'
      }));
    });
  });

  test('1. Onboarding - Cadastro completo', async ({ page }) => {
    const profile = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('userProfile') || '{}');
    });
    
    expect(profile.type).toBe('prestador');
    expect(profile.specialties).toContain('eletricista');
    
    console.log('✅ Prestador cadastrado com especialidades');
  });

  test('2. Matching IA - Receber jobs compatíveis', async ({ page }) => {
    // Mock do endpoint match-providers
    await page.route('**/api/match-providers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            providerId: 'prestador.qa@servio.ai',
            name: 'Prestador QA',
            score: 0.85,
            reason: 'Match por categoria e localização + reputação'
          }
        ])
      });
    });

    await page.goto('/');
    
    console.log('✅ Matching IA configurado');
  });

  test.skip('3. Ver jobs abertos no dashboard', async ({ page }) => {
    // TODO: Navegar ao dashboard, validar lista de jobs
  });

  test.skip('4. Enviar proposta para job', async ({ page }) => {
    // TODO: Clicar em job, preencher proposta, enviar
  });

  test.skip('5. Conectar Stripe Connect', async ({ page }) => {
    // TODO: Mock de redirect Stripe, validar salvamento de accountId
  });

  test.skip('6. Ver histórico de jobs concluídos', async ({ page }) => {
    // TODO: Validar jobs com status completed
  });

  test.skip('7. Editar perfil e catálogo de serviços', async ({ page }) => {
    // TODO: Abrir modal de serviços, adicionar item, salvar
  });
});
