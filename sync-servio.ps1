#Requires -Version 5.1
<#
.SYNOPSIS
    Script de sincronização Git para Servio.AI (IDX + Local + GitHub)

.DESCRIPTION
    Automatiza o workflow de sync entre Google IDX, desenvolvimento local e GitHub.
    - Verifica branch atual
    - Pull das últimas mudanças
    - Mostra status de arquivos modificados
    - Facilita commit e push
    - Detecta conflitos

.EXAMPLE
    .\sync-servio.ps1
    Executa sync completo interativo

.EXAMPLE
    .\sync-servio.ps1 -Mode Pull
    Apenas pull do GitHub

.EXAMPLE
    .\sync-servio.ps1 -Mode Push -Message "feat: nova feature"
    Commit e push direto

.NOTES
    Autor: GitHub Copilot + Servio.AI Team
    Última Atualização: 05/12/2025
#>

param(
    [Parameter()]
    [ValidateSet('Full', 'Pull', 'Push', 'Status', 'Auto')]
    [string]$Mode = 'Full',
    
    [Parameter()]
    [string]$Message = '',
    
    [Parameter()]
    [switch]$Force,
    
    [Parameter()]
    [switch]$AutoCommit,
    
    [Parameter()]
    [switch]$Silent
)

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Text,
        [string]$Color = 'White',
        [switch]$NoNewline
    )
    
    $colors = @{
        'Success' = 'Green'
        'Error' = 'Red'
        'Warning' = 'Yellow'
        'Info' = 'Cyan'
        'Header' = 'Magenta'
    }
    
    $consoleColor = if ($colors.ContainsKey($Color)) { $colors[$Color] } else { $Color }
    
    if ($NoNewline) {
        Write-Host $Text -ForegroundColor $consoleColor -NoNewline
    } else {
        Write-Host $Text -ForegroundColor $consoleColor
    }
}

# Banner
function Show-Banner {
    Write-ColorOutput "`n╔═══════════════════════════════════════════╗" -Color Header
    Write-ColorOutput "║   🚀 SERVIO.AI - Git Sync Automation     ║" -Color Header
    Write-ColorOutput "║      IDX ↔ Local ↔ GitHub                ║" -Color Header
    Write-ColorOutput "╚═══════════════════════════════════════════╝`n" -Color Header
}

# Verifica se está em repo Git
function Test-GitRepo {
    if (-not (Test-Path .git)) {
        Write-ColorOutput "❌ ERRO: Não está em um repositório Git!" -Color Error
        Write-ColorOutput "   Execute este script na raiz do projeto (c:\Users\JE\servio.ai)" -Color Warning
        exit 1
    }
}

# Pega branch atual
function Get-CurrentBranch {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ ERRO: Não foi possível determinar a branch atual" -Color Error
        exit 1
    }
    return $branch.Trim()
}

# Verifica status do Git
function Get-GitStatus {
    $status = git status --porcelain 2>$null
    return $status
}

# Pull do GitHub
function Invoke-GitPull {
    param([string]$Branch)
    
    Write-ColorOutput "`n📥 Buscando atualizações do GitHub..." -Color Info
    
    # Fetch primeiro
    git fetch origin 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Erro no fetch do repositório" -Color Error
        return $false
    }
    
    # Verifica se há mudanças remotas
    $local = git rev-parse HEAD
    $remote = git rev-parse "origin/$Branch"
    
    if ($local -eq $remote) {
        Write-ColorOutput "✅ Seu repositório já está atualizado!" -Color Success
        return $true
    }
    
    # Pull
    Write-ColorOutput "   Aplicando mudanças de origin/$Branch..." -Color Info
    $pullOutput = git pull origin $Branch 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ ERRO durante o pull:" -Color Error
        Write-ColorOutput $pullOutput -Color Error
        
        if ($pullOutput -match "CONFLICT") {
            Write-ColorOutput "`n⚠️  CONFLITOS DE MERGE DETECTADOS!" -Color Warning
            Write-ColorOutput "   Resolva os conflitos manualmente:" -Color Warning
            Write-ColorOutput "   1. Edite os arquivos conflitantes" -Color Info
            Write-ColorOutput "   2. git add <arquivo>" -Color Info
            Write-ColorOutput "   3. git commit" -Color Info
            Write-ColorOutput "   4. Execute este script novamente" -Color Info
        }
        return $false
    }
    
    Write-ColorOutput "✅ Pull concluído com sucesso!" -Color Success
    
    # Mostra resumo das mudanças
    $changes = $pullOutput | Select-String -Pattern "(\d+) file.*changed"
    if ($changes) {
        Write-ColorOutput "   $($changes.Matches.Value)" -Color Info
    }
    
    return $true
}

# Mostra status
function Show-GitStatus {
    $status = Get-GitStatus
    
    if (-not $status) {
        Write-ColorOutput "`n✅ Working tree limpo - nenhuma mudança pendente" -Color Success
        return @{
            HasChanges = $false
            Files = @()
        }
    }
    
    Write-ColorOutput "`n📝 Arquivos modificados:" -Color Warning
    
    $files = @()
    foreach ($line in $status) {
        $statusCode = $line.Substring(0, 2)
        $file = $line.Substring(3)
        
        $symbol = switch -Regex ($statusCode) {
            '^M'  { '📝'; break }  # Modified
            '^A'  { '➕'; break }  # Added
            '^D'  { '🗑️ '; break }  # Deleted
            '^\?\?' { '❓'; break }  # Untracked
            '^R'  { '🔄'; break }  # Renamed
            default { '  ' }
        }
        
        Write-ColorOutput "   $symbol $file" -Color Info
        $files += $file
    }
    
    return @{
        HasChanges = $true
        Files = $files
    }
}

# Commit e push
function Invoke-GitCommitPush {
    param(
        [string]$Branch,
        [string]$CommitMessage,
        [bool]$Interactive = $true
    )
    
    $statusInfo = Show-GitStatus
    
    if (-not $statusInfo.HasChanges) {
        Write-ColorOutput "`n✅ Nada para commitar!" -Color Success
        return $true
    }
    
    # Mensagem de commit
    if (-not $CommitMessage -and $Interactive) {
        Write-ColorOutput "`n💬 Digite a mensagem do commit:" -Color Info
        Write-ColorOutput "   Formato: <tipo>: <descrição>" -Color Info
        Write-ColorOutput "   Tipos: feat, fix, docs, style, refactor, test, chore" -Color Info
        Write-ColorOutput -NoNewline "   > " -Color Info
        $CommitMessage = Read-Host
        
        if (-not $CommitMessage) {
            Write-ColorOutput "❌ Commit cancelado - mensagem vazia" -Color Error
            return $false
        }
    }
    
    # Add all
    Write-ColorOutput "`n📦 Adicionando arquivos ao stage..." -Color Info
    git add . 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Erro ao adicionar arquivos" -Color Error
        return $false
    }
    
    # Commit
    Write-ColorOutput "💾 Criando commit..." -Color Info
    $commitOutput = git commit -m $CommitMessage 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Erro no commit:" -Color Error
        Write-ColorOutput $commitOutput -Color Error
        return $false
    }
    
    Write-ColorOutput "✅ Commit criado com sucesso!" -Color Success
    
    # Confirmação para push
    if ($Interactive -and -not $Force) {
        Write-ColorOutput -NoNewline "`n🚀 Fazer push para origin/$Branch? (S/n): " -Color Warning
        $confirm = Read-Host
        
        if ($confirm -and $confirm -ne 'S' -and $confirm -ne 's' -and $confirm -ne 'Y' -and $confirm -ne 'y') {
            Write-ColorOutput "⏸️  Push cancelado pelo usuário" -Color Warning
            Write-ColorOutput "   Execute 'git push origin $Branch' manualmente quando estiver pronto" -Color Info
            return $true
        }
    }
    
    # Push
    Write-ColorOutput "`n⬆️  Fazendo push para GitHub..." -Color Info
    $pushOutput = git push origin $Branch 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ ERRO durante o push:" -Color Error
        Write-ColorOutput $pushOutput -Color Error
        
        if ($pushOutput -match "rejected") {
            Write-ColorOutput "`n⚠️  Push rejeitado - provavelmente há commits remotos novos" -Color Warning
            Write-ColorOutput "   Execute novamente o script para fazer pull primeiro" -Color Info
        }
        return $false
    }
    
    Write-ColorOutput "✅ Push concluído com sucesso!" -Color Success
    return $true
}

# Função principal
function Invoke-SyncWorkflow {
    param(
        [string]$Mode,
        [string]$Message
    )
    
    Show-Banner
    Test-GitRepo
    
    $branch = Get-CurrentBranch
    Write-ColorOutput "📍 Branch atual: $branch" -Color Info
    
    # Warning se não for main
    if ($branch -ne 'main' -and $branch -ne 'master') {
        Write-ColorOutput "⚠️  Você está em uma branch de feature: $branch" -Color Warning
    }
    
    # Executa ação baseado no modo
    switch ($Mode) {
        'Pull' {
            $success = Invoke-GitPull -Branch $branch
            if ($success) {
                Show-GitStatus | Out-Null
            }
        }
        
        'Push' {
            $success = Invoke-GitCommitPush -Branch $branch -CommitMessage $Message -Interactive ($Message -eq '')
        }
        
        'Status' {
            Show-GitStatus | Out-Null
            
            # Mostra info adicional
            Write-ColorOutput "`n📊 Informações adicionais:" -Color Info
            $ahead = git rev-list --count "origin/$branch..$branch" 2>$null
            $behind = git rev-list --count "$branch..origin/$branch" 2>$null
            
            if ($ahead -gt 0) {
                Write-ColorOutput "   ⬆️  $ahead commit(s) à frente do GitHub" -Color Warning
            }
            if ($behind -gt 0) {
                Write-ColorOutput "   ⬇️  $behind commit(s) atrás do GitHub" -Color Warning
            }
            if ($ahead -eq 0 -and $behind -eq 0) {
                Write-ColorOutput "   ✅ Sincronizado com GitHub" -Color Success
            }
        }
        
        'Full' {
            # Workflow completo: Pull → Status → Commit/Push
            Write-ColorOutput "`n🔄 Iniciando workflow completo de sync..." -Color Info
            
            # 1. Pull
            $pullSuccess = Invoke-GitPull -Branch $branch
            if (-not $pullSuccess) {
                Write-ColorOutput "`n❌ Sync interrompido devido a erros no pull" -Color Error
                exit 1
            }
            
            # 2. Status
            $statusInfo = Show-GitStatus
            
            # 3. Commit/Push se houver mudanças
            if ($statusInfo.HasChanges) {
                if ($AutoCommit -or $Force) {
                    # Auto commit sem perguntar
                    $autoMsg = if ($Message) { $Message } else { "chore: auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
                    Invoke-GitCommitPush -Branch $branch -CommitMessage $autoMsg -Interactive $false
                } else {
                    Write-ColorOutput -NoNewline "`n💾 Deseja commitar e fazer push das mudanças? (S/n): " -Color Warning
                    $confirm = Read-Host
                    
                    if (-not $confirm -or $confirm -eq 'S' -or $confirm -eq 's' -or $confirm -eq 'Y' -or $confirm -eq 'y') {
                        Invoke-GitCommitPush -Branch $branch -CommitMessage $Message -Interactive $true
                    } else {
                        Write-ColorOutput "⏸️  Commit/push adiado" -Color Warning
                    }
                }
            }
        }
        
        'Auto' {
            # Modo completamente automático: Pull → Auto Commit/Push
            if (-not $Silent) {
                Write-ColorOutput "`n⚡ Modo automático ativado..." -Color Info
            }
            
            # 1. Pull silencioso
            git fetch origin 2>&1 | Out-Null
            $local = git rev-parse HEAD
            $remote = git rev-parse "origin/$branch"
            
            if ($local -ne $remote) {
                git pull origin $branch 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0 -and -not $Silent) {
                    Write-ColorOutput "✅ Pull concluído" -Color Success
                }
            }
            
            # 2. Auto commit se houver mudanças
            $status = Get-GitStatus
            if ($status) {
                git add . 2>&1 | Out-Null
                $autoMsg = if ($Message) { $Message } else { "chore: auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
                git commit -m $autoMsg 2>&1 | Out-Null
                git push origin $branch 2>&1 | Out-Null
                
                if ($LASTEXITCODE -eq 0 -and -not $Silent) {
                    Write-ColorOutput "✅ Commit e push automáticos concluídos" -Color Success
                }
            } elseif (-not $Silent) {
                Write-ColorOutput "✅ Nada para commitar" -Color Success
            }
        }
    }
    
    Write-ColorOutput "`n✨ Sync workflow concluído!" -Color Success
    Write-ColorOutput "───────────────────────────────────────────`n" -Color Header
}

# Entry point
try {
    Invoke-SyncWorkflow -Mode $Mode -Message $Message
} catch {
    Write-ColorOutput "`n❌ ERRO INESPERADO:" -Color Error
    Write-ColorOutput $_.Exception.Message -Color Error
    Write-ColorOutput $_.ScriptStackTrace -Color Error
    exit 1
}
