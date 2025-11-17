# Resiliência e Fallbacks – servio.ai

Este documento consolida o comportamento de resiliência do app: como tratamos falhas de rede/tempo, quando usamos fallback para dados mock/heurística de IA e quando devemos falhar rápido com mensagens claras.

## Catálogo de Erros (ApiError)

- E_NETWORK: falha de rede genérica (DNS, CORS, offline)
- E_TIMEOUT: requisição excedeu 15s (AbortController)
- E_AUTH: 401/403 (não autorizado)
- E_NOT_FOUND: 404
- E_SERVER: 5xx e conflitos normalizados (ex.: 409 → E_SERVER)
- E_UNKNOWN: fallback caso não classificado

Mensagens de UX são mapeadas por contexto (profile, payment, job, proposal, ai) via `services/errorMessages.ts`.

## Fallbacks por Serviço

- API de Listas (resiliente com mock):
  - fetchAllUsers, fetchProviders, fetchJobs, fetchJobsForUser, fetchNotifications
  - Comportamento: tenta backend e, se falhar, retorna dados mock para manter a UI funcional.
- Matching (parcialmente resiliente):
  - matchProvidersForJob: em timeout/erro, retorna uma lista básica como último recurso; loga aviso.
- IA (geminiService):
  - enhanceJobRequest: fallback heurístico local quando backend falha.
  - getMatchingProviders: se falhar repetidamente, retorna [] (sem bloquear UX).
  - generateProfileTip: mock determinístico em ambiente de teste.
- Stripe (sem fallback – falha rápida):
  - createStripeConnectAccount, createStripeAccountLink, createCheckoutSession, releasePayment
  - Motivo: operações financeiras não devem “inventar” resposta.
  - Tratamento: exibir mensagem clara, ação de retry onde apropriado, e log estruturado.

## Padrões de Retry

- Recomendado retry manual (com feedback visual) para E_TIMEOUT / E_NETWORK nos fluxos:
  - Onboarding Stripe (create-connect-account, create-account-link)
  - Checkout (create-checkout-session)
  - Liberação (release-payment), desde que estado do job permita
- Evitar retry automático agressivo; preferir botão “Tentar novamente”.

## Testes que validam resiliência

- tests/e2e/error-handling.test.ts – 404/500/timeout/network/auth com fallbacks
- tests/e2e/ai-fallback.test.ts – heurística e mocks determinísticos
- tests/e2e/payment-errors.test.ts – mapeamento de erros Stripe
- tests/e2e/stripe-timeout-retry.test.ts – timeout + retry bem-sucedido (novo)
- geminiService.more.test.ts – fallback para [] ao falhar persistentemente

## UI/Logs

- Logs ruidosos em teste são filtrados em `tests/setup.ts` (FCM Messaging e `ReactDOMTestUtils.act` deprecation)
- Em produção, logging é controlado por `VITE_DEBUG`.

## Diretrizes rápidas

- Nunca falsificar sucesso financeiro (Stripe) – falhar claro e orientar retry.
- Preferir UI responsiva a hard-fails: quando dado é leitura e não-crítico, usar mock.
- Para IA, sempre manter experiência funcional com heurística local quando possível.
