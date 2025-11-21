# Tail last error logs from Cloud Run service
# Usage: pwsh -File scripts/gcloud_tail_logs.ps1 -Project gen-lang-client-0737507616 -Service servio-backend -Region us-west1 -Limit 50
param(
  [string]$Project = "gen-lang-client-0737507616",
  [string]$Service = "servio-backend",
  [string]$Region = "us-west1",
  [int]$Limit = 50
)

gcloud config set project $Project | Out-Null

$filter = "resource.type=cloud_run_revision AND resource.labels.service_name=$Service AND resource.labels.location=$Region AND severity>=ERROR"
Write-Host "Reading logs with filter:" $filter -ForegroundColor Cyan

gcloud logging read "$filter" --limit=$Limit --format="table(timestamp, severity, textPayload)"
