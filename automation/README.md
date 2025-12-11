# 🤖 Sistema de Automação Servio.AI

Sistema completo de automação para desenvolvimento AI-driven usando Gemini CLI + GitHub CLI + VS Code.

## 📋 Pré-requisitos

### 1. Instalar Gemini CLI

```powershell
npm install -g @google/generative-ai
```

### 2. Configurar API Key

```powershell
setx GEMINI_API_KEY "sua_chave_aqui"
```

**⚠️ Reinicie o VS Code após configurar a variável de ambiente!**

### 3. Verificar instalação

```powershell
node -e "console.log(process.env.GEMINI_API_KEY)"
```

Deve exibir sua chave (não vazia).

---

## 🗂️ Estrutura de Pastas

```
/automation
├── gemini/
│   ├── auditPR.js           # Auditoria de Pull Requests
│   ├── updateMasterDoc.js   # Atualização do Documento Mestre
│   ├── generateTasks.js     # Geração de tasks JSON
│   └── applyFix.js          # Gera instruções para fix de issues
├── github/
│   ├── createPR.js          # Criação automática de PR
│   └── mergePR.js           # Merge automático de PR
└── orchestrator/
    └── (vazio - reservado para futuro)

/automation_output/          # Outputs gerados pelas automações
```

---

## 🚀 Como Usar

### Método 1: Via VS Code Tasks (Recomendado)

**Ctrl+Shift+P** → "Tasks: Run Task" → Escolha:

- **🔍 Auditar PR** - Audita um PR específico
- **📝 Atualizar Documento Mestre** - Aplica bloco de atualização
- **🎯 Gerar Tasks do Dia** - Cria tasks-dia-gerado.json
- **🔧 Gerar Fix para Issue** - Cria instruções para fix
- **🚀 Criar PR** - Cria PR do branch atual
- **✅ Merge PR** - Faz merge de PR aprovado

### Método 2: Via npm scripts

```powershell
# Auditar PR #23
npm run audit-pr 23

# Atualizar Documento Mestre
npm run update-master automation_output/audit_PR_23.md

# Gerar tasks do dia
npm run generate-tasks

# Gerar fix para issue #16
npm run apply-fix 16

# Criar PR
npm run create-pr "feat: Nova funcionalidade" main

# Merge PR #25
npm run merge-pr 25
```

---

## 📝 Fluxo Completo de Trabalho

### 1️⃣ **Gemini Audita PR**

```powershell
npm run audit-pr 23
```

**Saída**: `automation_output/audit_PR_23.md`

Contém:

- ✅/❌ Veredito
- Lista de violações
- Sugestões de melhoria
- Bloco de atualização para Documento Mestre

---

### 2️⃣ **Atualizar Documento Mestre**

```powershell
npm run update-master automation_output/audit_PR_23.md
```

**Ação**: Adiciona bloco de atualização ao final do `DOCUMENTO_MESTRE_SERVIO_AI.md`

---

### 3️⃣ **Copilot Faz Commit**

No VS Code:

```
Copilot, commit e envie com a mensagem:
"update: Auditoria PR #23 - Documento Mestre atualizado"
```

---

### 4️⃣ **Gerar Novas Tasks**

```powershell
npm run generate-tasks
```

**Saída**: `tasks-dia-gerado.json`

Gemini analisa o Documento Mestre e gera próximas tasks automaticamente.

---

### 5️⃣ **Processar Tasks com Orchestrator**

```powershell
cd C:\Users\JE\servio-ai-orchestrator
node src/orchestrator.js ../servio.ai/tasks-dia-gerado.json
```

**Resultado**:

- ✅ Issues criadas no GitHub
- ✅ Arquivos markdown em `ai-tasks/day-X/`
- ✅ Labels aplicadas
- ✅ README.md atualizado

---

## 🔧 Resolver Issues

### Quando Gemini encontra um problema:

```powershell
npm run apply-fix 16
```

**Saída**: `automation_output/fix_issue_16.md`

Contém:

- Contexto do problema
- Solução proposta
- Instruções detalhadas para Copilot
- Critérios de aceitação

### Copilot Implementa:

```
Copilot, implemente o fix seguindo:
automation_output/fix_issue_16.md
```

---

## 📊 Outputs Gerados

Todos os arquivos gerados ficam em `automation_output/`:

```
automation_output/
├── audit_PR_23.md          # Auditoria do PR #23
├── audit_PR_25.md          # Auditoria do PR #25
├── fix_issue_16.md         # Instruções para issue #16
├── fix_issue_17.md         # Instruções para issue #17
└── last_pr.txt             # Número do último PR criado
```

---

## ⚡ Atalhos Rápidos

### Criar PR rapidamente:

```powershell
npm run create-pr "feat: Task 2.5 - Rate Limiting"
```

### Merge PR aprovado:

```powershell
npm run merge-pr 25
```

---

## 🎯 Protocolo para Copilot

### Commit + Push:

```
Copilot, commit e envie com:
"update: Implementação Task 2.5"
```

### Criar PR:

```
Copilot, crie PR com título:
"Task 2.5 - Rate Limiting Implementation"
```

### Implementar Fix:

```
Copilot, implemente seguindo:
automation_output/fix_issue_16.md
```

---

## 🔴 Protocolo para Gemini

O Gemini **NUNCA** codifica. Apenas:

1. ✅ Audita PRs
2. ✅ Gera instruções técnicas
3. ✅ Atualiza Documento Mestre
4. ✅ Cria tasks JSON
5. ✅ Aprova/Rejeita PRs

---

## 🟢 Protocolo para Copilot

O Copilot **SEMPRE** executa. Apenas:

1. ✅ Implementa código
2. ✅ Cria testes
3. ✅ Faz commits
4. ✅ Cria PRs
5. ✅ Segue instruções do Gemini

---

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY não definida"

```powershell
setx GEMINI_API_KEY "sua_chave"
```

Reinicie o VS Code.

### Erro: "gh: command not found"

Instale GitHub CLI: https://cli.github.com/

### Erro: "Cannot find module '@google/generative-ai'"

```powershell
npm install -g @google/generative-ai
```

### Script não executa no VS Code

Verifique se está no diretório raiz do projeto (`servio.ai`).

---

## 📚 Referências

- **Documento Mestre**: `DOCUMENTO_MESTRE_SERVIO_AI.md`
- **Orchestrator**: `C:\Users\JE\servio-ai-orchestrator\`
- **Tasks**: `ai-tasks/`

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] `@google/generative-ai` instalado globalmente
- [ ] `GEMINI_API_KEY` configurada
- [ ] GitHub CLI (`gh`) instalado
- [ ] VS Code aberto na pasta `servio.ai`
- [ ] Testou `npm run generate-tasks`
- [ ] Testou `npm run audit-pr 23`

---

**Sistema operacional desde**: 11/12/2025  
**Versão**: 1.0.0  
**Status**: ✅ Produção Ready
