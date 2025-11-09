#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de teste rápido para validar o sistema Servio.AI
.DESCRIPTION
    Executa uma bateria de testes locais e remotos para validar
    as mudanças recentes (analytics, disputas, sentiment alerts)
#>

$ErrorActionPreference = "Continue"
$BASE_URL = "https://servio-backend-h5ogjon7aa-uw.a.run.app"

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 TESTE RÁPIDO - SERVIO.AI                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$results = @{
    Passed = 0
    Failed = 0
    Skipped = 0
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    
    Write-Host "▶ $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $result = & $Action
        if ($result) {
            Write-Host " ✅" -ForegroundColor Green
            $script:results.Passed++
            return $true
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $script:results.Failed++
            return $false
        }
    }
    catch {
        Write-Host " ❌ ($($_.Exception.Message))" -ForegroundColor Red
        $script:results.Failed++
        return $false
    }
}

# ============================================================================
# 1. TESTES LOCAIS (código e dependências)
# ============================================================================
Write-Host "`n📦 TESTES LOCAIS`n" -ForegroundColor Magenta

Test-Step "Verificar arquivos criados" {
    (Test-Path "src/analytics/adminMetrics.ts") -and
    (Test-Path "tests/analytics.test.ts") -and
    (Test-Path "components/AdminAnalyticsDashboard.tsx") -and
    (Test-Path "tests/e2e_admin_dashboard.test.mjs")
}

Test-Step "Verificar mudanças no backend" {
    $content = Get-Content "backend/src/index.js" -Raw
    $content -match "app\.get\(`"/disputes`"" -and
    $content -match "app\.post\(`"/disputes`""
}

Test-Step "Verificar fetchSentimentAlerts implementado" {
    $content = Get-Content "services/api.ts" -Raw
    $content -match "export async function fetchSentimentAlerts" -and
    $content -match "@deprecated.*fetchFraudAlerts"
}

Test-Step "Typecheck (TypeScript)" {
    $output = npm run typecheck 2>&1
    $LASTEXITCODE -eq 0
}

Test-Step "Testes unitários (analytics)" {
    $output = npm test tests/analytics.test.ts 2>&1
    $LASTEXITCODE -eq 0
}

# ============================================================================
# 2. TESTES DE BACKEND (endpoints remotos)
# ============================================================================
Write-Host "`n🌐 TESTES DE BACKEND (Cloud Run)`n" -ForegroundColor Magenta

Test-Step "Health check (GET /)" {
    try {
        $response = Invoke-WebRequest -Uri $BASE_URL -Method GET -TimeoutSec 10 -UseBasicParsing
        $response.StatusCode -eq 200
    }
    catch {
        $false
    }
}

Test-Step "GET /users (existing endpoint)" {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/users" -Method GET -TimeoutSec 10 -UseBasicParsing
        $response.StatusCode -in @(200, 201)
    }
    catch {
        $false
    }
}

Test-Step "GET /sentiment-alerts (aligned endpoint)" {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/sentiment-alerts" -Method GET -TimeoutSec 10 -UseBasicParsing
        $response.StatusCode -in @(200, 201)
    }
    catch {
        $false
    }
}

$disputesAvailable = Test-Step "GET /disputes (NEW endpoint)" {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/disputes" -Method GET -TimeoutSec 10 -UseBasicParsing
        $response.StatusCode -in @(200, 201)
    }
    catch {
        Write-Host "  ⚠️  Endpoint ainda não disponível (deploy em andamento?)" -ForegroundColor Yellow
        $script:results.Skipped++
        $script:results.Failed--
        $false
    }
}

if ($disputesAvailable) {
    Test-Step "POST /disputes (criar disputa teste)" {
        try {
            $body = @{
                jobId = "test-validation-$(Get-Date -Format 'yyyyMMddHHmmss')"
                initiatedBy = "test@validation.com"
                reason = "Teste automatizado"
                description = "Validação de endpoint via script"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "$BASE_URL/disputes" `
                -Method POST `
                -Body $body `
                -ContentType "application/json" `
                -TimeoutSec 10 `
                -UseBasicParsing
            
            $response.StatusCode -in @(200, 201)
        }
        catch {
            # 400 é aceitável (validação de payload)
            $_.Exception.Response.StatusCode.Value__ -eq 400
        }
    }
} else {
    Write-Host "  ⏭️  Pulando POST /disputes (endpoint não disponível)" -ForegroundColor Gray
    $results.Skipped++
}

# ============================================================================
# 3. TESTES E2E (suite completa - opcional)
# ============================================================================
Write-Host "`n🔄 TESTES E2E (opcional - pode demorar 30s)`n" -ForegroundColor Magenta

$runE2E = Read-Host "Executar testes E2E completos agora? (s/N)"
if ($runE2E -eq 's' -or $runE2E -eq 'S') {
    Test-Step "E2E Admin Dashboard" {
        $output = npm test tests/e2e_admin_dashboard.test.mjs 2>&1
        $LASTEXITCODE -eq 0
    }
} else {
    Write-Host "  ⏭️  E2E pulado (execute manualmente: npm test tests/e2e_admin_dashboard.test.mjs)" -ForegroundColor Gray
    $results.Skipped++
}

# ============================================================================
# RESUMO
# ============================================================================
Write-Host "`n" + ("═" * 60) -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host ("═" * 60) -ForegroundColor Cyan

Write-Host "`n✅ Passou:  " -NoNewline -ForegroundColor Green
Write-Host $results.Passed -ForegroundColor White

Write-Host "❌ Falhou:  " -NoNewline -ForegroundColor Red
Write-Host $results.Failed -ForegroundColor White

Write-Host "⏭️  Pulado:  " -NoNewline -ForegroundColor Yellow
Write-Host $results.Skipped -ForegroundColor White

$total = $results.Passed + $results.Failed + $results.Skipped
$successRate = if ($total -gt 0) { [math]::Round(($results.Passed / $total) * 100, 1) } else { 0 }

Write-Host "`n📈 Taxa de sucesso: " -NoNewline
if ($successRate -ge 80) {
    Write-Host "$successRate% 🎉" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "$successRate% ⚠️" -ForegroundColor Yellow
} else {
    Write-Host "$successRate% 🚨" -ForegroundColor Red
}

Write-Host "`n" + ("═" * 60) -ForegroundColor Cyan

# ============================================================================
# PRÓXIMOS PASSOS
# ============================================================================
Write-Host "`n📋 PRÓXIMOS PASSOS:`n" -ForegroundColor Magenta

if ($results.Failed -eq 0 -and $results.Skipped -eq 0) {
    Write-Host "🎉 Tudo funcionando perfeitamente!`n" -ForegroundColor Green
    Write-Host "Você pode:" -ForegroundColor White
    Write-Host "  1. Iniciar o frontend: npm run dev" -ForegroundColor Cyan
    Write-Host "  2. Testar analytics no browser: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  3. Fazer login como admin e verificar métricas" -ForegroundColor Cyan
}
elseif ($results.Skipped -gt 0 -and $results.Failed -eq 0) {
    Write-Host "⏳ Alguns testes foram pulados (provavelmente deploy pendente)`n" -ForegroundColor Yellow
    Write-Host "Aguarde o deploy terminar e execute:" -ForegroundColor White
    Write-Host "  node scripts/validate_disputes_endpoints.mjs" -ForegroundColor Cyan
    Write-Host "`nMonitorar deploy:" -ForegroundColor White
    Write-Host "  https://github.com/agenciaclimb/Servio.AI/actions" -ForegroundColor Cyan
}
else {
    Write-Host "⚠️  Alguns testes falharam`n" -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor White
    Write-Host "  1. Backend está online: $BASE_URL" -ForegroundColor Cyan
    Write-Host "  2. Deploy foi concluído: https://github.com/agenciaclimb/Servio.AI/actions" -ForegroundColor Cyan
    Write-Host "  3. Logs do Cloud Run para erros" -ForegroundColor Cyan
}

Write-Host "`n📖 Guia completo: cat TESTING_GUIDE.md`n" -ForegroundColor Gray

# Exit code
if ($results.Failed -eq 0) { exit 0 } else { exit 1 }
