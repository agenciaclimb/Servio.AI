# Grants Firestore access to Cloud Run default Service Account
# Usage: pwsh -File scripts/gcloud_fix_firestore_iam.ps1 -Project gen-lang-client-0737507616 -ServiceAccount 110025076228-compute@developer.gserviceaccount.com
param(
  [string]$Project = "gen-lang-client-0737507616",
  [string]$ServiceAccount = "110025076228-compute@developer.gserviceaccount.com"
)

Write-Host "Project:" $Project
Write-Host "Service Account:" $ServiceAccount

Write-Host "Authenticating..." -ForegroundColor Cyan
# Requires user to complete interactive auth in same shell
# If already authenticated, this is a no-op
try {
  gcloud auth list | Out-Null
} catch {
  gcloud auth login
}

gcloud config set project $Project | Out-Null

Write-Host "Granting Firestore role (roles/datastore.user)..." -ForegroundColor Cyan
$member = "serviceAccount:$ServiceAccount"

$roles = @(
  "roles/datastore.user",
  "roles/run.invoker"
)

foreach ($role in $roles) {
  Write-Host "Adding role $role" -ForegroundColor Yellow
  gcloud projects add-iam-policy-binding $Project `
    --member=$member `
    --role=$role | Out-Null
}

Write-Host "Done. Changes may take 1-2 minutes to propagate." -ForegroundColor Green
