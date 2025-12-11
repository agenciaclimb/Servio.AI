# 🚀 GUIA RÁPIDO - Sistema de Automação

## ✅ Setup Inicial (apenas 1x)

### 1. Instalar Gemini CLI

```powershell
npm install -g @google/generative-ai
```

### 2. Configurar API Key

```powershell
setx GEMINI_API_KEY "SUA_CHAVE_AQUI"
```

### 3. Reiniciar VS Code

**⚠️ IMPORTANTE**: Feche e abra o VS Code novamente!

### 4. Verificar instalação

```powershell
node -e "console.log(process.env.GEMINI_API_KEY ? '✅ OK' : '❌ FALTA')"
```

---

## 🔄 Fluxo de Trabalho Diário

### CENÁRIO 1: Auditar um PR

**Passo 1**: Executar auditoria

```powershell
npm run audit-pr 23
```

**Passo 2**: Revisar output

- Arquivo gerado: `automation_output/audit_PR_23.md`
- Verificar veredito: ✅ Aprovado ou ❌ Rejeitado

**Passo 3**: Se aprovado, atualizar Documento Mestre

```powershell
npm run update-master automation_output/audit_PR_23.md
```

**Passo 4**: Commit via Copilot

```
Copilot, commit e envie com:
"update: Auditoria PR #23 - aprovado por Gemini"
```

---

### CENÁRIO 2: Gerar Tasks do Dia

**Passo 1**: Executar gerador

```powershell
npm run generate-tasks
```

**Passo 2**: Revisar JSON gerado

- Arquivo: `tasks-dia-gerado.json`

**Passo 3**: Processar com Orchestrator

```powershell
cd C:\Users\JE\servio-ai-orchestrator
node src/orchestrator.js ../servio.ai/tasks-dia-gerado.json
```

**Resultado**: Issues criadas automaticamente no GitHub!

---

### CENÁRIO 3: Resolver Issue Reportada

**Passo 1**: Gemini gera instruções

```powershell
npm run apply-fix 16
```

**Passo 2**: Copilot implementa

```
Copilot, implemente o fix seguindo:
automation_output/fix_issue_16.md
```

**Passo 3**: Criar PR

```powershell
npm run create-pr "fix: Issue #16 - Corrigido conforme auditoria"
```

---

### CENÁRIO 4: Criar e Mergear PR

**Criar PR**:

```powershell
npm run create-pr "feat: Task 2.5 implementada" main
```

**Verificar CI**: Aguardar builds passarem

**Auditar PR**:

```powershell
npm run audit-pr 25
```

**Merge (se aprovado)**:

```powershell
npm run merge-pr 25
```

---

## 🎯 Atalhos Via VS Code

### Via Tasks (Ctrl+Shift+P → "Tasks: Run Task")

1. **🔍 Auditar PR**
   - Input: número do PR
   - Output: `automation_output/audit_PR_X.md`

2. **📝 Atualizar Documento Mestre**
   - Input: arquivo de auditoria
   - Ação: adiciona bloco ao Documento Mestre

3. **🎯 Gerar Tasks do Dia**
   - Sem input
   - Output: `tasks-dia-gerado.json`

4. **🔧 Gerar Fix para Issue**
   - Input: número da issue
   - Output: `automation_output/fix_issue_X.md`

5. **🚀 Criar PR**
   - Input: título do PR + branch base
   - Ação: cria PR no GitHub

6. **✅ Merge PR**
   - Input: número do PR
   - Ação: faz merge squash + delete branch

---

## 📝 Comandos de Emergência

### Verificar se Gemini está OK

```powershell
node automation/gemini/generateTasks.js
```

Se funcionar → ✅ Sistema OK

### Revalidar GEMINI_API_KEY

```powershell
$env:GEMINI_API_KEY
```

Deve mostrar a chave (não vazio)

### Reinstalar Gemini CLI

```powershell
npm uninstall -g @google/generative-ai
npm install -g @google/generative-ai
```

---

## 🔴 Protocolo Gemini (Auditor)

**APENAS**:

- ✅ Auditar código
- ✅ Gerar instruções
- ✅ Criar tasks JSON
- ✅ Atualizar Documento Mestre

**NUNCA**:

- ❌ Implementar código
- ❌ Fazer commits
- ❌ Criar PRs diretamente

---

## 🟢 Protocolo Copilot (Executor)

**APENAS**:

- ✅ Implementar código
- ✅ Criar testes
- ✅ Fazer commits
- ✅ Criar PRs

**NUNCA**:

- ❌ Auditar código
- ❌ Tomar decisões de arquitetura
- ❌ Alterar Documento Mestre sem aprovação

---

## 📊 Status dos Arquivos

### Gerados automaticamente (não commitar):

- `automation_output/*.md`
- `automation_output/*.txt`
- `tasks-dia-gerado.json`

### Versionados (commitar):

- `automation/**/*.js` (scripts)
- `.vscode/tasks.json` (configuração)
- `package.json` (npm scripts)
- `automation/README.md` (documentação)

---

## 🐛 Troubleshooting Rápido

| Erro                                         | Solução                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `GEMINI_API_KEY não definida`                | `setx GEMINI_API_KEY "chave"` + reiniciar VS Code |
| `Cannot find module '@google/generative-ai'` | `npm install -g @google/generative-ai`            |
| `gh: command not found`                      | Instalar GitHub CLI: https://cli.github.com/      |
| Script não roda                              | Verificar se está em `C:\Users\JE\servio.ai`      |
| Auditoria vazia                              | Verificar se PR existe e tem commits              |

---

**Última atualização**: 11/12/2025  
**Versão do Sistema**: 1.0.0  
**Status**: ✅ Operacional
