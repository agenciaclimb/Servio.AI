# Script de verificação de permissões Cloud Run sem interação
# Verifica Service Account e IAM bindings

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VERIFICAÇÃO DE SERVICE ACCOUNT - Cloud Run Backend" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$project = "gen-lang-client-0737507616"
$service = "servio-backend"
$region = "us-west1"

# 1. Verificar qual SA o Cloud Run está usando
Write-Host "1. Service Account do Cloud Run:" -ForegroundColor Yellow
$saCommand = "gcloud run services describe $service --region=$region --project=$project --format=`"value(spec.template.spec.serviceAccountName)`""
Write-Host "   Comando: $saCommand" -ForegroundColor Gray
Write-Host "   Executando..." -ForegroundColor Gray

try {
    $serviceAccount = gcloud run services describe $service --region=$region --project=$project --format="value(spec.template.spec.serviceAccountName)" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        if ([string]::IsNullOrWhiteSpace($serviceAccount)) {
            Write-Host "   ⚠ Nenhuma SA customizada configurada - usando SA padrão do Compute Engine" -ForegroundColor Yellow
            $serviceAccount = "[PROJECT_NUMBER]-compute@developer.gserviceaccount.com"
        } else {
            Write-Host "   ✓ Service Account: $serviceAccount" -ForegroundColor Green
        }
    } else {
        Write-Host "   ✗ Erro ao obter SA: $serviceAccount" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Verificar roles atribuídas à SA
Write-Host "`n2. Roles IAM da Service Account:" -ForegroundColor Yellow
Write-Host "   Verificando roles no projeto $project..." -ForegroundColor Gray

try {
    $iamPolicy = gcloud projects get-iam-policy $project --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$serviceAccount" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Roles atribuídas:" -ForegroundColor Green
        Write-Host $iamPolicy -ForegroundColor White
        
        # Verificar se tem role Firestore
        $hasFirestoreRole = $false
        if ($iamPolicy -match "datastore.user" -or $iamPolicy -match "datastore.owner" -or $iamPolicy -match "firebase.admin") {
            $hasFirestoreRole = $true
        }
        
        if ($hasFirestoreRole) {
            Write-Host "`n   ✓ SA tem permissões Firestore!" -ForegroundColor Green
        } else {
            Write-Host "`n   ✗ SA NÃO tem permissões Firestore!" -ForegroundColor Red
            Write-Host "`n   Para corrigir, execute:" -ForegroundColor Yellow
            Write-Host "   gcloud projects add-iam-policy-binding $project ``" -ForegroundColor Cyan
            Write-Host "     --member=`"serviceAccount:$serviceAccount`" ``" -ForegroundColor Cyan
            Write-Host "     --role=`"roles/datastore.user`"" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ✗ Erro ao obter IAM policy: $iamPolicy" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Verificar Firestore Security Rules
Write-Host "`n3. Firestore Security Rules:" -ForegroundColor Yellow
Write-Host "   Arquivo local: firestore.rules" -ForegroundColor Gray

if (Test-Path "firestore.rules") {
    Write-Host "   ✓ Arquivo encontrado" -ForegroundColor Green
    Write-Host "`n   Conteúdo atual:" -ForegroundColor Cyan
    Get-Content "firestore.rules" | Write-Host -ForegroundColor White
    
    Write-Host "`n   ℹ Verifique se as rules permitem acesso ao backend!" -ForegroundColor Yellow
    Write-Host "   Exemplo de rule que permite backend:" -ForegroundColor Gray
    Write-Host @"
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Permitir backend/admin (baseado em service account)
       match /{document=**} {
         allow read, write: if request.auth.uid != null;
         allow read, write: if request.time < timestamp.date(2099, 1, 1); // Temporário para testes
       }
     }
   }
"@ -ForegroundColor DarkGray
} else {
    Write-Host "   ✗ Arquivo firestore.rules não encontrado!" -ForegroundColor Red
}

# 4. Próximos passos
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verificar colecoes no Firestore:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/$project/firestore" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verificar logs do Cloud Run:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/run/detail/$region/$service/logs" -ForegroundColor Cyan
Write-Host ""
