# Script PowerShell para provisionar documentos Firestore via backend API
# Usa endpoint POST /users que agora tem merge:true

$backendUrl = "http://localhost:8081"

$users = @(
    @{
        email = "e2e-cliente@servio.ai"
        name = "E2E Cliente"
        type = "cliente"
        bio = ""
        location = "São Paulo"
        memberSince = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = "ativo"
    },
    @{
        email = "e2e-prestador@servio.ai"
        name = "E2E Prestador"
        type = "prestador"
        bio = ""
        location = "São Paulo"
        memberSince = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = "ativo"
        headline = "Prestador E2E"
        specialties = @("limpeza", "reparos")
        verificationStatus = "verificado"
        providerRate = 0.85
    },
    @{
        email = "admin@servio.ai"
        name = "E2E Admin"
        type = "admin"
        bio = ""
        location = "São Paulo"
        memberSince = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = "ativo"
    }
)

Write-Host "`n🔄 Provisionando documentos Firestore via backend API...`n" -ForegroundColor Cyan

foreach ($user in $users) {
    Write-Host "📝 Criando: $($user.email)" -ForegroundColor Yellow
    
    $body = $user | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/users" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "  ✅ Sucesso: $($response.message)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        if ($statusCode -eq 201 -or $errorBody -like "*already exists*" -or $errorBody -like "*successfully*") {
            Write-Host "  ✅ Documento criado/atualizado" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Status $statusCode : $errorBody" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Provisionamento concluído!`n" -ForegroundColor Green
