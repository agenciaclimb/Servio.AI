#Requires -Version 5.1
<#
.SYNOPSIS
    Aliases rápidos para sync Git do Servio.AI

.DESCRIPTION
    Carrega aliases convenientes para comandos git frequentes.
    Adicione ao seu $PROFILE para ter sempre disponível.

.EXAMPLE
    # Carregar aliases na sessão atual
    . .\sync-aliases.ps1

    # Adicionar ao PowerShell profile (permanente)
    Add-Content $PROFILE "`n# Servio.AI Aliases`n. C:\Users\JE\servio.ai\sync-aliases.ps1"

.NOTES
    Autor: Servio.AI Team
    Última Atualização: 05/12/2025
#>

# Diretório do projeto
$ServioRoot = "C:\Users\JE\servio.ai"

# ============================================================================
# ALIASES PRINCIPAIS
# ============================================================================

# Sync completo interativo
function Sync-Servio {
    Push-Location $ServioRoot
    .\sync-servio.ps1
    Pop-Location
}
Set-Alias -Name ss -Value Sync-Servio -Scope Global

# Pull rápido
function Pull-Servio {
    Push-Location $ServioRoot
    .\sync-servio.ps1 -Mode Pull
    Pop-Location
}
Set-Alias -Name sp -Value Pull-Servio -Scope Global

# Push rápido com mensagem
function Push-Servio {
    param([string]$Message)
    Push-Location $ServioRoot
    if ($Message) {
        .\sync-servio.ps1 -Mode Push -Message $Message
    } else {
        Write-Host "❌ Uso: Push-Servio 'feat: sua mensagem'" -ForegroundColor Red
    }
    Pop-Location
}
Set-Alias -Name sps -Value Push-Servio -Scope Global

# Status rápido
function Status-Servio {
    Push-Location $ServioRoot
    .\sync-servio.ps1 -Mode Status
    Pop-Location
}
Set-Alias -Name st -Value Status-Servio -Scope Global

# Auto sync (totalmente automático)
function Auto-Servio {
    param([string]$Message = "")
    Push-Location $ServioRoot
    .\sync-servio.ps1 -Mode Auto -Message $Message -Silent
    Pop-Location
}
Set-Alias -Name sa -Value Auto-Servio -Scope Global

# ============================================================================
# ALIASES DE DESENVOLVIMENTO
# ============================================================================

# Abrir projeto no VS Code
function Open-Servio {
    code $ServioRoot
}
Set-Alias -Name servio -Value Open-Servio -Scope Global

# Ir para diretório do projeto
function Go-Servio {
    Set-Location $ServioRoot
}
Set-Alias -Name cdservio -Value Go-Servio -Scope Global

# Dev server frontend
function Dev-Servio {
    Push-Location $ServioRoot
    npm run dev
    Pop-Location
}
Set-Alias -Name sdev -Value Dev-Servio -Scope Global

# Dev server backend
function Dev-ServioBackend {
    Push-Location "$ServioRoot\backend"
    npm start
    Pop-Location
}
Set-Alias -Name sbackend -Value Dev-ServioBackend -Scope Global

# Rodar testes
function Test-Servio {
    Push-Location $ServioRoot
    npm test
    Pop-Location
}
Set-Alias -Name stest -Value Test-Servio -Scope Global

# Build production
function Build-Servio {
    Push-Location $ServioRoot
    npm run build
    Pop-Location
}
Set-Alias -Name sbuild -Value Build-Servio -Scope Global

# ============================================================================
# ALIASES GIT AVANÇADOS
# ============================================================================

# Ver últimos 10 commits
function Log-Servio {
    Push-Location $ServioRoot
    git log --oneline --graph --decorate -10
    Pop-Location
}
Set-Alias -Name slog -Value Log-Servio -Scope Global

# Ver diferenças
function Diff-Servio {
    Push-Location $ServioRoot
    git diff
    Pop-Location
}
Set-Alias -Name sdiff -Value Diff-Servio -Scope Global

# Criar branch
function Branch-Servio {
    param([string]$BranchName)
    if (-not $BranchName) {
        Write-Host "❌ Uso: Branch-Servio 'feature/nome'" -ForegroundColor Red
        return
    }
    Push-Location $ServioRoot
    git checkout -b $BranchName
    Write-Host "✅ Branch '$BranchName' criada e ativada" -ForegroundColor Green
    Pop-Location
}
Set-Alias -Name sbranch -Value Branch-Servio -Scope Global

# Stash rápido (backup temporário)
function Stash-Servio {
    param([string]$Message = "backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm')")
    Push-Location $ServioRoot
    git stash push -m $Message
    Write-Host "✅ Mudanças salvas em stash: $Message" -ForegroundColor Green
    Pop-Location
}
Set-Alias -Name sstash -Value Stash-Servio -Scope Global

# Restaurar stash
function Pop-ServioStash {
    Push-Location $ServioRoot
    git stash pop
    Pop-Location
}
Set-Alias -Name spop -Value Pop-ServioStash -Scope Global

# ============================================================================
# ALIASES DE CLOUD/DEPLOY
# ============================================================================

# Ver logs do Cloud Run
function Logs-ServioBackend {
    gcloud logging read 'resource.labels.service_name="servio-backend-v2"' --limit=20 --format="table(timestamp,severity,textPayload)"
}
Set-Alias -Name slogs -Value Logs-ServioBackend -Scope Global

# Testar scheduler jobs
function Test-Scheduler {
    param([string]$Job = "prospector-analytics-daily-v3")
    Write-Host "🚀 Executando job: $Job" -ForegroundColor Cyan
    gcloud scheduler jobs run $Job --location=us-central1
}
Set-Alias -Name sjob -Value Test-Scheduler -Scope Global

# ============================================================================
# HELP
# ============================================================================

function Show-ServioHelp {
    Write-Host "`n╔═══════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║   🚀 SERVIO.AI - Aliases Disponíveis     ║" -ForegroundColor Magenta
    Write-Host "╚═══════════════════════════════════════════╝`n" -ForegroundColor Magenta
    
    Write-Host "📦 GIT SYNC:" -ForegroundColor Cyan
    Write-Host "  ss              → Sync completo interativo"
    Write-Host "  sp              → Pull do GitHub"
    Write-Host "  sps 'msg'       → Push com mensagem"
    Write-Host "  st              → Status Git"
    Write-Host "  sa              → Auto sync (100% automático)"
    
    Write-Host "`n💻 DESENVOLVIMENTO:" -ForegroundColor Cyan
    Write-Host "  servio          → Abrir VS Code no projeto"
    Write-Host "  cdservio        → Ir para diretório do projeto"
    Write-Host "  sdev            → Iniciar frontend dev server"
    Write-Host "  sbackend        → Iniciar backend dev server"
    Write-Host "  stest           → Rodar testes"
    Write-Host "  sbuild          → Build production"
    
    Write-Host "`n🌳 GIT AVANÇADO:" -ForegroundColor Cyan
    Write-Host "  slog            → Ver últimos commits"
    Write-Host "  sdiff           → Ver diferenças"
    Write-Host "  sbranch 'nome'  → Criar branch"
    Write-Host "  sstash          → Salvar mudanças temporariamente"
    Write-Host "  spop            → Restaurar stash"
    
    Write-Host "`n☁️  CLOUD/DEPLOY:" -ForegroundColor Cyan
    Write-Host "  slogs           → Ver logs do Cloud Run"
    Write-Host "  sjob            → Testar scheduler job"
    
    Write-Host "`n📖 Para ver este help novamente: shelp`n" -ForegroundColor Yellow
}
Set-Alias -Name shelp -Value Show-ServioHelp -Scope Global

# ============================================================================
# INICIALIZAÇÃO
# ============================================================================

Write-Host "✅ Servio.AI aliases carregados! Digite " -NoNewline -ForegroundColor Green
Write-Host "shelp" -NoNewline -ForegroundColor Yellow
Write-Host " para ver comandos disponíveis.`n" -ForegroundColor Green
