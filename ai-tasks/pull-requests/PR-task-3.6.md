## Objetivo

Implementar os testes E2E do ciclo completo do Protocolo Supremo v4.0 (Task 3.6) e garantir execução em CI.

## Mudanças

- tests/e2e/protocol.spec.ts: nova suíte com 10 passos (executa em chromium e firefox)
- tests/e2e/test_data.json: dados auxiliares
- package.json: adiciona script e2e:protocol
- .github/workflows/e2e-protocol.yml: workflow dedicado para rodar npm run e2e:protocol em PRs

## Resultados Locais

- Playwright: 20/20 testes passando
- Ajustes: seletor do botão "Cadastre-se" e filtro de erros externos (Stripe/CORS) no check de console

## Critérios de Aceitação

- [x] Testes E2E implementados para ciclo completo
- [x] Testes cobrem os 10 passos do protocolo
- [x] Componentes funcionam em conjunto
- [x] Relatórios Playwright anexados na CI (artifact)

## Riscos

- Baixo. Workflow roda browsers em sandbox sem secrets.

## Próximos Passos

- Aprovar PR, executar auditoria, e atualizar DOCUMENTO_MESTRE_SERVIO_AI.md com bloco de conclusão da Task 3.6.
