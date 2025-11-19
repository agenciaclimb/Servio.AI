# Script para verificar disponibilidade de domínios
# Uso: .\scripts\check_domain_availability.ps1

$domains = @(
    "getservio.ai",
    "getservio.app",
    "servio.tech",
    "servio.io",
    "myservio.com",
    "servioplatform.com",
    "servio.cloud",
    "servio.dev",
    "servio.online",
    "useservio.com"
)

Write-Host "`n🔍 Verificando disponibilidade de domínios...`n" -ForegroundColor Cyan

foreach ($domain in $domains) {
    try {
        $result = nslookup $domain 2>&1
        if ($result -match "can't find|Não é possível localizar|Non-existent") {
            Write-Host "✅ $domain - POSSIVELMENTE DISPONÍVEL" -ForegroundColor Green
        } else {
            Write-Host "❌ $domain - Já registrado" -ForegroundColor Red
        }
    } catch {
        Write-Host "✅ $domain - POSSIVELMENTE DISPONÍVEL" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n📝 Para confirmar e registrar:" -ForegroundColor Yellow
Write-Host "   Google Domains: https://domains.google.com" -ForegroundColor White
Write-Host "   Cloudflare: https://dash.cloudflare.com/domain-registration" -ForegroundColor White
Write-Host ""
