#!/usr/bin/env node
/**
 * Stripe readiness checklist script
 * Executa validações locais de configuração antes de go-live.
 */

const REQUIRED_BACKEND_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];
const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'GCP_STORAGE_BUCKET'
];

function detectMode(secret) {
  if (!secret) return 'disabled';
  if (secret.startsWith('sk_test_')) return 'test';
  if (secret.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

async function safeFetch(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 2000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log('=== STRIPE READINESS CHECK ===');
  const missing = REQUIRED_BACKEND_VARS.filter(v => !process.env[v]);
  if (missing.length) {
    console.log('❌ Variáveis críticas ausentes:', missing.join(', '));
  } else {
    console.log('✅ Variáveis críticas presentes');
  }

  const mode = detectMode(process.env.STRIPE_SECRET_KEY);
  console.log('→ Stripe mode detectado:', mode);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const webhookIsTest = webhookSecret.startsWith('whsec_test_');
  const webhookIsLive = webhookSecret.startsWith('whsec_') && !webhookIsTest;
  if (mode === 'test' && process.env.NODE_ENV === 'production') {
    console.log('⚠️ ATENÇÃO: chave TEST em production. Trocar para sk_live_.');
  }
  if (mode === 'live' && webhookIsTest) {
    console.log('⚠️ MISMATCH: chave LIVE com webhook TEST. Gere webhook live (Dashboard ou CLI).');
  }
  if (mode === 'disabled') {
    console.log('⚠️ Stripe desativado (STRIPE_SECRET_KEY ausente).');
  }

  OPTIONAL_VARS.forEach(v => {
    if (process.env[v]) console.log(`ℹ️ Opcional presente: ${v}`);
  });

  const base = process.env.READINESS_BASE_URL || 'http://localhost:8081';
  console.log('→ Base URL para diagnósticos:', base);

  const diagMode = await safeFetch(base + '/diag/stripe-mode');
  const diagWebhook = await safeFetch(base + '/diag/stripe-webhook-secret');

  if (diagMode.ok) {
    console.log('✅ /diag/stripe-mode:', diagMode.json);
  } else {
    console.log('⚠️ /diag/stripe-mode indisponível:', diagMode.error || diagMode.status);
  }
  if (diagWebhook.ok) {
    console.log('✅ /diag/stripe-webhook-secret:', diagWebhook.json);
  } else {
    console.log('⚠️ /diag/stripe-webhook-secret indisponível:', diagWebhook.error || diagWebhook.status);
  }

  // Resultado final
  const blockers = [];
  if (missing.length) blockers.push('Variáveis críticas ausentes');
  if (mode === 'disabled') blockers.push('Stripe desativado');
  if (!diagWebhook.ok) blockers.push('Diagnóstico webhook falhou');
  if (mode === 'live' && webhookIsTest) blockers.push('Webhook segredo ainda em modo TEST');

  if (blockers.length) {
    console.log('\nResumo: ❌ Não pronto para produção');
    blockers.forEach(b => console.log(' -', b));
    process.exitCode = 1;
  } else {
    console.log('\nResumo: ✅ Pronto (pré-produção/local) – verificar apenas troca para chaves LIVE se necessário.');
  }
}

main();
