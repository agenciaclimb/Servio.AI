# 🌐 CONTEXTO GLOBAL - EXECUTOR SERVIO.AI

**Data Ativação**: 11 de dezembro de 2025  
**Objetivo**: Software Factory Autônoma com Gemini + Copilot  
**Status**: Operacional

---

## 📋 STACK TÉCNICO

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Firestore
- **Database**: Firestore (Realtime + Security Rules)
- **Storage**: Google Cloud Storage
- **Auth**: Firebase Auth (email)
- **Payments**: Stripe + Connect
- **AI**: Gemini 2.0 Flash
- **Deploy**: Cloud Run + Firebase Hosting
- **Tests**: Vitest + Playwright + Jest
- **CI/CD**: GitHub Actions
- **Code Quality**: SonarCloud + ESLint + Prettier

---

## 🎯 OBJETIVOS PRINCIPAIS

1. **Lançar Servio.AI em produção** (7 dias)
2. **Qualidade de mercado** (80%+ coverage, zero exploits)
3. **Escalabilidade** (pronto para 100k+ usuários)
4. **Automação** (pipeline de evolução contínua)
5. **Zero débito técnico** (tudo documentado e rastreado)

---

## 📚 DOCUMENTO MESTRE

Arquivo: `DOCUMENTO_MESTRE_SERVIO_AI.md`  
Função: Constituição técnica do projeto  
Status: Fonte de verdade única

**Toda task deve estar alinhada com o Documento Mestre**

---

## 🔒 REGRAS DE ARQUITETURA

1. **Email como ID**: `users/{email}`, nunca `users/{uid}`
2. **Lazy Loading**: Storage e Analytics carregam on-demand
3. **Secret Manager**: Chaves NUNCA no Git (usar Secret Manager)
4. **Factory Pattern**: Backend com dependency injection para testes
5. **Type Safety**: Strict mode TypeScript obrigatório
6. **Security Rules**: Firestore rules enforcam RBAC por tipo de usuário
7. **Portuguese Enums**: Statuses em português no database
8. **Code Split**: Componentes lazy para performance

---

## 🔑 PADRÕES OBRIGATÓRIOS

### TypeScript

```typescript
interface ComponentProps {
  // Props sempre interface
}

type UserType = 'cliente' | 'prestador' | 'admin';
```

### Firestore

```typescript
// ❌ ERRADO
db.collection('users').doc(auth.currentUser.uid);

// ✅ CERTO
db.collection('users').doc(auth.currentUser.email);
```

### Segredos

```typescript
// ❌ ERRADO
const API_KEY = 'AIzaSy...'; // No código!

// ✅ CERTO
const API_KEY = process.env.PLACES_API_KEY; // Via env/Secret Manager
```

---

## 📊 MÉTRICAS DE QUALIDADE

- **Test Coverage**: 80%+ (atual: 48.36%)
- **Lint Errors**: 0 (max warnings: 1000)
- **Security**: 0 npm vulnerabilities
- **Build Time**: < 5min
- **Deploy Time**: < 10min
- **E2E Tests**: 100% críticos passando
- **Performance**: LCP < 2.5s, FID < 100ms

---

## 🚀 PLANO 7 DIAS

| Dia | Foco               | Tarefas                                  | Status      |
| --- | ------------------ | ---------------------------------------- | ----------- |
| 1   | Auditoria + Plano  | Análise técnica, riscos, priorização     | not-started |
| 2   | Backend Hardening  | Validação, autenticação, autorização     | not-started |
| 3   | Frontend Hardening | Componentes, performance, acessibilidade | not-started |
| 4   | Segurança          | Firestore Rules, Storage Rules, HTTPS    | not-started |
| 5   | Testes             | Unit tests, integration, E2E             | not-started |
| 6   | Performance        | Cloud Run, caching, otimização           | not-started |
| 7   | Lançamento         | UX final, docs, deploy                   | not-started |

---

## 🔍 AUDITORIA GEMINI

Cada task passa por:

1. **Validação Funcional**: Funciona como esperado?
2. **Arquitetura**: Respeita padrões?
3. **Segurança**: Expostos algum secret?
4. **Performance**: Sem regressão?
5. **Testes**: Coverage adequado?
6. **Documentação**: Atualizado o Documento Mestre?

---

## 📝 RASTREABILIDADE

Todos os commits devem ter:

```
[task-X.Y] descrição curta

- Mudanças específicas
- Impacto no sistema
- Arquivo atualizado no Documento Mestre
```

---

## ⚡ VELOCIDADE DE EXECUÇÃO

- **Task simples** (< 2h): 1 branch, 1 PR, 1 merge
- **Task média** (2-8h): 1 branch, múltiplos commits, 1 PR
- **Task complexa** (> 8h): 1 branch, sub-tasks, múltiplos PRs (se necessário)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Protocolo ativado
2. ⏳ Aguardando primeira task em TAREFAS_ATIVAS.json
3. ⏳ Você fornece task-1.0.md
4. ⏳ Eu executo ciclo completo
5. ⏳ Você audita com Gemini
6. ⏳ Próxima task

**Status**: Pronto para receber tasks
