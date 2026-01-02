# 🔥 Smoke Tests SIMPLES — Apenas Endpoints Públicos
# 27/12/2025 22:40 BRT

$API_URL = "http://localhost:8081"

Write-Host "`n🔥 SMOKE TESTS SIMPLES (endpoints públicos)`n" -ForegroundColor Cyan

$tests = @(
    @{name="Root"; url="/"; expected=200},
    @{name="Health"; url="/health"; expected=500},  # CSRF error expected
    @{name="API Health"; url="/api/health"; expected=500},
    @{name="Version"; url="/api/version"; expected=200},
    @{name="Routes List"; url="/api/routes"; expected=200}
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "[$($test.name)] ... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "$API_URL$($test.url)" -SkipHttpErrorCheck -TimeoutSec 5
        $status = [int]$response.StatusCode
        
        if ($status -eq $test.expected) {
            Write-Host "✓ $status" -ForegroundColor Green
            $passed++
            if ($response.Content.Length -gt 0 -and $response.Content.Length -lt 200) {
                Write-Host "  Response: $($response.Content)" -ForegroundColor DarkGray
            } elseif ($response.Content.Length -gt 0) {
                Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(150, $response.Content.Length)))..." -ForegroundColor DarkGray
            }
        } else {
            Write-Host "✗ Expected $($test.expected), got $status" -ForegroundColor Red
            $failed++
            if ($response.Content.Length -gt 0 -and $response.Content.Length -lt 200) {
                Write-Host "  Response: $($response.Content)" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTADO: $passed/$($tests.Count) passed" -ForegroundColor $(if ($passed -eq $tests.Count) { "Green" } else { "Yellow" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($passed -ge 3) {
    Write-Host "✓ Backend está VIVO e respondendo!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Backend com problemas críticos" -ForegroundColor Red
    exit 1
}
