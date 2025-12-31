# Otimização de Performance Node.js - 25/12/2025

## Diagnóstico Inicial

### Processos Node

- **7 processos Node ativos**
- Maior consumo: 599MB + 482MB = **~1GB de RAM**
- Processo crítico: `node.exe` PID 21708 (1117MB após otimização)

### Armazenamento

```
node_modules raiz:       498 MB
backend/node_modules:    117 MB
functions/node_modules:   75 MB
.vite cache:              13 MB
backend/coverage:          8 MB
dist:                      8 MB
──────────────────────────────
Total cache:            ~720 MB
```

### Terminais Abertos

- **12+ terminais PowerShell** detectados
- 1 terminal esbuild ativo
- **Recomendação**: Fechar terminais não utilizados

## Ações Realizadas

### 1. Limpeza de Cache ✓

```powershell
npm cache clean --force
```

- Cache npm limpo completamente
- Proteções desabilitadas para limpeza forçada

### 2. Otimização de node_modules ✓

```powershell
npm dedupe
npm prune
```

- Dependências duplicadas removidas
- Pacotes não utilizados removidos

### 3. Limpeza de Arquivos Temporários ✓

- `.vite/` cache removido
- `dist/` builds antigos removidos
- `backend/coverage/` reports removidos
- `coverage/` raiz removido

### 4. Scripts de Manutenção Criados ✓

Adicionados ao [package.json](package.json):

```json
"clean": "npm run clean:cache && npm run clean:build",
"clean:cache": "npm cache clean --force && rimraf node_modules/.vite node_modules/.cache",
"clean:build": "rimraf dist backend/coverage coverage .vite",
"clean:all": "npm run clean && rimraf node_modules backend/node_modules functions/node_modules && npm install",
"optimize": "npm run clean && npm dedupe && npm prune"
```

#### Instalação Necessária

```bash
npm install -D rimraf
```

✓ Instalado (8 pacotes adicionados)

## Novos Comandos Disponíveis

| Comando               | Descrição                            | Quando Usar        |
| --------------------- | ------------------------------------ | ------------------ |
| `npm run clean`       | Limpa cache + builds                 | Semanalmente       |
| `npm run clean:cache` | Limpa apenas cache (.vite, .cache)   | Problemas de cache |
| `npm run clean:build` | Limpa apenas builds (dist, coverage) | Antes de deploy    |
| `npm run clean:all`   | Limpeza total + reinstala deps       | Problemas graves   |
| `npm run optimize`    | Limpa + dedupe + prune               | Mensalmente        |

## Resultados

### Após Otimização

- ✓ Cache npm: **limpo**
- ✓ node_modules: **otimizado**
- ✓ Processos Node: **6 ativos** (1 removido)
- ⚠️ Processo principal: **1117MB** (aumentou devido ao trabalho)

### Espaço Liberado

- Cache npm: ~variável
- Builds antigos: ~30-50 MB
- Total estimado: **50-100 MB**

## Recomendações

### Manutenção Periódica

1. **Semanalmente**
   - Execute `npm run clean`
   - Feche terminais não utilizados

2. **Mensalmente**
   - Execute `npm run optimize`
   - Verifique dependências: `npm run deps:check`
   - Atualize deps: `npm run deps:update`

3. **Antes de Deploy**
   - Execute `npm run clean:build`
   - Execute `npm run validate:prod`

### Gestão de Processos

```powershell
# Ver processos Node
Get-Process node* | Select-Object ProcessName, Id, @{Name="MemoryMB";Expression={[math]::Round($_.WS/1MB,2)}} | Sort-Object MemoryMB -Descending

# Matar processo específico (se necessário)
Stop-Process -Id <PID> -Force
```

### Gestão de Terminais

- **Limite ideal**: 3-5 terminais ativos
- Feche terminais idle regularmente
- Use `Ctrl+D` ou `exit` para fechar corretamente

### Otimização de Memória

Se processos Node continuarem pesados:

```powershell
# Aumentar limite de memória Node (temporário)
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Ou adicionar ao .env
NODE_OPTIONS=--max-old-space-size=4096
```

### Monitoramento Contínuo

```powershell
# Ver uso de memória em tempo real
while ($true) {
    Clear-Host
    Get-Process node* | Select-Object ProcessName, Id, @{Name="MemoryMB";Expression={[math]::Round($_.WS/1MB,2)}} | Sort-Object MemoryMB -Descending | Format-Table -AutoSize
    Start-Sleep -Seconds 5
}
```

## Próximos Passos

1. **Imediato**
   - Fechar terminais não utilizados
   - Reiniciar VS Code se necessário
   - Testar performance: `npm run dev`

2. **Curto Prazo** (esta semana)
   - Executar `npm run optimize` uma vez
   - Verificar se há dependências desnecessárias: `npm run deps:check`
   - Considerar remover dependências não utilizadas

3. **Médio Prazo** (este mês)
   - Implementar workflow de limpeza automática (pre-commit hook?)
   - Considerar usar pnpm ou yarn v2+ para melhor gestão de deps
   - Avaliar migração de ferramentas pesadas (ex: ESLint → Biome)

## Referências

- [package.json](package.json) - Scripts de limpeza
- [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md) - Comandos do projeto
- [DOCUMENTO_MESTRE_SERVIO_AI.md](DOCUMENTO_MESTRE_SERVIO_AI.md) - Arquitetura

## Status

- ✅ Diagnóstico completo
- ✅ Limpeza executada
- ✅ Scripts criados
- ✅ Documentação gerada
- ⚠️ Monitoramento contínuo necessário

**Desenvolvedor**: Continue normalmente. Execute `npm run clean` semanalmente.
