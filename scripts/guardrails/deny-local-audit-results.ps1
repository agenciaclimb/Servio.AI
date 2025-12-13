# GUARDRAIL: Anti-Simulação de Auditoria (PowerShell)
# 
# Propósito: Garantir que arquivos *-ack.json e *-result.json em ai-tasks/events/
# apenas existam se forem provenientes do GEMINI externo (com prova de origem).

$ErrorActionPreference = "Stop"
$EVENTS_DIR = Join-Path $PSScriptRoot "..\..\ai-tasks\events"
$VIOLATIONS = @()

function Get-FileHash256 {
    param([string]$FilePath)
    try {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        return $hash.Hash.ToLower()
    } catch {
        return $null
    }
}

function Test-ProofOfOrigin {
    param(
        [string]$ProofPath,
        [string]$ExpectedHash
    )
    
    if (-not (Test-Path $ProofPath)) {
        return @{ Valid = $false; Reason = "proof-of-origin.txt não existe" }
    }

    $content = Get-Content $ProofPath -Raw
    $lines = $content -split "`n" | Where-Object { $_.Trim() }

    $hasDate = $lines | Where-Object { $_ -match "data|hora|timestamp" }
    $hasLink = $lines | Where-Object { $_ -match "https?://" }
    $hasHash = $lines | Where-Object { $_ -match $ExpectedHash }

    if (-not $hasDate) {
        return @{ Valid = $false; Reason = "falta data/hora no proof-of-origin.txt" }
    }
    if (-not $hasLink) {
        return @{ Valid = $false; Reason = "falta link do chat externo" }
    }
    if (-not $hasHash) {
        return @{ Valid = $false; Reason = "hash SHA256 não corresponde: esperado $ExpectedHash" }
    }

    return @{ Valid = $true }
}

function Find-Violations {
    param([string]$Directory = $EVENTS_DIR)

    if (-not (Test-Path $Directory)) {
        Write-Host "✅ Diretório ai-tasks/events/ não existe (sem violações possíveis)" -ForegroundColor Green
        return
    }

    $files = Get-ChildItem -Path $Directory -Recurse -File

    foreach ($file in $files) {
        $isSuspicious = $file.Name -match "-ack.*\.json$" -or $file.Name -match "-result.*\.json$"
        
        if (-not $isSuspicious) { continue }

        $dirPath = $file.DirectoryName
        $proofPath = Join-Path $dirPath "proof-of-origin.txt"
        $fileHash = Get-FileHash256 -FilePath $file.FullName

        if (-not $fileHash) {
            $script:VIOLATIONS += @{
                File = $file.FullName
                Reason = "Arquivo corrompido ou ilegível"
            }
            continue
        }

        $validation = Test-ProofOfOrigin -ProofPath $proofPath -ExpectedHash $fileHash

        if (-not $validation.Valid) {
            $script:VIOLATIONS += @{
                File = $file.FullName
                Reason = $validation.Reason
                Hash = $fileHash
            }
        }
    }
}

function Show-Report {
    if ($VIOLATIONS.Count -eq 0) {
        Write-Host "`n✅ GUARDRAIL PASSOU: Nenhuma violação detectada`n" -ForegroundColor Green
        Write-Host "   Todos os arquivos *-ack*.json e *-result*.json têm proof-of-origin.txt válido"
        Write-Host "   ou não existem arquivos suspeitos.`n"
        return $true
    }

    Write-Host "`n❌ GUARDRAIL FALHOU: Violações de segregação detectadas`n" -ForegroundColor Red
    Write-Host "   REGRA VIOLADA: Arquivos *-ack*.json ou *-result*.json sem prova de origem válida`n"

    $idx = 1
    foreach ($v in $VIOLATIONS) {
        $relativePath = Resolve-Path -Relative $v.File
        Write-Host "   $idx. $relativePath" -ForegroundColor Yellow
        Write-Host "      Motivo: $($v.Reason)"
        if ($v.Hash) {
            Write-Host "      Hash: $($v.Hash)"
        }
        Write-Host ""
        $idx++
    }

    Write-Host "🔧 COMO CORRIGIR:`n"
    Write-Host "   1. Se o arquivo foi criado localmente (simulação), DELETE-O:"
    Write-Host "      Remove-Item `"caminho/do/arquivo.json`"`n"
    Write-Host "   2. Se o arquivo veio do GEMINI externo, crie proof-of-origin.txt:"
    Write-Host "      Set-Content proof-of-origin.txt 'Data: 2025-12-13 10:30'"
    Write-Host "      Add-Content proof-of-origin.txt 'Link: https://chat.openai.com/share/abc123'"
    Write-Host "      Add-Content proof-of-origin.txt 'Hash: [hash_sha256_do_json]'`n"
    Write-Host "   3. Commit apenas se tiver evidência verificável de origem externa.`n"

    return $false
}

# Execução principal
Write-Host "🛡️  GUARDRAIL: Verificando segregação Executor/GEMINI...`n" -ForegroundColor Cyan

Find-Violations
$passed = Show-Report

if ($passed) {
    exit 0
} else {
    exit 1
}
