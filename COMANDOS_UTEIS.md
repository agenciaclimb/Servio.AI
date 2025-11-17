# 🚀 Guia Rápido de Comandos - Servio.AI

## 📦 Instalação e Setup

```bash
# Instalar dependências
npm install

# Instalar browsers do Playwright
npx playwright install chromium
```

## 🧪 Testes

```bash
# Testes unitários
npm test                    # Com cobertura
npm run test:nocov          # Sem cobertura
npm run test:watch          # Watch mode
npm run test:ui             # Interface visual

# Testes E2E
npm run e2e:smoke           # Smoke tests básicos (10 testes)
npm run e2e:smoke:headed    # Smoke tests com browser visível
npm run e2e:critical        # Testes de fluxos críticos
npm run e2e                 # Todos os testes E2E
npm run e2e:ui              # Interface Playwright
npm run e2e:report          # Ver último relatório

# Testes Backend
npm run test:backend        # Testes do backend
npm run test:all            # Frontend + Backend
```

## 🔨 Build e Desenvolvimento

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor dev (porta 5173)

# Build
npm run build               # Build de produção
npm run preview             # Preview do build (porta 4173)

# Validação completa
npm run validate            # Format + Lint + TypeCheck + Tests
npm run validate:prod       # Validação pré-deploy (TypeCheck + Tests + Smoke + Build)
```

## 🎨 Qualidade de Código

```bash
# TypeScript
npm run typecheck           # Verificar erros TypeScript

# Linting
npm run lint                # Verificar problemas
npm run lint:fix            # Corrigir automaticamente

# Formatação
npm run format              # Formatar código
npm run format:check        # Verificar formatação
```

## 🔒 Segurança

```bash
# Auditar vulnerabilidades
npm run security:audit      # Verificar vulnerabilidades
npm run security:fix        # Tentar corrigir automaticamente

# Dependências
npm run deps:check          # Verificar dependências não utilizadas
npm run deps:update         # Atualizar dependências (interativo)
```

## 🔥 Firebase

```bash
# Autenticação
npm run firebase:login      # Login no Firebase
npm run firebase:use        # Selecionar projeto

# Emuladores
npm run firebase:emulators  # Iniciar emuladores locais

# Deploy de regras
npm run firebase:deploy:rules  # Deploy Firestore + Storage rules
```

## 🚀 Deploy

```bash
# Script de validação completa
pwsh scripts/validate-predeploy.ps1

# Build de produção
npm run build

# Deploy Firebase (manual)
firebase deploy --only hosting

# Deploy gradual (Canary)
firebase deploy --only hosting --rollout-percentage 10
firebase deploy --only hosting --rollout-percentage 50
firebase deploy --only hosting

# Rollback
firebase rollback hosting
```

## 📊 Monitoramento

```bash
# Ver cobertura de testes
npm test                    # Exibe tabela de cobertura
open coverage/index.html    # Abrir relatório HTML (Mac/Linux)
start coverage/index.html   # Abrir relatório HTML (Windows)

# Relatório Playwright
npm run e2e:report          # Ver último relatório E2E
```

## 🎯 Comandos Úteis no Dia a Dia

### Antes de Commitar

```bash
npm run format              # Formatar código
npm run lint:fix            # Corrigir lint
npm run typecheck           # Verificar tipos
npm test                    # Rodar testes
```

### Antes de Criar PR

```bash
npm run validate            # Validação completa
npm run e2e:smoke           # Smoke tests
```

### Antes de Deploy

```bash
npm run validate:prod                      # Validação pré-deploy
pwsh scripts/validate-predeploy.ps1        # Script completo
```

### Debug

```bash
npm run e2e:debug           # Debug Playwright
npm run test:ui             # Debug Vitest
npm run dev                 # Dev com hot reload
```

## 📝 Variáveis de Ambiente

### Desenvolvimento (.env.development)

```bash
VITE_USE_MOCK_DATA=true
VITE_FIREBASE_API_KEY=...
```

### Produção (.env.production)

```bash
VITE_USE_MOCK_DATA=false
VITE_FIREBASE_API_KEY=...
VITE_BACKEND_URL=https://...
```

### Testes E2E

```bash
PLAYWRIGHT_BASE_URL=http://localhost:4173
```

## 🆘 Problemas Comuns

### Build falha

```bash
# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Testes falhando

```bash
# Limpar cache
npm run test -- --clearCache
npm test
```

### E2E não encontra elementos

```bash
# Ver screenshots/vídeos
ls test-results/
npm run e2e:headed    # Ver browser
```

### Porta em uso

```bash
# Mudar porta do dev server
npm run dev -- --port 3000

# Matar processo na porta
npx kill-port 5173
```

## 📚 Documentação de Referência

- [DEPLOY_CHECKLIST.md](../DEPLOY_CHECKLIST.md) - Checklist de deploy
- [PRODUCTION_READINESS.md](../PRODUCTION_READINESS.md) - Relatório de produção
- [SMOKE_TESTS_REPORT.md](../SMOKE_TESTS_REPORT.md) - Resultados dos smoke tests
- [SISTEMA_PRONTO_PRODUCAO.md](../SISTEMA_PRONTO_PRODUCAO.md) - Status geral

## 🎓 Aprendendo Mais

- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Firebase](https://firebase.google.com/docs)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Última atualização**: 13/11/2025  
**Versão**: 1.0
