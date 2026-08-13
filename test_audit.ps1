# PS-05 Audit Test Script
# This script starts the backend and tests various endpoints

$env:DATABASE_URL = "postgresql://neondb_owner:npg_4iRL6AXkHBrE@ep-jolly-glitter-aykp4f6x-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:JWT_SECRET = "b73b7f5ede6f80ec803b0a7c421a433edfed2b0c36f44c38ce919c8ec7248623"
$env:CORS_ORIGIN = "http://localhost:5173"

# Start backend in background
Write-Host "Starting backend server..."
$backendCmd = & cmd /c "cd D:\BizIntel\backend && npx tsx src/server.ts"
Write-Host "Backend PID: $backendCmd"

# Wait for server to start
Start-Sleep -Seconds 3

# Test health endpoint
Write-Host "=== Testing Health Endpoint ==="
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" -Method Get
    Write-Host "Health: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $_"
}

# Test register endpoint
Write-Host "=== Testing Register Endpoint ==="
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/register" -Method Post -Body @{email="test@ps05.local"; password="TestPass#2026"; name="Test User"} -ContentType "application/json"
    Write-Host "Register response: $($response.success) - $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Register failed: $_"
}

# Test login endpoint
Write-Host "=== Testing Login Endpoint ==="
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body @{email="dev@ps05.local"; password="DevPass#2026"} -ContentType "application/json"
    Write-Host "Login response: $($response.success)" -ForegroundColor Green
    Write-Host "User: $($response.data.user.email)" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $_"
}

Write-Host "Done with basic tests."