# Quick script to get Cloud Run service account without authentication prompts
# Uses REST API instead of gcloud CLI

$project = "gen-lang-client-0737507616"
$service = "servio-backend"
$region = "us-west1"

Write-Host "`n=== VERIFICANDO SERVICE ACCOUNT DO CLOUD RUN ===" -ForegroundColor Cyan
Write-Host ""

# Try to get access token from gcloud (if already authenticated)
try {
    $token = gcloud auth print-access-token 2>$null
    
    if ($LASTEXITCODE -eq 0 -and $token) {
        Write-Host "Token obtido com sucesso!" -ForegroundColor Green
        
        # Make REST API call
        $url = "https://run.googleapis.com/v2/projects/$project/locations/$region/services/$service"
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        Write-Host "Consultando Cloud Run API..." -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        
        $serviceAccount = $response.template.serviceAccount
        
        if ($serviceAccount) {
            Write-Host "`nService Account do Cloud Run:" -ForegroundColor Yellow
            Write-Host "  $serviceAccount" -ForegroundColor Green
            Write-Host ""
            Write-Host "Agora verifique no console IAM se esta SA tem a role:" -ForegroundColor Yellow
            Write-Host "  Cloud Datastore User (roles/datastore.user)" -ForegroundColor Cyan
            Write-Host ""
        } else {
            Write-Host "`nNenhuma SA customizada - usando default Compute Engine SA" -ForegroundColor Yellow
            Write-Host "SA default: [PROJECT_NUMBER]-compute@developer.gserviceaccount.com" -ForegroundColor Gray
        }
    } else {
        Write-Host "Nao foi possivel obter token. Vou mostrar comando alternativo..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Execute este comando em um terminal autenticado:" -ForegroundColor Cyan
        Write-Host "gcloud run services describe servio-backend --region=us-west1 --format=json | Select-String serviceAccount" -ForegroundColor White
    }
} catch {
    Write-Host "Erro ao consultar API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ALTERNATIVA: Verifique manualmente via console:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://console.cloud.google.com/run/detail/us-west1/servio-backend?project=$project" -ForegroundColor Cyan
    Write-Host "2. Clique na aba 'YAML'" -ForegroundColor Cyan
    Write-Host "3. Procure por 'serviceAccount:'" -ForegroundColor Cyan
}

Write-Host ""
