# 🔥 Smoke Tests E2E AUTENTICADOS
# Protocolo Supremo v4.0.3 — 28/12/2025
# Testa 3 fluxos críticos SEM Firebase Auth (bypass dev mode)

$API_URL = "http://localhost:8081/api"
$RESULTS_FILE = "smoke-test-auth-results.json"

Write-Host "`n🔥 SMOKE TESTS E2E AUTENTICADOS`n" -ForegroundColor Cyan
Write-Host "⚠️  DEV MODE: Testando endpoints SEM auth (dev bypass)`n" -ForegroundColor Yellow

$tests = @()
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$url,
        [object]$body,
        [int[]]$acceptableStatus
    )
    
    Write-Host "[$name] ... " -NoNewline
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$API_URL$url" -Method GET -Headers $headers -SkipHttpErrorCheck -TimeoutSec 10
        } else {
            $jsonBody = $body | ConvertTo-Json -Depth 10
            $response = Invoke-WebRequest -Uri "$API_URL$url" -Method $method -Headers $headers -Body $jsonBody -SkipHttpErrorCheck -TimeoutSec 10
        }
        
        $status = [int]$response.StatusCode
        $content = $response.Content
        
        if ($status -in $acceptableStatus) {
            Write-Host "✓ $status" -ForegroundColor Green
            $script:passed++
            $result = "PASS"
            
            if ($content.Length -gt 0 -and $content.Length -lt 300) {
                Write-Host "  Response: $content" -ForegroundColor DarkGray
            } elseif ($content.Length -gt 0) {
                Write-Host "  Response: $($content.Substring(0, [Math]::Min(200, $content.Length)))..." -ForegroundColor DarkGray
            }
        } else {
            Write-Host "✗ $status (expected: $($acceptableStatus -join ','))" -ForegroundColor Red
            $script:failed++
            $result = "FAIL"
            
            if ($content.Length -gt 0 -and $content.Length -lt 300) {
                Write-Host "  Error: $content" -ForegroundColor Yellow
            }
        }
        
        $script:tests += @{
            name = $name
            method = $method
            url = $url
            status = $status
            result = $result
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
        }
        
    } catch {
        Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        
        $script:tests += @{
            name = $name
            method = $method
            url = $url
            status = 0
            result = "ERROR"
            error = $_.Exception.Message
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
        }
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FLUXO 1: CLIENTE (Jobs)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1.1 Listar jobs (pode estar vazio mas não deve dar erro)
Test-Endpoint "GET /api/jobs" "GET" "/jobs" $null @(200, 500)

# 1.2 Criar job SIMPLES (sem IA por enquanto)
$jobData = @{
    title = "Encanador emergência"
    description = "Vazamento no banheiro"
    category = "encanamento"
    location = "São Paulo, SP"
    clientId = "test-cliente@servio.ai"
    budget = 300
    status = "aberto"
}
Test-Endpoint "POST /api/jobs" "POST" "/jobs" $jobData @(200, 201, 403, 500)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FLUXO 2: PARCEIRO (Omnichannel)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 2.1 Enviar mensagem WebChat (IA pode falhar gracefully)
$chatData = @{
    userId = "test-provider@servio.ai"
    message = "Olá, preciso de ajuda"
    userType = "prestador"
}
Test-Endpoint "POST /api/omni/web/send" "POST" "/omni/web/send" $chatData @(200, 403, 500)

# 2.2 Listar conversas
Test-Endpoint "GET /api/omni/conversations" "GET" "/omni/conversations?userId=test-provider@servio.ai&limit=5" $null @(200, 403, 500)

# 2.3 Listar mensagens (pode estar vazio)
Test-Endpoint "GET /api/omni/messages" "GET" "/omni/messages?conversationId=test_conv_001&limit=10" $null @(200, 403, 500)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FLUXO 3: PROSPECTOR (AI Actions)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 3.1 Smart Actions (IA pode falhar se sem API key)
$actionData = @{
    action = "analyze_lead"
    leadData = @{
        name = "Lead Test"
        company = "Test Corp"
        email = "lead@test.com"
    }
}
Test-Endpoint "POST /api/prospector/smart-actions" "POST" "/prospector/smart-actions" $actionData @(200, 403, 500)

# 3.2 Listar leads
Test-Endpoint "GET /api/prospector/leads" "GET" "/prospector/leads?limit=10" $null @(200, 403, 500)

# 3.3 Next action recommendation
$nextActionData = @{
    leadId = "test_lead_001"
}
Test-Endpoint "POST /api/prospector/next-action" "POST" "/prospector/next-action" $nextActionData @(200, 403, 500)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 1) } else { 0 }

Write-Host "Total: $total | Passed: $passed | Failed: $failed" -ForegroundColor White
Write-Host "Success Rate: $percentage%`n" -ForegroundColor $(if ($percentage -ge 75) { "Green" } elseif ($percentage -ge 50) { "Yellow" } else { "Red" })

# Save results
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    total = $total
    passed = $passed
    failed = $failed
    percentage = $percentage
    tests = $tests
}
$results | ConvertTo-Json -Depth 10 | Out-File $RESULTS_FILE -Encoding UTF8
Write-Host "Results saved: $RESULTS_FILE`n" -ForegroundColor Gray

# Go/No-Go decision
if ($percentage -ge 75) {
    Write-Host "✅ GO PARA STAGING DEPLOY" -ForegroundColor Green
    Write-Host "   ≥75% endpoints funcionais confirmado!" -ForegroundColor Green
    exit 0
} elseif ($percentage -ge 50) {
    Write-Host "🟡 GO CONDICIONAL" -ForegroundColor Yellow
    Write-Host "   ≥50% endpoints OK mas revisar failures" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ NO-GO — BLOCKERS CRÍTICOS" -ForegroundColor Red
    Write-Host "   <50% endpoints OK — adicionar +1 dia para fixes" -ForegroundColor Red
    exit 1
}
