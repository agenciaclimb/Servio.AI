$users = @(
    @{
        email = "e2e-cliente@servio.ai"
        name = "E2E Cliente"
        type = "cliente"
        bio = ""
        location = "Sao Paulo"
        memberSince = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = "ativo"
    },
    @{
        email = "e2e-prestador@servio.ai"
        name = "E2E Prestador"
        type = "prestador"
        bio = ""
        location = "Sao Paulo"
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
        location = "Sao Paulo"
        memberSince = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        status = "ativo"
    }
)

Write-Host "Provisionando documentos Firestore..."

foreach ($user in $users) {
    Write-Host "Criando: $($user.email)"
    $body = $user | ConvertTo-Json -Depth 10
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/users" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  OK: $($response.message)"
    } catch {
        Write-Host "  Erro: $($_.Exception.Message)"
    }
}

Write-Host "Concluido!"
