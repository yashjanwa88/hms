# Digital Hospital API Testing Script

$baseUrl = "http://localhost:5001"

Write-Host "=== Digital Hospital API Testing ===" -ForegroundColor Cyan

# 1. Register User
Write-Host "`n1. Registering new user..." -ForegroundColor Yellow

$registerBody = @{
    email = "admin@hospital.com"
    password = "Admin@123"
    firstName = "Admin"
    lastName = "User"
    roleId = "00000000-0000-0000-0000-000000000001"
    tenantId = "00000000-0000-0000-0000-000000000001"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/identity/v1/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.data.userId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 2. Login
Write-Host "`n2. Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = "admin@hospital.com"
    password = "Admin@123"
} | ConvertTo-Json

$headers = @{
    "X-Tenant-Id" = "00000000-0000-0000-0000-000000000001"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/identity/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers $headers
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "`nAccess Token:" -ForegroundColor Cyan
    Write-Host $loginResponse.data.accessToken -ForegroundColor Gray
    Write-Host "`nUser Details:" -ForegroundColor Cyan
    Write-Host "Email: $($loginResponse.data.email)" -ForegroundColor Gray
    Write-Host "Role: $($loginResponse.data.role)" -ForegroundColor Gray
    Write-Host "Tenant ID: $($loginResponse.data.tenantId)" -ForegroundColor Gray
    
    # Save token to file
    $loginResponse.data.accessToken | Out-File -FilePath "token.txt" -NoNewline
    Write-Host "`n✓ Token saved to token.txt" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
