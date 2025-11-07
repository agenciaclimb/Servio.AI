# 🔧 Guia Rápido - Resolver Travamento do Gemini

## Problema

O Gemini Code Assist trava quando o workspace Servio.AI está aberto (funciona em outros projetos).

## Causa

Extension Host sobrecarregado por:

- Indexação de `doc/` (arquivos grandes como DOCUMENTO_MESTRE)
- Watchers em `node_modules/`, `dist/`, `coverage/`
- TypeScript server sem memória suficiente
- Git indexando milhares de arquivos

## Solução Aplicada

### 1. `.vscode/settings.json` otimizado

- ✅ Excluído `doc/`, `node_modules`, `dist`, `build`, `coverage` de watchers
- ✅ TypeScript server com 4GB de RAM
- ✅ Desabilitado ESLint, Prettier no workspace (mantém global)
- ✅ Git: apenas arquivos abertos, sem autofetch
- ✅ Extension affinity para isolar Gemini/CloudCode

### 2. `.vscodeignore` criado

- ✅ Lista de exclusões para reduzir carga do Extension Host
- ✅ Ignora logs, builds, node_modules, doc/gen-lang-client-\*.json

### 3. Arquivos grandes verificados

- ✅ Nenhum arquivo > 10MB fora de node_modules encontrado

## Como Testar Agora

### Passo 1: Recarregar VS Code

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### Passo 2: Aguardar carregamento completo

- Espere até o ícone de sincronização parar (barra inferior)
- Aguarde ~30 segundos para extensões inicializarem

### Passo 3: Abrir Gemini

```
Ctrl+Shift+P → "Gemini Code Assist: Open Chat"
```

ou

```
Clique no ícone do Gemini na barra lateral esquerda
```

### Passo 4: Verificar autenticação

```
Ctrl+Shift+P → "Gemini Code Assist: Sign In"
```

## Se Ainda Travar

### Opção A: Verificar logs

1. `View → Output`
2. Dropdown: selecione **"Gemini Code Assist"**
3. Copie erros e me envie

### Opção B: Developer Tools

1. `Help → Toggle Developer Tools`
2. Aba **Console**
3. Procure erros em vermelho relacionados a "gemini" ou "extension host"
4. Copie stacktrace e me envie

### Opção C: Abrir subpasta isolada

```powershell
cd "C:\Users\JE\servio.ai\src"
code .
```

Teste o Gemini nesse workspace mínimo.

### Opção D: Desativar temporariamente outras extensões

```
Ctrl+Shift+P → "Extensions: Show Running Extensions"
```

- Veja quais consomem mais recursos
- Desative temporariamente as pesadas (ex: ESLint, Prettier, GitLens)

## Configurações Aplicadas (Resumo)

| Configuração       | Antes          | Depois          |
| ------------------ | -------------- | --------------- |
| TS Server Memory   | 2GB (padrão)   | 4GB             |
| Watchers ativos    | ~5000 arquivos | ~500 arquivos   |
| ESLint workspace   | ✅ Ativo       | ❌ Desabilitado |
| Prettier workspace | ✅ Ativo       | ❌ Desabilitado |
| Git autofetch      | ✅ Ativo       | ❌ Desabilitado |
| Doc/ indexado      | ✅ Sim         | ❌ Não          |

## Arquivos Alterados

- ✅ `.vscode/settings.json` - Configurações de performance
- ✅ `.vscodeignore` - Exclusões de indexação

**Nenhum arquivo crítico do projeto foi comprometido.**

## Próximos Passos

1. Reload Window agora
2. Teste o Gemini Chat
3. Se funcionar: ✅ Problema resolvido!
4. Se não: me envie os logs (Opção A ou B acima)
