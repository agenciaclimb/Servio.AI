# ⚠️ AÇÃO NECESSÁRIA - Configurar GEMINI_API_KEY

## Status Atual

- ✅ Sistema de automação instalado
- ✅ Scripts criados em `automation/`
- ✅ VS Code tasks configuradas
- ✅ npm scripts adicionados
- ✅ @google/generative-ai instalado
- ❌ **GEMINI_API_KEY não configurada**

---

## 🔧 Próximo Passo OBRIGATÓRIO

### 1. Obter API Key do Gemini

Acesse: https://aistudio.google.com/app/apikey

### 2. Configurar variável de ambiente

**No PowerShell (como administrador)**:

```powershell
setx GEMINI_API_KEY "sua_chave_aqui"
```

**OU adicione ao arquivo .env** (se preferir):

```
GEMINI_API_KEY=sua_chave_aqui
```

### 3. Reiniciar VS Code

**⚠️ IMPORTANTE**: Feche completamente o VS Code e abra novamente!

### 4. Verificar se funcionou

```powershell
node -e "console.log(process.env.GEMINI_API_KEY ? '✅ OK' : '❌ FALTA')"
```

---

## 📂 Arquivos Criados

### Scripts de Automação

✅ `automation/gemini/auditPR.js` - Audita PRs  
✅ `automation/gemini/updateMasterDoc.js` - Atualiza Documento Mestre  
✅ `automation/gemini/generateTasks.js` - Gera tasks JSON  
✅ `automation/gemini/applyFix.js` - Cria instruções para fixes  
✅ `automation/github/createPR.js` - Cria PRs  
✅ `automation/github/mergePR.js` - Faz merge de PRs

### Configurações

✅ `.vscode/tasks.json` - 6 tasks configuradas  
✅ `package.json` - 6 npm scripts adicionados  
✅ `automation/README.md` - Documentação completa  
✅ `GUIA_RAPIDO_AUTOMACAO.md` - Guia de uso

### Diretórios

✅ `automation_output/` - Para outputs temporários

---

## 🚀 Quando GEMINI_API_KEY estiver configurada

### Testar o sistema:

```powershell
# Gerar tasks automáticas
npm run generate-tasks

# Saída esperada: tasks-dia-gerado.json criado
```

### Usar via VS Code:

1. **Ctrl+Shift+P**
2. "Tasks: Run Task"
3. Escolher uma das 6 tasks disponíveis

---

## 📚 Documentação

- **README completo**: `automation/README.md`
- **Guia rápido**: `GUIA_RAPIDO_AUTOMACAO.md`
- **Protocolo Supremo**: `DOCUMENTO_MESTRE_SERVIO_AI.md`

---

## ✅ Sistema Pronto Para Uso

Após configurar `GEMINI_API_KEY`, você terá:

✅ Auditoria automática de PRs via Gemini  
✅ Atualização automática do Documento Mestre  
✅ Geração automática de tasks  
✅ Criação automática de instruções de fix  
✅ Integração completa Gemini ↔ Copilot ↔ GitHub  
✅ Zero dependência do IDX  
✅ 100% local no VS Code

---

**Criado em**: 11/12/2025  
**Status**: ⚠️ Aguardando configuração de GEMINI_API_KEY  
**Próxima ação**: Configure a API key e teste `npm run generate-tasks`
