### Continuidade Protocolo Supremo (25/12 09:00)

1. **PR #62 (Security Hardening v2)**
   - Responder review mantendo middleware completo: Helmet+CSP, rate limiters, CSRF, sanitização, audit logger e Zod validators.
   - Não afrouxar mocks: usar `createApp({ db, storage, stripe, genAI, rateLimitConfig })` em testes com chain completo de Firestore.
2. **Pós-merge rápido**
   - Smoke: validar `/api/csrf-token`, uma rota com limiter e audit log em ação sensível (LOGIN/CREATE_JOB) com credenciais da sessão.
   - Monitorar Cloud Run logs para 429 e headers de segurança.
3. **Task 4.7 kick-off (privacidade/GDPR + qualidade)**
   - Corrigir `App.test.tsx` (jsdom/window.location e chunks) para zerar 29 falhas remanescentes.
   - Reativar CI: remover `if: false` em `.github/workflows/ci.yml`; garantir upload de coverage para SonarCloud.
   - Cobertura +5%: priorizar suites de UI com menor coverage (HeroSection, ProviderDashboard filtros) e cenários de erro.
   - Consentimento/retention: modal/banner de consentimento, política de retenção/anônimos, revisão de storage de dados pessoais.
   - RBAC/audit: expandir checks baseados em custom claims e registrar acessos sensíveis; alinhar com `firestore.rules`.
   - Rodar `npm run validate:prod` e anexar saída; atualizar DOCUMENTO_MESTRE com métricas e decisões.
