#!/usr/bin/env pwsh
# Status Report Generator - Servio.AI
# Gera relatório completo do status do projeto

param(
    [switch]$Detailed = $false
)

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 SERVIO.AI - STATUS REPORT         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
Write-Host "⏰ Gerado em: $timestamp`n" -ForegroundColor Gray

# 1. Git Status
Write-Host "📦 GIT STATUS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
$branch = git branch --show-current 2>$null
$commit = git rev-parse --short HEAD 2>$null
if ($branch) {
    Write-Host "  Branch: $branch" -ForegroundColor White
    Write-Host "  Commit: $commit" -ForegroundColor White
    $modified = (git status --porcelain 2>$null | Measure-Object).Count
    if ($modified -eq 0) {
        Write-Host "  Status: ✅ Limpo (0 mudanças)" -ForegroundColor Green
    } else {
        Write-Host "  Status: ⚠️  $modified arquivo(s) modificado(s)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Não é um repositório Git" -ForegroundColor Yellow
}
Write-Host ""

# 2. Package Info
Write-Host "📦 PACKAGE INFO" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "  Nome: $($pkg.name)" -ForegroundColor White
    Write-Host "  Versão: $($pkg.version)" -ForegroundColor White
    
    $nodeModules = Test-Path "node_modules"
    if ($nodeModules) {
        Write-Host "  Dependencies: ✅ Instaladas" -ForegroundColor Green
    } else {
        Write-Host "  Dependencies: ❌ Não instaladas (run: npm install)" -ForegroundColor Red
    }
}
Write-Host ""

# 3. Tests
Write-Host "🧪 TESTES" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
if ($Detailed) {
    Write-Host "  Executando testes..." -ForegroundColor Gray
    $testOutput = npm run test:nocov 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Status: ✅ Todos passando" -ForegroundColor Green
        if ($testOutput -match "(\d+) passed") {
            Write-Host "  Testes: $($matches[1]) passando" -ForegroundColor White
        }
    } else {
        Write-Host "  Status: ❌ Alguns falhando" -ForegroundColor Red
    }
} else {
    Write-Host "  Use -Detailed para executar testes" -ForegroundColor Gray
    if (Test-Path "coverage/coverage-summary.json") {
        $coverage = Get-Content "coverage/coverage-summary.json" | ConvertFrom-Json
        $totalCoverage = [math]::Round($coverage.total.lines.pct, 2)
        Write-Host "  Última cobertura: $totalCoverage%" -ForegroundColor White
    }
}
Write-Host ""

# 4. Build
Write-Host "🔨 BUILD" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
$distExists = Test-Path "dist"
if ($distExists) {
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  Status: ✅ Build existe" -ForegroundColor Green
    Write-Host "  Tamanho: $([math]::Round($distSize, 2)) MB" -ForegroundColor White
    
    $distDate = (Get-Item "dist").LastWriteTime
    $age = (Get-Date) - $distDate
    if ($age.TotalHours -lt 1) {
        Write-Host "  Idade: $([math]::Round($age.TotalMinutes)) minutos (recente)" -ForegroundColor Green
    } elseif ($age.TotalDays -lt 1) {
        Write-Host "  Idade: $([math]::Round($age.TotalHours)) horas" -ForegroundColor Yellow
    } else {
        Write-Host "  Idade: $([math]::Round($age.TotalDays)) dias (considere rebuild)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Status: ❌ Build não encontrado (run: npm run build)" -ForegroundColor Red
}
Write-Host ""

# 5. E2E Tests
Write-Host "🎭 SMOKE TESTS" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
$smokeTest = Test-Path "tests/e2e/smoke/basic-smoke.spec.ts"
if ($smokeTest) {
    Write-Host "  Suite: ✅ basic-smoke.spec.ts" -ForegroundColor Green
    
    if (Test-Path "playwright-report") {
        $reportDate = (Get-Item "playwright-report").LastWriteTime
        $age = (Get-Date) - $reportDate
        Write-Host "  Última execução: $([math]::Round($age.TotalHours, 1))h atrás" -ForegroundColor White
    } else {
        Write-Host "  ⚠️  Nunca executado (run: npm run e2e:smoke)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Suite não encontrada" -ForegroundColor Red
}
Write-Host ""

# 6. Documentação
Write-Host "📚 DOCUMENTAÇÃO" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
$docs = @(
    "SISTEMA_PRONTO_PRODUCAO.md",
    "DEPLOY_CHECKLIST.md",
    "PRODUCTION_READINESS.md",
    "SMOKE_TESTS_REPORT.md",
    "COMANDOS_UTEIS.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $size = (Get-Item $doc).Length / 1KB
        Write-Host "  ✅ $doc ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $doc (não encontrado)" -ForegroundColor Red
    }
}
Write-Host ""

# 7. Segurança
Write-Host "🔒 SEGURANÇA" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
if ($Detailed) {
    Write-Host "  Executando audit..." -ForegroundColor Gray
    $auditOutput = npm audit --json 2>$null | ConvertFrom-Json
    if ($auditOutput) {
        $vulnerabilities = $auditOutput.metadata.vulnerabilities
        $total = $vulnerabilities.total
        $critical = $vulnerabilities.critical
        $high = $vulnerabilities.high
        
        if ($total -eq 0) {
            Write-Host "  Status: ✅ Sem vulnerabilidades" -ForegroundColor Green
        } else {
            Write-Host "  Status: ⚠️  $total vulnerabilidade(s)" -ForegroundColor Yellow
            if ($critical -gt 0) {
                Write-Host "  Críticas: $critical" -ForegroundColor Red
            }
            if ($high -gt 0) {
                Write-Host "  Altas: $high" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "  Use -Detailed para executar audit" -ForegroundColor Gray
}
Write-Host ""

# 8. Resumo Final
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎯 RESUMO                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

$score = 0
$maxScore = 6

if ($branch) { $score++ }
if (Test-Path "node_modules") { $score++ }
if ($distExists) { $score++ }
if ($smokeTest) { $score++ }
if (Test-Path "SISTEMA_PRONTO_PRODUCAO.md") { $score++ }
if (Test-Path "DEPLOY_CHECKLIST.md") { $score++ }

$percentage = [math]::Round(($score / $maxScore) * 100)
Write-Host "  Saúde do Projeto: $percentage% ($score/$maxScore)" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 60) { "Yellow" } else { "Red" })

if ($percentage -ge 80) {
    Write-Host "`n  ✅ Projeto em excelente estado!`n" -ForegroundColor Green
} elseif ($percentage -ge 60) {
    Write-Host "`n  ⚠️  Projeto OK, mas precisa de atenção`n" -ForegroundColor Yellow
} else {
    Write-Host "`n  ❌ Projeto precisa de correções`n" -ForegroundColor Red
}

# Sugestões
if (-not (Test-Path "node_modules")) {
    Write-Host "  💡 Sugestão: Execute 'npm install'" -ForegroundColor Cyan
}
if (-not $distExists) {
    Write-Host "  💡 Sugestão: Execute 'npm run build'" -ForegroundColor Cyan
}
if (-not (Test-Path "playwright-report")) {
    Write-Host "  💡 Sugestão: Execute 'npm run e2e:smoke'" -ForegroundColor Cyan
}

Write-Host ""
