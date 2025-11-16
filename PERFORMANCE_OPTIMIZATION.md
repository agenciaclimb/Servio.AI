# Otimizações de Performance - VS Code

## ✅ Limpeza realizada (28 MB liberados)

- Cache do npm
- Builds antigos (dist/)
- Coverage reports
- Lighthouse reports
- Cache do VS Code

## 🎯 Ações imediatas para melhorar performance

### 1. Fechar terminais ociosos

Você tem **25+ terminais abertos** consumindo memória.

- Feche todos exceto 1-2 ativos
- Terminal → Kill Terminal (ícone lixeira)

### 2. Recarregar VS Code

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 3. Processos pesados identificados

- **VS Code**: 2.5GB RAM (3 processos)
- **WSL**: 583 MB
- **Docker**: 105 MB

### 4. Se ainda estiver lento

#### Opção A: Reiniciar VS Code completamente

1. Salvar tudo
2. Fechar VS Code
3. Abrir Task Manager (Ctrl+Shift+Esc)
4. Finalizar todos os processos "Code.exe"
5. Reabrir VS Code

#### Opção B: Reduzir extensões ativas

As extensões mais pesadas no workspace:

- Gemini Code Assist
- GitHub Copilot
- ESLint
- TypeScript Server

Desabilite temporariamente extensões não essenciais neste workspace.

#### Opção C: Limpar workspace do VS Code

```powershell
# Fechar VS Code primeiro, depois executar:
Remove-Item "$env:APPDATA\Code\CachedData\*" -Recurse -Force
Remove-Item "$env:APPDATA\Code\Cache\*" -Recurse -Force
Remove-Item "$env:APPDATA\Code\GPUCache\*" -Recurse -Force
```

### 5. Otimizações permanentes aplicadas

✅ `.vscode/settings.json` configurado para:

- Excluir node_modules, dist, build de watches
- Aumentar memória TypeScript (4GB)
- Desabilitar ESLint neste workspace
- Reduzir indexação Git

## 📊 Status do sistema

- **Disco C:**: 271 GB livres de 476 GB (57% livre)
- **RAM em uso**: ~2.5GB só do VS Code
- **Terminais abertos**: 25+ (recomendado: 2-3)

## 🔄 Manutenção periódica

Execute mensalmente:

```powershell
.\scripts\system_cleanup.ps1
npm cache clean --force
```
