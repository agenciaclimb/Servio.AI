# 🤖 AI Tasks - Servio.AI

Esta pasta contém as **tasks geradas automaticamente** pelo **Servio.AI Orchestrator**.

## 📋 Estrutura

```
ai-tasks/
├── day-1/
│   ├── README.md (sumário do dia)
│   ├── task-1.1.md
│   ├── task-1.2.md
│   └── task-1.3.md
├── day-2/
│   ├── README.md
│   ├── task-2.1.md
│   └── ...
└── README.md (este arquivo)
```

## 🔄 Fluxo de Trabalho

### 1️⃣ **Gemini (Arquiteto)** gera tasks em JSON

```json
{
  "day": 1,
  "area": "Segurança",
  "tasks": [...]
}
```

### 2️⃣ **Orchestrator** processa o JSON

```powershell
node orchestrator.cjs tasks-dia1.json
```

**Resultado:**

- ✅ Cria arquivos `.md` nesta pasta
- ✅ Cria issues no GitHub
- ✅ Vincula arquivos com issues

### 3️⃣ **Copilot (Executor)** implementa as tasks

No VS Code:

```
"Copilot, implemente a Task 1.1 seguindo o arquivo ai-tasks/day-1/task-1.1.md"
```

**Resultado:**

- ✅ Código implementado
- ✅ Testes criados
- ✅ Pull Request gerado

### 4️⃣ **Gemini (Auditor)** revisa o PR

```
"Gemini, audite este PR: https://github.com/agenciaclimb/Servio.AI/pull/123"
```

**Resultado:**

- ✅ Aprovado → Merge
- ✅ Issue fechada automaticamente

## 📊 Status das Tasks

Para ver o status atual de todas as tasks, acesse:

**Issues do GitHub:** https://github.com/agenciaclimb/Servio.AI/issues?q=label%3Aai-task

## 🎯 Convenções

### Nomes de Arquivos

- **Formato:** `task-X.Y.md`
- **Exemplo:** `task-1.1.md` (Dia 1, Task 1)

### Labels das Issues

- `ai-task` - Task gerada pelo Orchestrator
- `day-X` - Dia do sprint
- `task-X.Y` - Identificador da task
- `priority-{critical|high|medium|low}` - Prioridade
- Tags adicionais conforme área (ex: `security`, `frontend`, `backend`)

### Estrutura do Arquivo de Task

Cada arquivo `.md` contém:

1. **Título** e metadados (dia, área, prioridade)
2. **Objetivo** da task
3. **Descrição técnica** detalhada (do Gemini)
4. **Critérios de aceitação** para o PR
5. **Instrução para o Copilot**
6. **Links úteis** (documentação, guias)

## 🛠️ Ferramentas

### Orchestrator

**Repositório:** `servio-ai-orchestrator/`  
**Documentação:** [README do Orchestrator](../../servio-ai-orchestrator/README.md)

### GitHub API

Todas as operações usam a GitHub API v3 com autenticação via Personal Access Token.

### VS Code Copilot

Extensão oficial do GitHub Copilot instalada no VS Code.

## 📚 Recursos Adicionais

- [DOCUMENTO_MESTRE](../doc/DOCUMENTO_MESTRE_SERVIO_AI.md)
- [Guia de Contribuição](../CONTRIBUTING.md)
- [API Endpoints](../API_ENDPOINTS.md)

---

## ⚠️ Importante

**NÃO edite manualmente os arquivos desta pasta.**

Todos os arquivos aqui são gerados e gerenciados automaticamente pelo Orchestrator. Se precisar fazer alterações:

1. Edite o JSON de origem
2. Re-execute o Orchestrator
3. Os arquivos serão atualizados automaticamente

---

## 🔒 Segurança

- ✅ Todos os commits passam por revisão
- ✅ PRs são auditados pelo Gemini antes do merge
- ✅ Tasks críticas têm prioridade máxima
- ✅ Testes devem passar antes do merge

---

**Sistema de desenvolvimento guiado por IA 100% operacional** 🚀

**Última atualização:** 2025-12-10
