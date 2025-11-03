# Script para corrigir permissões do Cloud Build
# Execute este script no seu terminal local com gcloud configurado

# 1. Obter o email da Service Account do Cloud Build
$PROJECT_ID = "gen-lang-client-0737507616"
$CLOUDBUILD_SA = "${PROJECT_ID}@cloudbuild.gserviceaccount.com"

Write-Host "Service Account do Cloud Build: $CLOUDBUILD_SA"

# 2. Conceder permissão Storage Admin ao Cloud Build
Write-Host "`nConcedendo permissão Storage Admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$CLOUDBUILD_SA" `
  --role="roles/storage.admin"

Write-Host "`n✅ Permissões atualizadas!"
Write-Host "Agora o Cloud Build pode criar/acessar buckets de Storage."
Write-Host "`nExecute novamente o deploy: git tag v0.0.13-backend && git push origin v0.0.13-backend"
