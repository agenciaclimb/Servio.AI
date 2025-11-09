# Cloud Functions Deployment Script for Servio.AI (PowerShell)
# Usage: .\deploy-functions.ps1 [all|notify|rate|cleanup]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('all','notify','rate','cleanup')]
    [string]$FunctionName
)

Write-Host "🚀 Deploying Servio.AI Cloud Functions..." -ForegroundColor Cyan
Write-Host ""

# Navigate to functions directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$functionsPath = Join-Path (Split-Path -Parent $scriptPath) "functions"
Set-Location $functionsPath

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Deploy based on argument
switch ($FunctionName) {
    'all' {
        Write-Host "🔄 Deploying ALL functions..." -ForegroundColor Green
        firebase deploy --only functions
    }
    'notify' {
        Write-Host "🔔 Deploying notifyOnNewMessage..." -ForegroundColor Green
        firebase deploy --only functions:notifyOnNewMessage
    }
    'rate' {
        Write-Host "💰 Deploying updateProviderRate..." -ForegroundColor Green
        firebase deploy --only functions:updateProviderRate
    }
    'cleanup' {
        Write-Host "🧹 Deploying cleanupOldNotifications..." -ForegroundColor Green
        firebase deploy --only functions:cleanupOldNotifications
    }
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 View logs:" -ForegroundColor Cyan
Write-Host "  firebase functions:log --only $FunctionName"
Write-Host ""
Write-Host "🔍 Monitor:" -ForegroundColor Cyan
Write-Host "  https://console.firebase.google.com/"
