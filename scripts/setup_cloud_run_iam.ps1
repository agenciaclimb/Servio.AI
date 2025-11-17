# Script para corrigir IAM do Cloud Run Deploy
# Execute este script no PowerShell com gcloud autenticado

Write-Host "=== SERVIO.AI - Configuração IAM Cloud Run ===" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ID = "gen-lang-client-0737507616"
$SA_EMAIL = "servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com"
$REGION = "us-west1"
$REPO_NAME = "servio-ai"

# Verificar autenticação
Write-Host "1. Verificando autenticação gcloud..." -ForegroundColor Yellow
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "   Configurando projeto correto..." -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
}

# Criar repositório Artifact Registry (ignora erro se já existir)
Write-Host ""
Write-Host "2. Criando repositório Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts repositories create $REPO_NAME `
    --repository-format=docker `
    --location=$REGION `
    --description="Repositorio Docker para Servio.AI (backend + AI service)" `
    2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Repositório criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ℹ Repositório já existe (OK)" -ForegroundColor Gray
}

# Conceder permissões
Write-Host ""
Write-Host "3. Concedendo permissões à Service Account..." -ForegroundColor Yellow

$roles = @(
    "roles/artifactregistry.writer",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin"
)

foreach ($role in $roles) {
    Write-Host "   Adicionando $role..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$SA_EMAIL" `
        --role=$role `
        --condition=None `
        2>$null | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ $role concedido" -ForegroundColor Green
    } else {
        Write-Host "   ℹ $role já existe" -ForegroundColor Gray
    }
}

# Verificar permissões
Write-Host ""
Write-Host "4. Verificando permissões concedidas..." -ForegroundColor Yellow
$policies = gcloud projects get-iam-policy $PROJECT_ID `
    --flatten="bindings[].members" `
    --filter="bindings.members:$SA_EMAIL" `
    --format="value(bindings.role)" 2>$null

Write-Host ""
Write-Host "   Roles atribuídas à Service Account:" -ForegroundColor Cyan
$policies | ForEach-Object {
    if ($_ -match "artifactregistry|run\.|iam\.serviceAccountUser|storage") {
        Write-Host "   ✓ $_" -ForegroundColor Green
    } else {
        Write-Host "     $_" -ForegroundColor Gray
    }
}

# Resumo final
Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Cyan
Write-Host "Repositório: $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME" -ForegroundColor White
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor White
Write-Host ""
Write-Host "Próximo passo: Acionar deploy manual no GitHub Actions" -ForegroundColor Yellow
Write-Host "URL: https://github.com/agenciaclimb/Servio.AI/actions/workflows/deploy-cloud-run.yml" -ForegroundColor Gray
Write-Host ""
