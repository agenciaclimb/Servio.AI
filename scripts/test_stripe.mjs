/**
 * Script de Teste Automatizado - Stripe Integration
 * Valida configuração e funcionalidades básicas do Stripe
 */

import { readFileSync } from 'fs';

// Ler .env.local manualmente
function loadEnv() {
  try {
    const envContent = readFileSync('.env.local', 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
    return envVars;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}`),
  success: (msg) => console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`),
  error: (msg) => console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`),
};

console.log(`${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
console.log(`${COLORS.cyan}🔐 TESTE STRIPE - SERVIO.AI${COLORS.reset}`);
console.log(`${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

let allPassed = true;

// 1. Verificar variáveis de ambiente
log.info('Verificando variáveis de ambiente...');
const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey) {
  log.error('VITE_STRIPE_PUBLISHABLE_KEY não encontrada em .env.local');
  allPassed = false;
} else if (stripeKey.startsWith('pk_test_')) {
  log.success(`Chave Stripe configurada (TEST MODE): ${stripeKey.substring(0, 20)}...`);
} else if (stripeKey.startsWith('pk_live_')) {
  log.success(`Chave Stripe configurada (LIVE MODE): ${stripeKey.substring(0, 20)}...`);
  log.warning('ATENÇÃO: Usando chaves de PRODUÇÃO!');
} else {
  log.error('VITE_STRIPE_PUBLISHABLE_KEY inválida (deve começar com pk_test_ ou pk_live_)');
  allPassed = false;
}

// 2. Verificar index.html
log.info('\nVerificando index.html...');
try {
  const indexHtml = readFileSync('index.html', 'utf-8');
  if (indexHtml.includes('js.stripe.com')) {
    log.success('Stripe.js carregado no index.html');
  } else {
    log.error('Stripe.js NÃO encontrado no index.html');
    allPassed = false;
  }
} catch (err) {
  log.error(`Erro ao ler index.html: ${err.message}`);
  allPassed = false;
}

// 3. Verificar arquivos de integração
log.info('\nVerificando arquivos de código...');
const filesToCheck = [
  { path: 'src/contexts/AppContext.tsx', name: 'AppContext' },
  { path: 'src/lib/api.ts', name: 'API Client' },
  { path: 'tests/api.test.ts', name: 'API Tests' },
];

filesToCheck.forEach(({ path, name }) => {
  try {
    const content = readFileSync(path, 'utf-8');
    if (content.includes('stripe') || content.includes('Stripe')) {
      log.success(`${name}: Integração Stripe encontrada`);
    } else {
      log.warning(`${name}: Código Stripe não encontrado`);
    }
  } catch (err) {
    log.warning(`${name}: Arquivo não encontrado (${path})`);
  }
});

// 4. Verificar backend (Cloud Run)
log.info('\nVerificando backend...');
const backendUrl = 'https://servio-backend-1000250760228.us-west1.run.app';

async function checkBackend() {
  try {
    // Testar webhook endpoint
    const webhookResponse = await fetch(`${backendUrl}/api/stripe-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test' }),
    });

    if (webhookResponse.status === 400) {
      log.success('Webhook endpoint protegido (rejeita requisições sem assinatura)');
    } else if (webhookResponse.ok) {
      log.warning('Webhook respondeu OK mas deveria rejeitar sem assinatura');
    } else {
      log.error(`Webhook retornou status inesperado: ${webhookResponse.status}`);
      allPassed = false;
    }

    // Testar signing secret check
    const secretResponse = await fetch(`${backendUrl}/diag/stripe-webhook-secret`);
    const secretData = await secretResponse.json();

    if (secretData.configured) {
      log.success('STRIPE_WEBHOOK_SECRET configurado no Cloud Run');
    } else {
      log.error('STRIPE_WEBHOOK_SECRET NÃO configurado');
      allPassed = false;
    }
  } catch (err) {
    log.error(`Erro ao verificar backend: ${err.message}`);
    allPassed = false;
  }
}

// 5. Verificar frontend local
log.info('\nVerificando frontend local...');
async function checkFrontend() {
  try {
    const response = await fetch('http://localhost:3000', { method: 'HEAD' });
    if (response.ok) {
      log.success('Frontend respondendo em http://localhost:3000');
    } else {
      log.warning('Frontend retornou status não-OK');
    }
  } catch (err) {
    log.warning('Frontend não está rodando (execute: npm run dev)');
  }
}

// Executar testes assíncronos
await checkBackend();
await checkFrontend();

// Resumo final
console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
if (allPassed) {
  console.log(`${COLORS.green}✅ TODOS OS TESTES PASSARAM!${COLORS.reset}`);
  console.log(`\n${COLORS.cyan}📋 Próximos Passos:${COLORS.reset}`);
  console.log('   1. Configure Stripe Connect: https://dashboard.stripe.com/test/connect/accounts/overview');
  console.log('   2. Verifique webhook: https://dashboard.stripe.com/test/webhooks');
  console.log('   3. Execute teste E2E: criar job → proposta → pagamento');
} else {
  console.log(`${COLORS.red}❌ ALGUNS TESTES FALHARAM${COLORS.reset}`);
  console.log(`\n${COLORS.yellow}📋 Ações Necessárias:${COLORS.reset}`);
  console.log('   - Verifique os itens marcados com ❌ acima');
  console.log('   - Consulte STRIPE_GUIA_RAPIDO.md para instruções');
  console.log('   - Execute: npm run dev (se frontend não estiver rodando)');
}

console.log(`\n${COLORS.cyan}📚 Documentação:${COLORS.reset}`);
console.log('   - STRIPE_GUIA_RAPIDO.md (5 minutos)');
console.log('   - STRIPE_RESUMO.md (status completo)');
console.log('   - STRIPE_SETUP_GUIDE.md (guia detalhado)');

console.log(`${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

process.exit(allPassed ? 0 : 1);
