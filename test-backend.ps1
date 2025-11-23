Write-Host '🧪 Testando endpoints do Backend Cloud Run...' -ForegroundColor Cyan
Write-Host ''

$backend = 'https://servio-backend-1000250760228.us-west1.run.app'

Write-Host '1️⃣ Health Check:' -ForegroundColor Yellow
curl -s "$backend/health" | ConvertFrom-Json | ConvertTo-Json
Write-Host ''

Write-Host '2️⃣ Root Endpoint:' -ForegroundColor Yellow
curl -s "$backend/"
Write-Host ''

Write-Host '✅ Testes concluídos!' -ForegroundColor Green
