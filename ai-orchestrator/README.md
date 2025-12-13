# 🚀 AI-ORCHESTRATOR — Pipeline Autônomo

**Versão**: 1.0.0  
**Status**: Production Ready  
**Última Atualização**: 11 de dezembro de 2025

---

## 📋 O que é o Orchestrator?

O Orchestrator é o **maestro** da Software Factory Autônoma do Servio.AI.

Suas responsabilidades:

1. **Carrega Tasks de JSON** — `TAREFAS_ATIVAS.json`
2. **Cria Pastas day-X** — Organiza execução em dias
3. **Roteia para Copilot** — Enfileira implementações
4. **Auditoria com Gemini** — Valida PRs
5. **Registra Histórico** — Rastreabilidade imutável
6. **Sincroniza GitHub** — Cria issues, PRs automáticas

---

## 🚀 Como Usar

### 1. Prepare o Arquivo de Tasks

Crie `tasks.json`:

```json
{
  "tasks": [
    {
      "id": "1.0",
      "titulo": "Implementar Dashboard",
      "descricao": "Criar dashboard admin com métricas",
      "prioridade": "CRÍTICA",
      "day": 1,
      "arquivos": ["src/pages/AdminDashboard.tsx"]
    }
  ]
}
```

### 2. Execute o Orchestrator

```bash
cd /ai-orchestrator
node src/orchestrator.cjs --tasks ../tasks.json
```

### 3. Acompanhe o Histórico

Histórico fica em `/ai-tasks/history/YYYY-MM-DD.json`

---

## 🔵 Fluxo Automático

```
tasks.json (entrada)
    ↓
Orchestrator.loadTasksFromJSON()
    ↓
Para cada task:
  1. Validação (ensureImmutableCycle)
  2. Criação de pasta day-X
  3. Geração arquivo task-X.Y.md
  4. Roteamento para Copilot
  5. Geração metadados PR
  6. Registro em histórico
    ↓
/ai-tasks/history/YYYY-MM-DD.json (saída)
```

---

## 📁 Estrutura de Pastas Criadas

```
/ai-tasks/
├── day-1/
│   ├── task-1.0.md          (spec da task)
│   ├── task-1.0-DONE.md     (resultado)
│   └── AUDITORIA.md         (feedback Gemini)
├── day-2/
│   └── ...
├── history/
│   ├── 2025-12-11.json      (histórico do dia)
│   └── 2025-12-12.json
└── logs/
    ├── audit-1234567.json
    └── system-review-1234567.md
```

---

## 🟢 Métodos Principais

### `loadTasksFromJSON(filePath)`

Carrega array de tasks de arquivo JSON.

**Requer**:

- Array `tasks` com objetos contendo: `id`, `titulo`, `descricao`, `prioridade`

**Retorna**: Array de tasks validadas

---

### `createDayFolder(dayNumber)`

Cria pasta `/ai-tasks/day-{dayNumber}` automaticamente.

**Exemplo**:

```javascript
createDayFolder(1); // Cria /ai-tasks/day-1/
```

---

### `routeTasksToCopilot(task)`

Gera arquivo `task-{id}.md` e enfileira para Copilot executar.

**Fluxo**:

1. Cria pasta day-X
2. Gera arquivo markdown
3. Registra em histórico
4. Copilot pode começar a trabalhar

---

### `registerHistory(action)`

Registra toda ação em `/ai-tasks/history/YYYY-MM-DD.json`.

**Exemplo de entrada**:

```javascript
{
  "taskId": "1.0",
  "action": "ROUTE_TO_COPILOT",
  "status": "ENFILEIRADA",
  "taskFile": "/ai-tasks/day-1/task-1.0.md"
}
```

---

### `ensureImmutableCycle(task)`

Valida se task atende ciclo imutável.

**Campos obrigatórios**:

- `id` — Identificador (ex: "1.0")
- `titulo` — Título descritivo
- `descricao` — Especificação detalhada
- `prioridade` — CRÍTICA|ALTA|NORMAL|BAIXA

**Lança erro se incompleto.**

---

### `generatePullRequestMetadata(task)`

Cria template de PR automaticamente.

**Retorna**:

```javascript
{
  "prTitle": "[task-1.0] Implementar Feature X",
  "prBody": "Descrição completa, checklist, etc."
}
```

---

## 📊 Exemplo Completo

### 1. Arquivo `tasks.json`

```json
{
  "tasks": [
    {
      "id": "1.0",
      "titulo": "Fix: Corrigir bug de autenticação",
      "descricao": "O login está falhando para emails com +. Implementar validação correta.",
      "prioridade": "CRÍTICA",
      "day": 1,
      "arquivos": ["src/services/authService.ts", "src/services/authService.test.ts"]
    },
    {
      "id": "1.1",
      "titulo": "Feature: Dashboard para Admin",
      "descricao": "Implementar dashboard com gráficos de métricas",
      "prioridade": "ALTA",
      "day": 1,
      "arquivos": ["src/pages/AdminDashboard.tsx"]
    }
  ]
}
```

### 2. Executar

```bash
node src/orchestrator.cjs --tasks tasks.json
```

### 3. Saída

```
[ORCHESTRATOR] Carregando tasks de tasks.json...
✅ 2 task(s) carregada(s)

[ORCHESTRATOR] Processando 2 task(s)...

[ORCHESTRATOR] Roteando task 1.0...
✅ Pasta criada: /ai-tasks/day-1
✅ Task file criado: /ai-tasks/day-1/task-1.0.md
📋 Registrado em histórico: ROUTE_TO_COPILOT

[ORCHESTRATOR] Roteando task 1.1...
✅ Task file criado: /ai-tasks/day-1/task-1.1.md
📋 Registrado em histórico: ROUTE_TO_COPILOT

✅ Processamento concluído

============================================================
ORCHESTRATOR — RESUMO DE EXECUÇÃO
============================================================
Total de tasks: 2
Histórico registrado: 4 ação(ões)
Duração: 125ms
============================================================
```

### 4. Histórico (`/ai-tasks/history/2025-12-11.json`)

```json
[
  {
    "timestamp": "2025-12-11T10:30:00.000Z",
    "taskId": "1.0",
    "action": "ROUTE_TO_COPILOT",
    "taskFile": "/ai-tasks/day-1/task-1.0.md",
    "status": "ENFILEIRADA"
  },
  {
    "timestamp": "2025-12-11T10:30:00.100Z",
    "taskId": "1.0",
    "action": "PROCESS_COMPLETE",
    "status": "SUCESSO",
    "prTitle": "[task-1.0] Fix: Corrigir bug de autenticação"
  },
  {
    "timestamp": "2025-12-11T10:30:00.200Z",
    "taskId": "1.1",
    "action": "ROUTE_TO_COPILOT",
    "taskFile": "/ai-tasks/day-1/task-1.1.md",
    "status": "ENFILEIRADA"
  },
  {
    "timestamp": "2025-12-11T10:30:00.300Z",
    "taskId": "1.1",
    "action": "PROCESS_COMPLETE",
    "status": "SUCESSO",
    "prTitle": "[task-1.1] Feature: Dashboard para Admin"
  }
]
```

---

## 🎯 Integração com Pipeline Completa

```
┌─────────────────┐
│ tasks.json      │ (Alimentado manualmente)
└────────┬────────┘
         ↓
┌─────────────────────────────────────┐
│ Orchestrator                        │
│ • loadTasks()                       │
│ • routeTasksToCopilot()             │
│ • registerHistory()                 │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ /ai-tasks/day-X/task-X.Y.md         │ (Spec para Copilot)
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Copilot Executor                    │
│ • git checkout -b feature/task-{id} │
│ • implementa código                 │
│ • commits atômicos                  │
│ • abre PR                           │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Gemini Auditor                      │
│ • auditPR()                         │
│ • generateUpdate()                  │
│ • APROVADO/REJEIÇÃO                 │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Copilot Executor (cont.)            │
│ • aplica bloco Gemini               │
│ • git merge                         │
│ • registra em histórico             │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ /ai-tasks/history/YYYY-MM-DD.json   │ (Imutável)
└─────────────────────────────────────┘
```

---

## 🔒 Garantias de Imutabilidade

✅ **Histórico é append-only** — Nunca sobrescrito  
✅ **Tasks carregadas uma vez** — Estado definido no JSON  
✅ **Registro em tempo real** — Cada ação documentada  
✅ **Rastreabilidade completa** — Todos os metadados presentes

---

## 📍 Notas

- Orchestrator **não executa código** — Apenas roteia e registra
- Orchestrator **não audita** — Apenas enfileira
- Orchestrator **não mergeia** — Apenas gera metadados
- Orchestrator é **determinístico** — Mesma entrada = mesma saída

---

_AI-Orchestrator v1.0 | Production Ready | Parte da Software Factory Autônoma_
