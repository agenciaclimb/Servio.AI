# 🚀 PROTOCOLO EXECUTOR GLOBAL - SERVIO.AI

**Status**: Ativado  
**Data Ativação**: 11 de dezembro de 2025  
**Versão**: 1.0

---

## ⭐ ORDEM SUPREMA

Nenhuma alteração sem task.  
Nenhuma task sem auditoria.  
Nenhuma auditoria sem Documento Mestre.  
Nenhum merge sem aprovação.

**Cycle**: task → branch → code → PR → audit → merge → repeat ∞

---

## 🔵 FLUXO IMUTÁVEL (12 PASSOS)

### PASSO 1: Receber Task

- Você alimenta `TAREFAS_ATIVAS.json` com próxima task
- Ou cria arquivo `/ai-tasks/day-X/task-X.Y.md`

### PASSO 2: Sincronização

```bash
git pull origin main
git status
```

### PASSO 3: Criar Branch

```bash
git checkout -b feature/task-{id}
```

### PASSO 4: Implementar

- Seguir especificação exata do task-X.Y.md
- Respeitar arquitetura do Documento Mestre
- Aplicar padrões do projeto

### PASSO 5: Commits Atômicos

```bash
git add arquivo.ts
git commit -m "feat: [task-X.Y] descrição exata"
```

### PASSO 6: Testes Locais

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### PASSO 7: Abrir PR

```bash
git push origin feature/task-{id}
gh pr create --title "[task-X.Y] descrição" --body "Implements task-X.Y"
```

### PASSO 8: 🛑 PAUSA PARA AUDITORIA

- ⏸️ Aguarda feedback do Gemini (via você)
- Nenhuma ação até aprovação

### PASSO 9: Aplicar Bloco Documento Mestre

- Você fornece bloco de atualização
- Eu aplico ao DOCUMENTO_MESTRE_SERVIO_AI.md
- Commito: `docs: atualizar Documento Mestre [task-X.Y]`

### PASSO 10: Merge

```bash
gh pr merge --auto --squash
git checkout main
git pull
```

### PASSO 11: Notificar Conclusão

- Task-X.Y ✅ CONCLUÍDA
- Arquivo: `/ai-tasks/day-X/task-X.Y-DONE.md`

### PASSO 12: Próxima Task

- Retornar ao PASSO 1

---

## 🟣 REGRAS SAGRADAS

1. ❌ Nunca implemente SEM task JSON
2. ❌ Nunca altere Documento Mestre SEM bloco do Gemini
3. ❌ Nunca faça merge SEM auditoria
4. ❌ Nunca pule etapa do ciclo
5. ❌ Nunca mexa fora do branch da task
6. ❌ Nunca execute comando fora do protocolo
7. ✅ Sempre teste antes de PR
8. ✅ Sempre aguarde auditoria
9. ✅ Sempre registre em /ai-tasks
10. ✅ Sempre atualize Documento Mestre

---

## 📊 ESTRUTURA /ai-tasks

```
ai-tasks/
├── PROTOCOLO_EXECUTOR.md (este arquivo)
├── TAREFAS_ATIVAS.json (tarefas do dia/sprint)
├── CONTEXTO_GLOBAL.md (contexto compartilhado)
└── day-1/
    ├── task-1.0.md (especificação)
    ├── task-1.0-DONE.md (resultado)
    ├── task-1.1.md
    ├── task-1.1-DONE.md
    └── AUDITORIA.md (feedback Gemini)
```

---

## 🔴 SINAIS DE PERIGO

Se você detectar QUALQUER UMA:

- ❌ Conflito de merge
- ❌ Teste falhando
- ❌ Build quebrando
- ❌ Linter reclamando
- ❌ TypeScript error
- ❌ Security issue
- ❌ Arquitetura violada
- ❌ Documento Mestre desatualizado

**PARAR IMEDIATAMENTE**  
Notificar e aguardar sua instrução.

---

## ✅ INDICADORES DE SUCESSO

- ✅ Task concluída exatamente como especificado
- ✅ Todos os testes passando
- ✅ Build verde
- ✅ Lint limpo
- ✅ PR mergeado
- ✅ Documento Mestre atualizado
- ✅ Arquivo task-X.Y-DONE.md criado

---

## 🚀 PRÓXIMO PASSO

Você: Alimentar `TAREFAS_ATIVAS.json` com a PRIMEIRA task  
Eu: Seguir protocolo até conclusão  
Ciclo: Repetir infinitamente

**Status**: Aguardando primeira task...
