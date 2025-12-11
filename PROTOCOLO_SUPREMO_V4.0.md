# 🟣 PROTOCOLO SUPREMO — SERVIO.AI — V4.0 (UNIFICADO E ABSOLUTO)

**Data de Ativação**: 11/12/2025  
**Status**: 🔴 ATIVO — Resolução definitiva de todos os problemas de contexto, sincronização e auditoria  
**Versão Anterior**: 3.0 (descontinuada)

---

## 🧠 1. PRINCÍPIO SUPREMO – O DOCUMENTO MESTRE É A LEI ABSOLUTA

O Documento Mestre é:

✔ **Fonte única de verdade**  
✔ **Central de comando do ecossistema**  
✔ **Registro histórico de todas decisões**  
✔ **Manual de auditoria**  
✔ **Matriz de alinhamento para Copilot e Gemini**

**Regra Absoluta**: Nenhuma IA está autorizada a escrever código, gerar PR, criar task ou auditar algo SEM ANTES verificar o Documento Mestre.

---

## 🟦 2. HIERARQUIA OFICIAL — QUEM FAZ O QUÊ (PODERES CLARAMENTE DEFINIDOS)

### 2.1 Gemini – Auditor Global + Guardião do Documento Mestre + Planejador

**Gemini só pode:**

✔ Auditar PRs  
✔ Gerar blocos de atualização do Documento Mestre  
✔ Gerar tasks (JSON)  
✔ Gerar diagnósticos estratégicos  
✔ Validar arquitetura, segurança, fluxo, UX, API  
✔ Validar coerência do Documento Mestre

**Gemini está terminantemente proibido de:**

❌ Escrever código  
❌ Alterar arquivos  
❌ Criar PR  
❌ Resolver conflitos  
❌ Fazer push  
❌ Modificar o repo

### 2.2 Copilot – Executor Técnico Soberano

**Copilot só pode:**

✔ Implementar tasks aprovadas  
✔ Criar branches  
✔ Criar PRs  
✔ Resolver conflitos  
✔ Escrever código  
✔ Atualizar arquivos  
✔ Subir commits  
✔ Rodar scripts automatizados

**Copilot está proibido de:**

❌ Gerar tasks  
❌ Especificar arquitetura  
❌ Fazer auditoria  
❌ Atualizar o Documento Mestre (exceto quando autorizado explicitamente)

### 2.3 Orchestrator — Motor de Tasks

✔ Recebe JSON de tasks do Gemini  
✔ Gera arquivos `ai-tasks/day-X/task-Y.md`  
✔ Cria issues automaticamente  
✔ Padroniza tarefas  
✔ Alimenta Copilot com escopo correto

---

## 🟧 3. ORDEM DO CICLO (OBRIGATÓRIA E IMUTÁVEL)

1. **Gemini gera tasks** (JSON com especificações técnicas)
2. **Orchestrator cria tasks** no repositório (ai-tasks/day-X/task-Y.md + issues)
3. **Copilot implementa a task** (seguindo instruções do Documento Mestre)
4. **Copilot abre PR** (vinculada à task do Orchestrator)
5. **Gemini audita PR** (linha por linha, verificando Documento Mestre)
6. **Gemini gera bloco de atualização** do Documento Mestre
7. **Copilot aplica atualização** no Documento Mestre e faz commit
8. **Gemini valida atualização** (verifica coerência total)
9. **Gemini libera próxima task** (autorização explícita)
10. **Ciclo reinicia**

**❗ Regra Crítica**: Nenhuma task pode avançar sem o Documento Mestre estar atualizado e validado.

---

## 🟥 4. REGRA DE BRANCHES (IMUTÁVEL)

| Branch           | Responsabilidade       | Regra                                |
| ---------------- | ---------------------- | ------------------------------------ |
| `main`           | Produção               | Somente merges aprovados pelo Gemini |
| `develop`        | Integração contínua    | Integração de branches de feature    |
| `feature/task-X` | Execução de task       | Isolada, sem dependências externas   |
| `hotfix/*`       | Correções emergenciais | Merge rápido após auditoria          |

---

## 🟩 5. PROTOCOLO DE AUDITORIA (GEMINI – A+)

**Gemini deve, obrigatoriamente:**

1. Solicitar lista de arquivos modificados
2. Solicitar diffs de cada arquivo
3. Verificar alinhamento com Documento Mestre
4. Verificar impacto em: API, fluxo de dados, segurança, UX
5. Verificar se testes foram criados e **passam**
6. Avaliar risco técnico (breaking changes, migrations, etc.)
7. Emitir **nota de auditoria** (1-10)
8. **Aprovar ou rejeitar PR** com explicação clara
9. **Gerar bloco** de atualização do Documento Mestre:

```
=== ATUALIZAÇÃO DO DOCUMENTO MESTRE — PR #XX ===
[Explicação completa do que foi implementado, impactos, decisões]
[Nenhum código, apenas texto descritivo]
=== FIM ===
```

---

## 🟦 6. PROTOCOLO DE EXECUÇÃO (COPILOT – EXECUTOR ABSOLUTO)

**Copilot deve:**

✔ Trabalhar somente em tasks oficializadas pelo Gemini  
✔ Seguir o Documento Mestre fielmente (sem interpretação)  
✔ Criar PR com título padrão: `feat: Task X.Y - [Descrição]`  
✔ Rodar scripts de validação local antes de PR  
✔ Aguardar bloco de atualização do Documento Mestre vindo do Gemini  
✔ Aplicar atualização **exatamente como recebido**  
✔ Enviar commit com mensagem: `update: Atualização Documento Mestre — PR #XX`  
✔ Atualizar descrição do PR com link para o arquivo de auditoria

---

## 🟨 7. PROTOCOLO DE SINCRONIZAÇÃO ENTRE AMBIENTES

**Ambientes diferentes, fluxo único:**

### VS Code (Local)

- Copilot executa tasks
- Scripts automatizados rodam via Node (auditPR, generateTasks, etc.)
- Documento Mestre é atualizado automaticamente
- Commits são feitos localmente

### GitHub (Remoto)

- PRs são criadas e auditadas
- Histórico completo é mantido
- Auditorias do Gemini são registradas em comentários
- Cada PR vinculada a uma task

### Gemini CLI (IDX ou Terminal)

- Auditorias são executadas
- Tasks são geradas
- Atualizações do Documento Mestre são propostas
- Diagnósticos são emitidos

**Fluxo garantido:**

✔ VS Code sempre faz push após commit  
✔ Gemini sempre trabalha sobre o estado mais recente da `main`/`develop`  
✔ Toda divergência é resolvida via PR + auditoria, **nunca direto**  
✔ Documento Mestre é fonte única de sincronização

---

## 🟪 8. REGRA DE ALINHAMENTO ABSOLUTO

**Se Gemini e Copilot divergirem:**

### O DOCUMENTO MESTRE VENCE.

Não há debate, não há interpretação. O que está escrito no Documento Mestre é a lei.

---

## 🟫 9. PROTOCOLO DE ERRO (CORRUPÇÃO, DIVERGÊNCIA OU FALHA)

**Se algo falhar:**

1. **Gemini emite relatório**: `DIVERGÊNCIA DETECTADA`
2. **Copilot cria branch**: `hotfix/divergence-fix`
3. **Copilot implementa correção**: Seguindo instruções do Gemini
4. **Gemini audita**: Valida correção
5. **Documento Mestre recebe bloco**: De correção
6. **Merge é liberado**: Após validação completa

---

## 🟩 10. NOVA SEÇÃO PERMANENTE NO DOCUMENTO MESTRE

O documento deve sempre conter, no início:

```
## 🔄 Status Atual do Sistema

| Métrica | Status | Detalhes |
|---------|--------|----------|
| PR atual | [número] | [descrição] |
| Task atual | [número] | [descrição] |
| Branch em execução | [nome] | [status] |
| Última atualização do Documento Mestre | [data/hora] | [autor] |
| Última auditoria Gemini | [data/hora] | [nota] |
| Blocos pendentes | [sim/não] | [quais] |
| Fluxo sincronizado | [SIM/NÃO] | [motivo se NÃO] |
```

O sistema **fica impossível de perder contexto**.

---

## 🟦 11. PROTOCOLO DE COMANDO ÚNICO

Você poderá rodar o fluxo completo via VS Code com um único comando:

```bash
npm run servio:full-cycle
```

Ele executa automaticamente:

✔ Gerar tasks (Gemini)  
✔ Orchestrator (criar issue + arquivos)  
✔ Implementar (Copilot)  
✔ Criar PR (GitHub)  
✔ Auditoria (Gemini)  
✔ Atualizar Documento Mestre (Copilot)  
✔ Merge (GitHub)

---

## 👑 12. CONCLUSÃO — SERVIO.AI V4.0

**Você agora tem:**

✔ Um sistema preparado para **desenvolvimento 100% assistido por IA**  
✔ **Fluxo unificado** sem exceções  
✔ **Zero perda de contexto**  
✔ **Documento Mestre como cérebro absoluto**  
✔ **Auditoria rigorosa** em cada mudança  
✔ **PRs validadas** antes de merge  
✔ **VS Code + Gemini funcionando como um time completo**

**Esta é a evolução definitiva.**

---

## 🔄 Status Atual do Sistema (Atualizado 11/12/2025 15:45 BRT)

| Métrica                                    | Status                           | Detalhes                                              |
| ------------------------------------------ | -------------------------------- | ----------------------------------------------------- |
| **PR atual**                               | #25                              | feat(backend): add rate limiting (em desenvolvimento) |
| **Task atual**                             | 2.5                              | Rate Limiting implementação                           |
| **Branch em execução**                     | `feature/task-2.5-rate-limiting` | Ativa                                                 |
| **Última atualização do Documento Mestre** | 11/12/2025 15:45                 | Protocolo v4.0 ativado                                |
| **Última auditoria Gemini**                | 11/12/2025 15:10                 | PR #23 - Nota 9.8/10 ✅                               |
| **Blocos pendentes**                       | Nenhum                           | Sistema 100% sincronizado                             |
| **Fluxo sincronizado**                     | ✅ SIM                           | VS Code ↔ GitHub ↔ Gemini OK                          |

---

**Protocolo Supremo v4.0 ativado com sucesso. O sistema está pronto para operação.**
