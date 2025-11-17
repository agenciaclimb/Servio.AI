# Script de Validação da Configuração Stripe
# Executa verificações automáticas do setup do Stripe

Write-Host "🔐 VALIDAÇÃO STRIPE - SERVIO.AI" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$allPassed = $true

# 1. Verificar .env.local
Write-Host "1️⃣  Verificando .env.local..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local -Raw
    
    if ($envContent -match 'VITE_STRIPE_PUBLISHABLE_KEY\s*=\s*pk_test_\w+') {
        Write-Host "   ✅ VITE_STRIPE_PUBLISHABLE_KEY configurada (test mode)" -ForegroundColor Green
    } elseif ($envContent -match 'VITE_STRIPE_PUBLISHABLE_KEY\s*=\s*pk_live_\w+') {
        Write-Host "   ✅ VITE_STRIPE_PUBLISHABLE_KEY configurada (LIVE MODE)" -ForegroundColor Green
        Write-Host "   ⚠️  ATENÇÃO: Usando chaves de PRODUÇÃO!" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ VITE_STRIPE_PUBLISHABLE_KEY não encontrada ou inválida" -ForegroundColor Red
        $allPassed = $false
    }
    
    if ($envContent -match '#\s*STRIPE_SECRET_KEY') {
        Write-Host "   ℹ️  STRIPE_SECRET_KEY comentada (correto - deve estar no backend)" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ❌ Arquivo .env.local não encontrado" -ForegroundColor Red
    $allPassed = $false
}

# 2. Verificar index.html (Stripe.js)
Write-Host "`n2️⃣  Verificando index.html..." -ForegroundColor Yellow
if (Test-Path index.html) {
    $indexContent = Get-Content index.html -Raw
    if ($indexContent -match 'js\.stripe\.com') {
        Write-Host "   ✅ Stripe.js carregado no index.html" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Stripe.js não encontrado no index.html" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ index.html não encontrado" -ForegroundColor Red
    $allPassed = $false
}

# 3. Verificar backend está rodando
Write-Host "`n3️⃣  Verificando backend Cloud Run..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://servio-backend-1000250760228.us-west1.run.app/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend respondendo (status 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend não respondeu: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# 4. Verificar webhook endpoint
Write-Host "`n4️⃣  Verificando webhook endpoint..." -ForegroundColor Yellow
try {
    $webhookResponse = Invoke-WebRequest -Uri "https://servio-backend-1000250760228.us-west1.run.app/api/stripe-webhook" -Method POST -ContentType "application/json" -Body '{"type":"test"}' -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ⚠️  Webhook respondeu mas não deveria aceitar sem assinatura" -ForegroundColor Yellow
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -match "signature") {
        Write-Host "   ✅ Webhook protegido (rejeita requisições sem assinatura válida)" -ForegroundColor Green
    } elseif ($errorMessage -match "400|401|403") {
        Write-Host "   ✅ Webhook protegido (status $($_.Exception.Response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erro ao verificar webhook: $errorMessage" -ForegroundColor Red
        $allPassed = $false
    }
}

# 5. Verificar signing secret configurado
Write-Host "`n5️⃣  Verificando webhook signing secret..." -ForegroundColor Yellow
try {
    $secretCheck = Invoke-RestMethod -Uri "https://servio-backend-1000250760228.us-west1.run.app/diag/stripe-webhook-secret" -Method GET -TimeoutSec 10 -ErrorAction Stop
    if ($secretCheck.configured -eq $true) {
        Write-Host "   ✅ STRIPE_WEBHOOK_SECRET configurado no Cloud Run" -ForegroundColor Green
    } else {
        Write-Host "   ❌ STRIPE_WEBHOOK_SECRET não configurado" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Não foi possível verificar signing secret: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# 6. Verificar código do frontend
Write-Host "`n6️⃣  Verificando código do frontend..." -ForegroundColor Yellow
$stripeFiles = @(
    "src/contexts/AppContext.tsx",
    "src/components/ClientDashboard.tsx",
    "src/components/ProviderOnboarding.tsx"
)
$foundStripeCode = $false
foreach ($file in $stripeFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match 'stripe|Stripe') {
            $foundStripeCode = $true
            break
        }
    }
}
if ($foundStripeCode) {
    Write-Host "   ✅ Código de integração Stripe encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Código de integração Stripe não encontrado" -ForegroundColor Yellow
}

# 7. Verificar testes
Write-Host "`n7️⃣  Verificando testes Stripe..." -ForegroundColor Yellow
if (Test-Path "tests/api.test.ts") {
    $testContent = Get-Content "tests/api.test.ts" -Raw
    if ($testContent -match "Stripe|stripe") {
        Write-Host "   ✅ Testes de integração Stripe encontrados" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Testes de integração Stripe não encontrados" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Arquivo de testes não encontrado" -ForegroundColor Yellow
}

# Resumo Final
Write-Host "`n" + "="*50 -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ TODAS AS VERIFICAÇÕES PASSARAM!" -ForegroundColor Green
    Write-Host "`n📋 Próximos Passos:" -ForegroundColor Cyan
    Write-Host "   1. Acesse: https://dashboard.stripe.com/test/webhooks" -ForegroundColor White
    Write-Host "   2. Verifique se o webhook está configurado corretamente" -ForegroundColor White
    Write-Host "   3. Configure Stripe Connect (se ainda não fez):" -ForegroundColor White
    Write-Host "      https://dashboard.stripe.com/test/connect/accounts/overview" -ForegroundColor White
    Write-Host "   4. Teste o fluxo completo:" -ForegroundColor White
    Write-Host "      - npm run dev" -ForegroundColor White
    Write-Host "      - Criar job → enviar proposta → aceitar → pagar com 4242..." -ForegroundColor White
} else {
    Write-Host "❌ ALGUMAS VERIFICAÇÕES FALHARAM" -ForegroundColor Red
    Write-Host "`n📋 Ações Necessárias:" -ForegroundColor Yellow
    Write-Host "   - Verifique os itens marcados com ❌ acima" -ForegroundColor White
    Write-Host "   - Consulte STRIPE_CONFIG_STATUS.md para instruções detalhadas" -ForegroundColor White
    Write-Host "   - Execute 'npm run dev' para testar localmente" -ForegroundColor White
}

Write-Host "`n📚 Documentação:" -ForegroundColor Cyan
Write-Host "   - STRIPE_SETUP_GUIDE.md (guia completo)" -ForegroundColor White
Write-Host "   - STRIPE_CONFIG_STATUS.md (status atual)" -ForegroundColor White
Write-Host "   - DEPLOY_CHECKLIST.md (checklist de deploy)" -ForegroundColor White

Write-Host "`n" + "="*50 + "`n" -ForegroundColor Cyan
