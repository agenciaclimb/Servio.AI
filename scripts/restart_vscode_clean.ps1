# Script para limpar processos do VS Code e reiniciar de forma limpa
# Uso: .\scripts\restart_vscode_clean.ps1

Write-Host "🧹 Limpando processos do VS Code..." -ForegroundColor Cyan

# Fechar VS Code
Write-Host "Fechando VS Code..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "Code"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar 2 segundos
Start-Sleep -Seconds 2

# Matar processos Node.js órfãos (do Extension Host)
Write-Host "Matando processos Node.js órfãos..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.MainWindowTitle -eq ""} | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar mais 1 segundo
Start-Sleep -Seconds 1

# Limpar cache do TypeScript (opcional)
$tsCachePath = "$env:LOCALAPPDATA\Microsoft\TypeScript"
if (Test-Path $tsCachePath) {
    Write-Host "Limpando cache do TypeScript..." -ForegroundColor Yellow
    Remove-Item -Path "$tsCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora abra o VS Code manualmente:" -ForegroundColor Cyan
Write-Host "  cd C:\Users\JE\servio.ai" -ForegroundColor White
Write-Host "  code ." -ForegroundColor White
