# Script de limpeza segura do sistema - Servio.AI
# Limpa arquivos temporários, cache e artefatos de build sem danificar o projeto

Write-Host "=== LIMPEZA SEGURA DO SISTEMA ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\JE\servio.ai"
$totalFreed = 0

# 1. Limpar node_modules/.cache
Write-Host "[1/6] Limpando cache do npm..." -ForegroundColor Yellow
if (Test-Path "$projectRoot\node_modules\.cache") {
    $size = (Get-ChildItem "$projectRoot\node_modules\.cache" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item "$projectRoot\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    Write-Host "  ✓ Liberado: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}

if (Test-Path "$projectRoot\backend\node_modules\.cache") {
    $size = (Get-ChildItem "$projectRoot\backend\node_modules\.cache" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item "$projectRoot\backend\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    Write-Host "  ✓ Backend cache: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}

# 2. Limpar dist e build
Write-Host "[2/6] Removendo builds antigos..." -ForegroundColor Yellow
$folders = @("dist", "build", ".next", ".vercel")
foreach ($folder in $folders) {
    $path = Join-Path $projectRoot $folder
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        $totalFreed += $size
        Write-Host "  ✓ $folder/: $([math]::Round($size, 2)) MB" -ForegroundColor Green
    }
}

# 3. Limpar coverage reports
Write-Host "[3/6] Removendo relatórios de cobertura..." -ForegroundColor Yellow
$coveragePaths = @("$projectRoot\coverage", "$projectRoot\backend\coverage")
foreach ($path in $coveragePaths) {
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        $totalFreed += $size
        $roundedSize = [math]::Round($size, 2)
        Write-Host "  ✓ ${path}: $roundedSize MB" -ForegroundColor Green
    }
}

# 4. Limpar logs
Write-Host "[4/6] Removendo arquivos de log..." -ForegroundColor Yellow
$logs = Get-ChildItem $projectRoot -Recurse -Include *.log -File -ErrorAction SilentlyContinue
if ($logs) {
    $size = ($logs | Measure-Object -Property Length -Sum).Sum / 1MB
    $logs | Remove-Item -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    Write-Host "  ✓ Logs: $([math]::Round($size, 2)) MB ($($logs.Count) arquivos)" -ForegroundColor Green
}

# 5. Limpar lighthouse reports
Write-Host "[5/6] Removendo relatórios Lighthouse..." -ForegroundColor Yellow
$lh = Get-ChildItem $projectRoot -Filter "lighthouse-report.*" -File -ErrorAction SilentlyContinue
if ($lh) {
    $size = ($lh | Measure-Object -Property Length -Sum).Sum / 1MB
    $lh | Remove-Item -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    Write-Host "  ✓ Lighthouse: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}

# 6. Limpar cache do VS Code (temporário - não afeta configurações)
Write-Host "[6/6] Limpando cache do VS Code..." -ForegroundColor Yellow
$vscodeCache = "$env:APPDATA\Code\Cache"
$vscodeCachedData = "$env:APPDATA\Code\CachedData"
if (Test-Path $vscodeCache) {
    $size = (Get-ChildItem $vscodeCache -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Remove-Item "$vscodeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    Write-Host "  ✓ VS Code Cache: $([math]::Round($size, 2)) MB" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== LIMPEZA CONCLUÍDA ===" -ForegroundColor Cyan
Write-Host "Total liberado: $([math]::Round($totalFreed, 2)) MB" -ForegroundColor Green
Write-Host ""
Write-Host "Próximas ações recomendadas:" -ForegroundColor Yellow
Write-Host "  1. Feche terminais ociosos no VS Code" -ForegroundColor White
Write-Host "  2. Recarregue a janela: Ctrl+Shift+P → 'Developer: Reload Window'" -ForegroundColor White
Write-Host "  3. Se ainda estiver lento, execute: npm cache clean --force" -ForegroundColor White
Write-Host ""
