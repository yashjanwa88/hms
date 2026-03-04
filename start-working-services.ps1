# Start only working Digital Hospital services

Write-Host "Starting working Digital Hospital services..." -ForegroundColor Green

# Identity Service - Port 5001
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\IdentityService'; Write-Host 'Starting Identity Service on port 5001...' -ForegroundColor Cyan; dotnet run"

Start-Sleep -Seconds 3

# Patient Service - Port 5003
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\PatientService'; Write-Host 'Starting Patient Service on port 5003...' -ForegroundColor Cyan; dotnet run"

Start-Sleep -Seconds 3

# Appointment Service - Port 5004
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\AppointmentService'; Write-Host 'Starting Appointment Service on port 5004...' -ForegroundColor Cyan; dotnet run"

Start-Sleep -Seconds 3

# Doctor Service - Port 5008
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\DoctorService'; Write-Host 'Starting Doctor Service on port 5008...' -ForegroundColor Cyan; dotnet run"

Start-Sleep -Seconds 3

# Laboratory Service - Port 5007
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\LaboratoryService'; Write-Host 'Starting Laboratory Service on port 5007...' -ForegroundColor Cyan; dotnet run"

Start-Sleep -Seconds 3

# EMR Service - Port 5012
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\EMRService'; Write-Host 'Starting EMR Service on port 5012...' -ForegroundColor Cyan; dotnet run"

Write-Host "`n✅ All working services started!" -ForegroundColor Green
Write-Host "`nSwagger URLs:" -ForegroundColor Cyan
Write-Host "- Identity: http://localhost:5001/swagger" -ForegroundColor Gray
Write-Host "- Patient: http://localhost:5003/swagger" -ForegroundColor Gray
Write-Host "- Appointment: http://localhost:5004/swagger" -ForegroundColor Gray
Write-Host "- Doctor: http://localhost:5008/swagger" -ForegroundColor Gray
Write-Host "- Laboratory: http://localhost:5007/swagger" -ForegroundColor Gray
Write-Host "- EMR: http://localhost:5012/swagger" -ForegroundColor Gray

Write-Host "`n⚠️ Note: Pharmacy service has database schema issues" -ForegroundColor Yellow
Write-Host "⚠️ Note: Billing/Insurance/Encounter/Analytics services have build errors" -ForegroundColor Yellow
