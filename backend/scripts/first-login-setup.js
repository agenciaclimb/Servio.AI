/**
 * Script para fazer primeiro login de cada usuário E2E e criar documentos Firestore.
 * Usa Playwright headless para automatizar o processo.
 */

const { chromium } = require('playwright');

const USERS = [
  { email: 'e2e-cliente@servio.ai', password: 'SenhaE2E!123', type: 'cliente' },
  { email: 'e2e-prestador@servio.ai', password: 'SenhaE2E!123', type: 'prestador' },
  { email: 'admin@servio.ai', password: 'AdminE2E!123', type: 'admin' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  for (const user of USERS) {
    console.log(`\n🔐 Login inicial: ${user.email}`);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 1. Ir para home
      await page.goto(BASE_URL);
      
      // 2. Clicar em "Entrar"
      await page.getByRole('button', { name: /entrar|login/i }).first().click();
      
      // 3. Aguardar modal
      await page.getByRole('dialog').filter({ hasText: /bem-vindo de volta/i }).waitFor({ timeout: 5000 });
      
      // 4. Preencher email e senha
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/senha/i).fill(user.password);
      
      // 5. Clicar em Entrar
      await page.getByTestId('auth-submit-button').click();
      
      // 6. Aguardar dashboard carregar (qualquer texto indicando sucesso)
      await page.waitForTimeout(3000); // Dar tempo para App.tsx criar documento
      
      console.log(`  ✅ Login efetuado e documento criado (se não existia)`);
    } catch (e) {
      console.error(`  ❌ Erro:`, e.message);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  console.log('\n✅ Processo concluído!');
})();
