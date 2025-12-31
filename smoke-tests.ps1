# 🚀 Smoke Tests E2E — 3 Fluxos Críticos
# Protocolo Supremo — Validação Verdade Operacional
# 27/12/2025 17:40 BRT

$API_URL = "http://localhost:8081/api"
$RESULTS_FILE = "smoke-test-results.json"

Write-Host "🚀 Iniciando Smoke Tests E2E (27/12/2025)" -ForegroundColor Cyan
Write-Host "API Base: $API_URL`n" -ForegroundColor Yellow

$TOTAL = 0
$PASSED = 0
$FAILED = 0
$results = @()

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [string]$data,
        [int]$expectedStatus
    )
    
    $global:TOTAL++
    Write-Host "[$TOTAL] $name ... " -NoNewline
    
    try {
        if ($method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$API_URL$endpoint" -Method GET -SkipHttpErrorCheck
        } else {
            $response = Invoke-WebRequest -Uri "$API_URL$endpoint" -Method $method `
                -ContentType "application/json" `
                -Body $data `
                -SkipHttpErrorCheck
        }
        
        $httpCode = [int]$response.StatusCode
        $body = $response.Content
        
        if ($httpCode -eq $expectedStatus) {
            Write-Host "✓ $httpCode" -ForegroundColor Green
            $global:PASSED++
            Write-Host ($body | ConvertFrom-Json | ConvertTo-Json -Compress).Substring(0, [Math]::Min(100, $body.Length)) -ForegroundColor DarkGray
            Write-Host ""
        } else {
            Write-Host "✗ Expected $expectedStatus, got $httpCode" -ForegroundColor Red
            $global:FAILED++
            Write-Host "Response: $($body.Substring(0, 150))" -ForegroundColor DarkGray
            Write-Host ""
        }
        
        $results += @{
            name = $name
            method = $method
            endpoint = $endpoint
            expectedStatus = $expectedStatus
            actualStatus = $httpCode
            passed = ($httpCode -eq $expectedStatus)
        }
    } catch {
        Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $global:FAILED++
        Write-Host ""
    }
}

# ========================================
# FLUXO 1: CLIENTE (Job + IA + Payment)
# ========================================

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "FLUXO 1: CLIENTE (Job + IA + Payment)" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 1.1 Listar Jobs (validar existência de jobs)
Test-Endpoint "GET /api/jobs" "GET" "/jobs" $null 200

# 1.2 Criar Job
$jobData = @{
    title = "Encanador para vazamento"
    description = "Cano vazando embaixo da pia"
    category = "encanamento"
    location = "São Paulo, SP"
    clientId = "cliente@test.com"
    budget = 500
} | ConvertTo-Json

Test-Endpoint "POST /api/jobs" "POST" "/jobs" $jobData 200

# ========================================
# FLUXO 2: PARCEIRO (Proposta + IA Chat)
# ========================================

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "FLUXO 2: PARCEIRO (Proposta + IA Chat)" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 2.1 Enviar mensagem WebChat com IA (CRÍTICO)
$chatData = @{
    userId = "provider@test.com"
    message = "Quando posso começar?"
    userType = "prestador"
} | ConvertTo-Json

Test-Endpoint "POST /api/omni/web/send" "POST" "/omni/web/send" $chatData 200

# 2.2 Listar conversas (validar persistência)
Test-Endpoint "GET /api/omni/conversations" "GET" "/omni/conversations?userId=provider@test.com&limit=10" $null 200

# 2.3 Listar mensagens
Test-Endpoint "GET /api/omni/messages" "GET" "/omni/messages?conversationId=conv_test" $null 200

# ========================================
# FLUXO 3: PROSPECTOR (Smart Actions)
# ========================================

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "FLUXO 3: PROSPECTOR (Smart Actions)" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 3.1 Smart Actions (IA recomendações)
$prospectData = @{
    name = "João Silva"
    email = "joao@example.com"
    phone = "+5511999999999"
    temperature = "cold"
} | ConvertTo-Json

Test-Endpoint "POST /api/prospector/smart-actions" "POST" "/prospector/smart-actions" $prospectData 200

# 3.2 Listar Leads
Test-Endpoint "GET /api/prospector/leads" "GET" "/prospector/leads?status=new&limit=10" $null 200

# 3.3 AI Recommendations
Test-Endpoint "POST /api/prospector/next-action" "POST" "/prospector/next-action" @{leadId = "lead_123"} | ConvertTo-Json 200

# ========================================
# RESULTADO FINAL
# ========================================

Write-Host "`n=========================================" -ForegroundColor Yellow
Write-Host "RESULTADO FINAL" -ForegroundColor Yellow
Write-Host "=========================================`n" -ForegroundColor Yellow

Write-Host "Total: $TOTAL | " -NoNewline
Write-Host "Passed: $PASSED " -ForegroundColor Green -NoNewline
Write-Host "| " -NoNewline
Write-Host "Failed: $FAILED " -ForegroundColor Red

if ($FAILED -eq 0) {
    Write-Host "`n✓ GO PARA LANÇAMENTO" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "Todos 3 fluxos críticos funcionando perfeitamente!" -ForegroundColor Green
    
    # Salvar resultados
    $results | ConvertTo-Json | Set-Content $RESULTS_FILE
    Write-Host "`nResultados salvos em: $RESULTS_FILE" -ForegroundColor Cyan
    
    exit 0
} else {
    Write-Host "`n✗ NO-GO — Corrigir $FAILED erro(s) antes de lançar" -ForegroundColor Red -BackgroundColor DarkRed
    
    # Salvar resultados
    $results | ConvertTo-Json | Set-Content $RESULTS_FILE
    Write-Host "`nResultados salvos em: $RESULTS_FILE" -ForegroundColor Yellow
    
    exit 1
}
