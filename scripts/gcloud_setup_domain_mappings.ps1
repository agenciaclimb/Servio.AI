# Script para configurar Domain Mappings no Cloud Run
# Mapeia api.servio-ai.com → servio-backend e ai.servio-ai.com → servio-ai
# Uso: pwsh -File scripts/gcloud_setup_domain_mappings.ps1

param(
  [string]$Project = "gen-lang-client-0737507616",
  [string]$Region = "us-west1"
)

Write-Host "=== Configurando Domain Mappings do Cloud Run ===" -ForegroundColor Cyan
Write-Host "Project: $Project" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray

gcloud config set project $Project | Out-Null

# Verifica serviços existentes
Write-Host "`nVerificando serviços Cloud Run..." -ForegroundColor Yellow
$services = gcloud run services list --region=$Region --format="value(metadata.name)"
Write-Host "Serviços encontrados: $services" -ForegroundColor Gray

# Mapeia api.servio-ai.com para servio-backend
Write-Host "`nCriando mapeamento: api.servio-ai.com para servio-backend" -ForegroundColor Green
try {
  gcloud run domain-mappings create --service=servio-backend --domain=api.servio-ai.com --region=$Region 2>&1 | Out-Null
  Write-Host "Mapeamento criado com sucesso" -ForegroundColor Green
} catch {
  Write-Host "Mapeamento ja existe ou erro: $_" -ForegroundColor Yellow
}

# Mapeia ai.servio-ai.com para servio-ai
Write-Host "`nCriando mapeamento: ai.servio-ai.com para servio-ai" -ForegroundColor Green
try {
  gcloud run domain-mappings create --service=servio-ai --domain=ai.servio-ai.com --region=$Region 2>&1 | Out-Null
  Write-Host "Mapeamento criado com sucesso" -ForegroundColor Green
} catch {
  Write-Host "Mapeamento ja existe ou erro: $_" -ForegroundColor Yellow
}

# Lista mapeamentos criados
Write-Host "`n=== Domain Mappings Atuais ===" -ForegroundColor Cyan
gcloud beta run domain-mappings list --region=$Region --format="table(metadata.name,spec.routeName,status.url)"

Write-Host "`n=== Próximos Passos ===" -ForegroundColor Cyan
Write-Host "1. Anote os registros DNS exibidos acima" -ForegroundColor White
Write-Host "2. Acesse Cloud DNS e adicione os registros CNAME conforme instruído" -ForegroundColor White
Write-Host "3. Aguarde propagação DNS (5-30 minutos)" -ForegroundColor White
Write-Host "4. Teste: curl https://api.servio-ai.com/health" -ForegroundColor White
Write-Host "5. Teste: curl https://ai.servio-ai.com/health" -ForegroundColor White
