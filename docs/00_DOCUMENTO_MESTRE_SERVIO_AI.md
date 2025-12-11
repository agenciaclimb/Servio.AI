# 📘 DOCUMENTO MESTRE SERVIO.AI — Constituição do Sistema

**Versão**: 4.1.0 (Software Factory Autônoma)  
**Data**: 11 de dezembro de 2025  
**Status**: 🔴 ATIVO — Máquina de Desenvolvimento em Operação  
**Autoridade**: Suprema e Imutável

---

## 🔵 I. ARQUITETURA GERAL DO SISTEMA

### 1.1 Camadas da Software Factory

```
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 4: ORCHESTRATOR (Pipeline Autônomo)                  │
│ ├─ loadTasksFromJSON()                                      │
│ ├─ createDayFolder()                                        │
│ ├─ routeTasksToCopilot()                                    │
│ ├─ registerHistory()                                        │
│ └─ ensureImmutableCycle()                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 3: COPILOT EXECUTOR (Máquina de Execução)            │
│ ├─ createBranch(taskId)                                     │
│ ├─ implementTask(spec)                                      │
│ ├─ atomicCommits(files)                                     │
│ ├─ openPullRequest(branch)                                  │
│ └─ applyMasterDocUpdate(block)                              │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 2: GEMINI AUDITOR (Pensador Inteligente)             │
│ ├─ auditPullRequest(pr)                                     │
│ ├─ generateTasks(backlog)                                   │
│ ├─ updateMasterDoc(changes)                                 │
│ └─ systemReview()                                           │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│ CAMADA 1: DOCUMENTO MESTRE (Lei Suprema)                    │
│ ├─ Arquitetura                                              │
│ ├─ Regras Rígidas                                           │
│ ├─ Padrões de Código                                        │
│ └─ Ciclo Imutável                                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo Invariante

```
TAREFAS_ATIVAS.json (entrada)
    ↓
Orchestrator.loadTasks()
    ↓
routeTasksToCopilot(task)
    ↓
Copilot: git checkout -b feature/task-{id}
    ↓
Copilot: implementa spec EXATAMENTE
    ↓
Copilot: atomic commits
    ↓
Copilot: git push → GitHub
    ↓
Copilot: gh pr create
    ↓
⏸️  PAUSA CRÍTICA
    ↓
Gemini: auditPR(pr_url)
    ↓
Gemini: gera bloco de atualização Documento Mestre
    ↓
Gemini: resposta: APROVADO ou REJEIÇÃO
    ↓
SE APROVADO:
    Copilot: aplica bloco atualização
    Copilot: git add, commit, push
    Orchestrator: gh pr merge
    Orchestrator: git branch -d feature/task-{id}
    Orchestrator: registerHistory()
    ↓
PRÓXIMA TASK
```

---

## 🟣 II. REGRAS RÍGIDAS DO DESENVOLVIMENTO

### 2.1 Regras do Gemini Auditor

1. **Nunca Codifica**: Gemini PENSA, AUDITA, GERA SPECS. Nunca modifica arquivos de código.
2. **Só Aprova ou Rejeita**: Resposta final é sempre `{ status: "APROVADO" | "REJEIÇÃO", motivo: "..." }`
3. **Audita contra Documento Mestre**: Cada PR é auditado contra esta constituição.
4. **Gera Blocos de Atualização**: Se algo no Documento Mestre precisa mudar, Gemini gera bloco markdown com a exata mudança.
5. **Sistema Review Quinzenal**: A cada 2 semanas, Gemini executa `system-review.js` e gera relatório de saúde.

### 2.2 Regras do Copilot Executor

1. **Obedece Protocolo 12-Passos**: Sem exceções, sem interpretações.
2. **Cria Branches Determinísticas**: `feature/task-{id}` (ex: `feature/task-1.0`)
3. **Commits Atômicos**: Um arquivo = um commit com mensagem `feat: [task-X.Y] descrição`
4. **Sem Improviso**: Se task pedir implementar X, implementa EXATAMENTE X. Nada mais, nada menos.
5. **Aguarda Aprovação Gemini**: Não faz merge sem bloco de atualização do Gemini.
6. **Rastreia em History**: Toda execução registrada em `/ai-tasks/history/`

### 2.3 Regras do Orchestrator

1. **Carrega Tasks de JSON**: `TAREFAS_ATIVAS.json` é a fonte de verdade.
2. **Cria Pasta Day-X Automaticamente**: Quando task chega, cria `/ai-tasks/day-X/`
3. **Roteamento Determinístico**: Task → Copilot (código) OU Gemini (specs)
4. **Registro Imutável**: Toda ação gravada em `/ai-tasks/history/YYYY-MM-DD.json`
5. **Sincronização GitHub**: Integrado com `gh` CLI para criar issues, PRs automaticamente.

---

## 🟢 III. CICLO IMUTÁVEL (12 PASSOS)

### Passo 1: Receber Task

- Arquivo: `/ai-tasks/day-X/task-X.Y.md` OU entrada em `TAREFAS_ATIVAS.json`

### Passo 2: Sincronização

```bash
git pull origin main
git status
```

### Passo 3: Criar Branch

```bash
git checkout -b feature/task-{id}
```

### Passo 4: Implementar

- Seguir spec EXATAMENTE
- Respeitar arquitetura Documento Mestre
- Aplicar padrões do projeto

### Passo 5: Commits Atômicos

```bash
git add arquivo.ts
git commit -m "feat: [task-X.Y] descrição exata"
```

### Passo 6: Sincronizar Remoto

```bash
git push origin feature/task-{id}
```

### Passo 7: Abrir Pull Request

```bash
gh pr create --title "[task-X.Y] ..." --body "..."
```

### Passo 8: ⏸️ PAUSA CRÍTICA

- **Aguarde auditoria Gemini**
- Não faça merge sem aprovação

### Passo 9: Aplicar Bloco de Atualização Gemini

```bash
# Gemini fornece bloco markdown
# Copilot aplica exatamente
git add DOCUMENTO_MESTRE_SERVIO_AI.md
git commit -m "docs: [task-X.Y] atualizar Documento Mestre"
git push origin feature/task-{id}
```

### Passo 10: Fazer Merge

```bash
gh pr merge feature/task-{id} --merge
```

### Passo 11: Limpar Branch Local

```bash
git branch -d feature/task-{id}
```

### Passo 12: Registrar Histórico

```bash
# Orchestrator registra em /ai-tasks/history/
```

---

## 🔵 IV. PADRÕES DE CÓDIGO OBRIGATÓRIOS

### 4.1 Stack Técnico (INVIOLÁVEL)

| Camada    | Tecnologia        | Versão | Status |
| --------- | ----------------- | ------ | ------ |
| Frontend  | React 18.3        | 18.3.1 | ✅     |
| Framework | TypeScript        | 5.6    | ✅     |
| Build     | Vite              | 5.4    | ✅     |
| Backend   | Node.js + Express | 20 LTS | ✅     |
| Database  | Firestore         | Latest | ✅     |
| Auth      | Firebase Auth     | Latest | ✅     |
| Payments  | Stripe            | v1 API | ✅     |
| AI        | Google Gemini     | 2.0    | ✅     |
| Testing   | Vitest + RTL      | Latest | ✅     |
| CI/CD     | GitHub Actions    | Latest | ✅     |

### 4.2 Convenções de Naming

```
Components:     PascalCase (MyComponent.tsx)
Functions:      camelCase (myFunction())
Constants:      UPPER_SNAKE_CASE (MY_CONSTANT)
Files:          kebab-case (my-file.ts)
Branches:       feature/task-{id}
Commits:        feat/fix/docs/refactor: [task-X.Y] mensagem
```

### 4.3 Estrutura de Arquivos

```
servio.ai/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types.ts
│   └── App.tsx
├── backend/
│   ├── src/
│   │   ├── index.js (Express app)
│   │   ├── routes/
│   │   └── middleware/
│   └── tests/
├── ai-tasks/
│   ├── day-1/
│   │   ├── task-1.0.md
│   │   ├── task-1.0-DONE.md
│   │   └── AUDITORIA.md
│   ├── logs/
│   └── history/
├── ai-engine/
│   ├── gemini/
│   ├── copilot-executor/
│   └── orchestrator/
└── docs/
    └── 00_DOCUMENTO_MESTRE_SERVIO_AI.md
```

### 4.4 Padrões TypeScript

```typescript
// Sempre tipado
interface MyComponentProps {
  id: string;
  onAction: (data: MyData) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ id, onAction }) => {
  // implementação
};

// Tipos centrais em types.ts
type UserType = 'cliente' | 'prestador' | 'admin';
type JobStatus = 'ativo' | 'em_progresso' | 'concluido';
```

---

## 🟡 V. PLANO DE LANÇAMENTO (7 DIAS)

### Dia 1: Auditoria Geral + Plano Técnico

- Gemini executa `system-review.js`
- Gera relatório de saúde completo
- Lista blockers críticos para lançamento

### Dia 2: Corrigir Blockers

- Copilot executa tasks de correção
- Testes rodando 100%
- Coverage ≥ 80%

### Dia 3: Performance + Segurança

- Lighthouse score ≥ 85
- npm audit zero vulnerabilidades
- OWASP Top 10 auditado

### Dia 4: Testes E2E Completos

- Smoke tests 100%
- Critical flows 100%
- Edge cases cobertos

### Dia 5: Deploy Staging

- Backend em Cloud Run (staging)
- Frontend em Firebase Hosting (staging)
- Integração testada

### Dia 6: Validação Produção

- Todas as métricas green
- Monitoramento ativo
- Backup verificado

### Dia 7: Go Live

- Deploy production
- Health checks ativos
- Suporte 24/7

---

## 🔴 VI. EVOLUÇÃO PÓS-LANÇAMENTO

### 6.1 Cadência de Tasks

- **Segunda**: Backlog Review com Gemini
- **Quarta**: Execução de 2-3 features
- **Sexta**: System Review + Planejamento

### 6.2 Critérios de Sucesso

- 0 bugs críticos
- 0 npm vulnerabilidades
- Coverage ≥ 80%
- Response time < 200ms
- Uptime ≥ 99.9%

### 6.3 Gestão de Versões

```
v4.1.0 → v4.2.0 (features)
v4.1.0 → v4.1.1 (bugfixes)
v4.1.0 → v5.0.0 (breaking changes)
```

Cada versão requer auditoria Gemini + aprovação Documento Mestre.

---

## 🟢 VII. SEGURANÇA (OBRIGATÓRIO)

### 7.1 Chaves e Segredos

- ❌ Nunca commitar `.env`
- ✅ Usar `Secret Manager` (Google Cloud)
- ✅ Variaáveis de ambiente injetadas em runtime
- ✅ Pre-commit hooks verificam regex de chaves

### 7.2 Controle de Acesso

- Email é ID de usuário (não UID do Firebase)
- Regras Firestore por role (`isAdmin()`, `isProvider()`)
- JWT validado em todo endpoint backend

### 7.3 Dados Sensíveis

- Pagamentos via Stripe (nunca armazenar CC)
- Senhas hasheadas com bcrypt
- Auditoria de acesso em `/ai-tasks/logs/`

---

## 📋 APPENDIX A: HISTÓRICO DE ATUALIZAÇÕES

| Data       | Versão | Mudança                           | Autoridade |
| ---------- | ------ | --------------------------------- | ---------- |
| 11/12/2025 | 4.1.0  | Software Factory Autônoma criada  | Gemini     |
| 11/12/2025 | 4.0.0  | Protocolo Executor Global ativado | Copilot    |
| 10/12/2025 | 3.9.0  | Orchestrator v1.0 em produção     | System     |

---

## 📍 NOTAS FINAIS

Este documento é a **LEI SUPREMA** do desenvolvimento Servio.AI.

- ✅ Pode ser alterado APENAS por bloco de atualização Gemini
- ✅ Toda alteração requer aprovação Gemini + commit rastreável
- ✅ Histórico de mudanças obrigatório
- ✅ Nenhum desenvolvedor pode ignorar regra aqui

**Máquina de Desenvolvimento Ativa. Pronto para Execução.**
