# PS-05 Audit Test Script
# Test backend API endpoints

$env:DATABASE_URL = "postgresql://neondb_owner:npg_4iRL6AXkHBrE@ep-jolly-glitter-aykp4f6x-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:JWT_SECRET = "b73b7f5ede6f80ec803b0a7c421a433edfed2b0c36f44c38ce919c8ec7248623"

# Helper: make API call
function Invoke-API {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = null
    )
    $uri = "http://localhost:5000$Path"
    $headers = @{"Content-Type" = "application/json"}
    if ($Body) {
        $bodyJson = $Body | ConvertTo-Json -Depth 10
    }
    
    Write-Host "API: $Method $uri" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $bodyJson -ContentType "application/json"
        Write-Host "  Response: Success=true" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  Response: Error - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Start backend server as background process
Write-Host "=== Starting Backend Server ===" -ForegroundColor Yellow
$backendOutput = & C:\Program Files\PowerShell\7\pwsh.exe -NoProfile -Command "cd 'D:\BizIntel\backend'; npx tsx src/server.ts" 2>&1 &
$backendPid = $LASTEXITCODE
Write-Host "Backend started (check if running on port 5000)" -ForegroundColor Yellow

# Wait for server to start
Start-Sleep -Seconds 3

# Test 1: Health endpoint
Write-Host "`n=== Test 1: Health Endpoint ===`n" -ForegroundColor White
$health = Invoke-API -Method Get -Path "/api/v1/health"
if ($health -and $health.success) {
    Write-Host "PASS: Health endpoint working" -ForegroundColor Green
} else {
    Write-Host "FAIL: Health endpoint not working" -ForegroundColor Red
}

# Test 2: Register endpoint
Write-Host "`n=== Test 2: Register Endpoint ===`n" -ForegroundColor White
$register = Invoke-API -Method Post -Path "/api/v1/auth/register" -Body @{email="audit@ps05.local"; password="AuditPass#2026"; name="Audit User"}
if ($register -and $register.success) {
    Write-Host "PASS: Register endpoint working" -ForegroundColor Green
    $userId = $register.data.user.id
} else {
    Write-Host "FAIL: Register endpoint failed" -ForegroundColor Red
}

# Test 3: Login endpoint
Write-Host "`n=== Test 3: Login Endpoint ===`n" -ForegroundColor White
$login = Invoke-API -Method Post -Path "/api/v1/auth/login" -Body @{email="dev@ps05.local"; password="DevPass#2026"}
if ($login -and $login.success) {
    Write-Host "PASS: Login endpoint working" -ForegroundColor Green
    $token = $login.data.token ?? $login.headers["set-cookie"]
    Write-Host "  Token obtained: $($token.Substring(0,20)...)" -ForegroundColor Gray
} else {
    Write-Host "FAIL: Login endpoint failed" -ForegroundColor Red
}

# Test 4: Me endpoint (protected)
Write-Host "`n=== Test 4: Me (Protected) Endpoint ===`n" -ForegroundColor White
if ($login -and $login.success) {
    $me = Invoke-API -Method Get -Path "/api/v1/auth/me"
    if ($me -and $me.success) {
        Write-Host "PASS: Me endpoint working, user: $($me.data.user.email)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Me endpoint failed - not authenticated" -ForegroundColor Red
    }
} else {
    Write-Host "SKIP: Cannot test Me endpoint without login" -ForegroundColor Yellow
}

# Test 5: Invalid login
Write-Host "`n=== Test 5: Invalid Login ===`n" -ForegroundColor White
$badLogin = Invoke-API -Method Post -Path "/api/v1/auth/login" -Body @{email="wrong@ps05.local"; password="wrongpassword"}
if ($badLogin -and $badLogin.success -eq false) {
    Write-Host "PASS: Invalid login correctly rejected" -ForegroundColor Green
} else {
    Write-Host "FAIL: Invalid login should be rejected" -ForegroundColor Red
}

Write-Host "`n=== All basic tests complete ===`n" -ForegroundColor Cyan

# Kill any background backend process
Write-Host "Cleaning up backend process..." -ForegroundColor Magenta
# We can't easily kill it from here, but the process should exit when the script ends