# SECURITY EXCEPTIONS (Dev-Only)

## Contexto

Em 23/12/2025, uma auditoria identificou vulnerabilidades moderadas relacionadas ao esbuild/vite no ambiente de desenvolvimento (dev server), não afetando produção.

## Exceção Aceita

- ID: GHSA-67mh-4wv8-2f99
- Pacotes: esbuild (via vite, vite-node, vitest, @vitest/mocker, @vitest/coverage-\*)
- Severidade: moderate
- Risco em Produção: baixo/nulo (produção usa build estático, dev server não exposto)
- Mitigação: manter dev server local sem exposição externa; CI não usa dev server público

## Justificativa

- A correção automática requer upgrade major do Vite (6.x → 7.x), que demanda janela de testes de regressão.
- O risco é aceitável no curto prazo dado que o ambiente vulnerável é apenas de desenvolvimento local.

## Plano de Ação

1. Planejar sprint de upgrade para Vite ^7.3.0
2. Executar testes de regressão (unitários + E2E smoke)
3. Validar plugins e configurações (vite.config.ts, vitest.config.ts)

## Revisão

- Próxima revisão desta exceção: 15/01/2026
