# Register User Script

$identityUrl = "http://localhost:5001"

# Generate new GUIDs
$tenantId = [guid]::NewGuid().ToString()
$userId = [guid]::NewGuid().ToString()

Write-Host "Registering new user..." -ForegroundColor Cyan

# Register User
$registerBody = @{
    email = "admin@hospital.com"
    password = "Admin@123"
    firstName = "Admin"
    lastName = "User"
    roleName = "Admin"
    phoneNumber = "1234567890"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Tenant-Id" = $tenantId
}

try {
    $response = Invoke-RestMethod -Uri "$identityUrl/api/identity/v1/auth/register" -Method Post -Body $registerBody -Headers $headers
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    Write-Host "Email: admin@hospital.com" -ForegroundColor Yellow
    Write-Host "Password: Admin@123" -ForegroundColor Yellow
    Write-Host "Tenant ID: $tenantId" -ForegroundColor Yellow
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n---`n"
Write-Host "Now login with:" -ForegroundColor Green
Write-Host "Email: admin@hospital.com"
Write-Host "Password: Admin@123"
Write-Host "Tenant ID: $tenantId"
