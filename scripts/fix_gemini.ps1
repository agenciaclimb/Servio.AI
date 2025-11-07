# Diagnóstico e Fix do Gemini Code Assist
# Execute este script e siga as instruções

Write-Host "=== DIAGNÓSTICO GEMINI CODE ASSIST ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar extensões instaladas
Write-Host "1. Extensões de IA instaladas:" -ForegroundColor Yellow
code --list-extensions | Select-String -Pattern "gemini|copilot|chatgpt|openai"
Write-Host ""

# 2. Verificar autenticação Google Cloud
Write-Host "2. Verificando autenticação Google Cloud..." -ForegroundColor Yellow
$gcloudAuth = gcloud auth list --format="value(account)" 2>$null
if ($gcloudAuth) {
    Write-Host "✓ Autenticado como: $gcloudAuth" -ForegroundColor Green
} else {
    Write-Host "✗ Não autenticado. Execute: gcloud auth login" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar projeto GCP
Write-Host "3. Verificando projeto GCP..." -ForegroundColor Yellow
$project = gcloud config get-value project 2>$null
if ($project) {
    Write-Host "✓ Projeto configurado: $project" -ForegroundColor Green
} else {
    Write-Host "✗ Projeto não configurado. Execute: gcloud config set project gen-lang-client-0737507616" -ForegroundColor Red
}
Write-Host ""

# 4. Limpar cache do VS Code
Write-Host "4. Limpando cache do VS Code..." -ForegroundColor Yellow
$cachePaths = @(
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData",
    "$env:APPDATA\Code\CachedExtensions",
    "$env:APPDATA\Code\CachedExtensionVSIXs"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            Write-Host "✓ Limpou: $path" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Não foi possível limpar: $path" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# 5. Verificar conflitos de extensões
Write-Host "5. Verificando conflitos de extensões..." -ForegroundColor Yellow
$aiExtensions = @(
    "google.geminicodeassist",
    "github.copilot",
    "github.copilot-chat",
    "openai.chatgpt"
)

$installed = code --list-extensions
$conflicts = $aiExtensions | Where-Object { $installed -contains $_ }

if ($conflicts.Count -gt 2) {
    Write-Host "⚠ AVISO: Múltiplas extensões de IA detectadas. Isso pode causar conflitos:" -ForegroundColor Yellow
    $conflicts | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
    Write-Host "RECOMENDAÇÃO: Desabilite temporariamente as outras e mantenha apenas o Gemini:" -ForegroundColor Cyan
    Write-Host "  code --uninstall-extension openai.chatgpt" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✓ Configuração de extensões OK" -ForegroundColor Green
}
Write-Host ""

# 6. Instruções finais
Write-Host "=== PRÓXIMOS PASSOS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Feche TODAS as janelas do VS Code" -ForegroundColor Yellow
Write-Host "2. Aguarde 10 segundos" -ForegroundColor Yellow
Write-Host "3. Reabra o VS Code neste projeto:" -ForegroundColor Yellow
Write-Host "   cd 'C:\Users\JE\servio.ai'" -ForegroundColor White
Write-Host "   code ." -ForegroundColor White
Write-Host ""
Write-Host "4. No VS Code, pressione Ctrl+Shift+P e execute:" -ForegroundColor Yellow
Write-Host "   > Google Cloud Code: Sign In" -ForegroundColor White
Write-Host ""
Write-Host "5. Depois, abra o Gemini:" -ForegroundColor Yellow
Write-Host "   Ctrl+Shift+P > Gemini Code Assist: Open Chat" -ForegroundColor White
Write-Host ""
Write-Host "6. Se ainda não funcionar, verifique os logs:" -ForegroundColor Yellow
Write-Host "   View > Output > Selecione 'Gemini Code Assist'" -ForegroundColor White
Write-Host ""
Write-Host "=== FIM DO DIAGNÓSTICO ===" -ForegroundColor Cyan
