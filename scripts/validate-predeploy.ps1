#!/usr/bin/env pwsh
# Validação Pré-Deploy - Servio.AI
# Este script valida que o sistema está pronto para deploy

Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDACAO PRE-DEPLOY - SERVIO.AI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$exitCode = 0

# 0. Instalar dependencias limpas
Write-Host "Instalando dependencias (npm ci)..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao instalar dependencias." -ForegroundColor Red
    exit 1
}

# 1. TypeScript
Write-Host "Verificando TypeScript..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript errors encontrados!" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "TypeScript OK" -ForegroundColor Green
    Write-Host ""
}

# 2. Testes Unitários
Write-Host "Executando testes unitarios..." -ForegroundColor Yellow
npx vitest run
if ($LASTEXITCODE -ne 0) {
    Write-Host "Testes unitarios falharam!" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "Testes unitarios OK" -ForegroundColor Green
    Write-Host ""
}

# 3. Build
Write-Host "Construindo projeto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build falhou!" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "Build OK" -ForegroundColor Green
    Write-Host ""
}

# 4. Smoke Tests
Write-Host "Executando smoke tests..." -ForegroundColor Yellow
npx playwright test tests/e2e/smoke/basic-smoke.spec.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "Smoke tests falharam!" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "Smoke tests OK" -ForegroundColor Green
    Write-Host ""
}

# Resultado Final
Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "SISTEMA PRONTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Review do codigo" -ForegroundColor White
    Write-Host "  2. Aprovacao do time" -ForegroundColor White
    Write-Host "  3. Deploy para staging" -ForegroundColor White
    Write-Host "  4. Validacao manual" -ForegroundColor White
    Write-Host "  5. Deploy para producao" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "VALIDACAO FALHOU!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Corrija os erros acima antes de prosseguir." -ForegroundColor Yellow
    Write-Host ""
}

exit $exitCode
