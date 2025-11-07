# 🔍 Script de Verificação Rápida - Projeto Correto

Write-Host "`n=== VERIFICAÇÃO DO PROJETO FIREBASE ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar .firebaserc
Write-Host "1. Verificando .firebaserc..." -ForegroundColor Yellow
$firebaserc = Get-Content .firebaserc | ConvertFrom-Json
$projectId = $firebaserc.projects.default

if ($projectId -eq "gen-lang-client-0737507616") {
    Write-Host "   ✅ .firebaserc correto: $projectId" -ForegroundColor Green
} else {
    Write-Host "   ❌ .firebaserc ERRADO: $projectId" -ForegroundColor Red
    Write-Host "   Esperado: gen-lang-client-0737507616" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Verificar projeto ativo
Write-Host "2. Verificando projeto ativo no Firebase CLI..." -ForegroundColor Yellow
$activeProject = firebase use 2>&1 | Select-String "Active Project:" | ForEach-Object { $_ -replace "Active Project: ", "" }

if ($activeProject -match "gen-lang-client-0737507616") {
    Write-Host "   ✅ Projeto ativo correto: gen-lang-client-0737507616" -ForegroundColor Green
} else {
    Write-Host "   ❌ Projeto ativo ERRADO: $activeProject" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Listar todos os projetos
Write-Host "3. Listando todos os projetos..." -ForegroundColor Yellow
firebase projects:list

Write-Host ""

# 4. Verificar variáveis de ambiente
Write-Host "4. Verificando variáveis de ambiente..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $env_project = Get-Content .env.local | Select-String "VITE_FIREBASE_PROJECT_ID" | ForEach-Object { $_ -replace "VITE_FIREBASE_PROJECT_ID=", "" }
    if ($env_project -eq "gen-lang-client-0737507616") {
        Write-Host "   ✅ .env.local correto: $env_project" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env.local tem valor diferente: $env_project" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  .env.local não encontrado (OK se usar .env.production)" -ForegroundColor Cyan
}

Write-Host ""

# 5. Resumo
Write-Host "=== RESUMO ===" -ForegroundColor Cyan
Write-Host "✅ Projeto correto configurado: gen-lang-client-0737507616" -ForegroundColor Green
Write-Host "⚠️  Projeto antigo ainda existe: servioai" -ForegroundColor Yellow
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Excluir projeto antigo 'servioai' via Console" -ForegroundColor White
Write-Host "   URL: https://console.firebase.google.com/project/servioai/settings/general" -ForegroundColor Gray
Write-Host "2. Fazer deploy de teste: npm run build && firebase deploy --only hosting" -ForegroundColor White
Write-Host "3. Validar URL: https://gen-lang-client-0737507616.web.app" -ForegroundColor White
Write-Host ""
