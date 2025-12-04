#!/usr/bin/env pwsh

# 🔍 MONITOR GITHUB ACTIONS - FASE 3 DEPLOYMENT
# Monitora o workflow CI/CD em tempo real

$repo = "agenciaclimb/Servio.AI"
$branch = "main"
$checkInterval = 10  # segundos

Write-Host "🚀 INICIANDO MONITOR GITHUB ACTIONS" -ForegroundColor Cyan
Write-Host "Repositório: $repo" -ForegroundColor White
Write-Host "Branch: $branch" -ForegroundColor White
Write-Host "Intervalo: $checkInterval segundos" -ForegroundColor White
Write-Host "---" -ForegroundColor Gray
Write-Host ""

$lastStatus = ""
$startTime = Get-Date
$checkCount = 0

# Loop de monitoramento
while ($true) {
    $checkCount++
    $elapsedTime = ((Get-Date) - $startTime).TotalMinutes
    
    try {
        # Fetch do git para atualizar estado remoto
        & git fetch origin main 2>&1 | Out-Null
        
        # Pegar últimos commits
        $latestCommit = & git log origin/main --oneline -1 2>&1
        $latestCommitHash = ($latestCommit -split " ")[0]
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⏱️ Check #$checkCount (${elapsedTime:F1} min)" -ForegroundColor Gray
        Write-Host "  Commit: $latestCommit" -ForegroundColor White
        
        # Tentar verificar status do workflow via Git API (se tiver gh CLI)
        $ghCliAvailable = $null -ne (Get-Command gh -ErrorAction SilentlyContinue)
        
        if ($ghCliAvailable) {
            Write-Host "  ✅ GitHub CLI disponível - checando workflow status..." -ForegroundColor Green
            
            try {
                $runs = & gh run list --repo $repo --branch $branch --limit 1 --json status,conclusion,name,createdAt 2>&1 | ConvertFrom-Json
                
                if ($runs -and $runs.Count -gt 0) {
                    $latestRun = $runs[0]
                    $status = $latestRun.status
                    $conclusion = $latestRun.conclusion
                    $runName = $latestRun.name
                    
                    Write-Host "    Workflow: $runName" -ForegroundColor Cyan
                    Write-Host "    Status: $status" -ForegroundColor White
                    Write-Host "    Conclusion: $conclusion" -ForegroundColor White
                    
                    if ($conclusion -eq "success") {
                        Write-Host "    ✅ ✅ ✅ WORKFLOW PASSOU!" -ForegroundColor Green
                        Write-Host ""
                        Write-Host "🎉 SUCESSO! Fase 3 deployment completo!" -ForegroundColor Green
                        Write-Host "Tempo total: ${elapsedTime:F1} minutos" -ForegroundColor Green
                        break
                    }
                    elseif ($conclusion -eq "failure") {
                        Write-Host "    ❌ WORKFLOW FALHOU!" -ForegroundColor Red
                        Write-Host "    Verifique: https://github.com/$repo/actions" -ForegroundColor Yellow
                        Write-Host ""
                        Write-Host "Tentando novamente em $checkInterval segundos..." -ForegroundColor Gray
                    }
                    elseif ($status -eq "in_progress") {
                        Write-Host "    ⏳ Workflow ainda em progresso..." -ForegroundColor Yellow
                    }
                    elseif ($status -eq "queued") {
                        Write-Host "    ⏳ Workflow na fila..." -ForegroundColor Yellow
                    }
                }
            }
            catch {
                Write-Host "    ⚠️ Erro ao buscar status: $_" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "  ℹ️ GitHub CLI não disponível" -ForegroundColor Gray
            Write-Host "  Instale com: choco install gh" -ForegroundColor Gray
            Write-Host "  Verifique em: https://github.com/$repo/actions" -ForegroundColor Cyan
        }
        
        Write-Host ""
        
        # Se passou 30 minutos, parar monitoramento
        if ($elapsedTime -gt 30) {
            Write-Host "⏰ Timeout: 30 minutos excedidos" -ForegroundColor Yellow
            Write-Host "Verifique manualmente: https://github.com/$repo/actions" -ForegroundColor Cyan
            break
        }
        
        # Aguardar antes do próximo check
        Write-Host "Aguardando $checkInterval segundos para próximo check..." -ForegroundColor Gray
        Start-Sleep -Seconds $checkInterval
    }
    catch {
        Write-Host "❌ Erro: $_" -ForegroundColor Red
        Start-Sleep -Seconds $checkInterval
    }
}

Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host "Monitor finalizado" -ForegroundColor Cyan
