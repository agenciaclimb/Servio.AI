# INSTRUÇÕES CRÍTICAS - GEMINI NÃO ABRE

## O que foi feito até agora

1. ✅ Criado `.vscode/settings.json` com configuração EXTREMA:
   - Watchers desabilitados: `"files.watcherExclude": {"**/*": true}`
   - Busca desabilitada: `"search.exclude": {"**/*": true}`
   - TypeScript com 8GB de memória
   - Git completamente desabilitado
   - ESLint, Prettier, hover, sugestões: tudo OFF
   - Limite de 3 arquivos abertos simultaneamente

2. ✅ Backup criado: `.vscode/settings.json.backup`

## PRÓXIMOS PASSOS (FAÇA AGORA)

### Passo 1: Recarregar VS Code

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### Passo 2: Tentar abrir o Gemini

```
Ctrl+Shift+P → "Gemini Code Assist: Open Chat"
```

### Passo 3A: SE AINDA NÃO ABRIR

O problema NÃO é o workspace, é a extensão Gemini em si. Faça:

1. **Verificar autenticação do Gemini:**
   ```
   Ctrl+Shift+P → "Gemini Code Assist: Sign In"
   ```
2. **Ver logs de erro:**
   - `Help → Toggle Developer Tools → Console`
   - Procure por erros com "Gemini" ou "CloudCode"
   - Copie os erros e me envie

3. **Ver Output da extensão:**

   ```
   View → Output → selecione "Gemini Code Assist"
   ```

   - Copie qualquer stacktrace/erro

4. **Reinstalar a extensão Gemini:**
   ```
   Extensions → Gemini Code Assist → Uninstall
   Reload Window
   Extensions → Pesquise "Gemini Code Assist" → Install
   Reload Window
   ```

### Passo 3B: SE ABRIR (improvável com essa config)

Significa que o workspace estava sobrecarregado. Para restaurar funcionalidades:

1. Copie `.vscode/settings.json.backup` de volta:

   ```powershell
   Copy-Item ".vscode\settings.json.backup" ".vscode\settings.json" -Force
   ```

2. Adicione apenas estas linhas ao settings original:
   ```json
   "workbench.editor.limit.enabled": true,
   "workbench.editor.limit.value": 10,
   "extensions.experimental.affinity": {
     "GoogleCloudTools.cloudcode": 1
   }
   ```

## DIAGNÓSTICO FINAL

Se mesmo com TUDO desabilitado o Gemini não abrir, o problema é:

- ❌ Autenticação expirada do Google Cloud
- ❌ Conflito com outra extensão (desinstale Copilot/outras IAs temporariamente)
- ❌ Bug na própria extensão Gemini (reinstalar)
- ❌ Problema de rede/firewall bloqueando APIs do Google

**NÃO É o workspace** - já desabilitamos literalmente tudo que poderia consumir recursos.
