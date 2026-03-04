# Start all Digital Hospital services

Write-Host "Starting all Digital Hospital services..." -ForegroundColor Green

# Identity Service - Port 5001
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\IdentityService'; dotnet run"
Start-Sleep -Seconds 2

# Tenant Service - Port 5002
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\TenantService'; dotnet run"
Start-Sleep -Seconds 2

# Patient Service - Port 5003
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\PatientService'; dotnet run"
Start-Sleep -Seconds 2

# Appointment Service - Port 5004
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\AppointmentService'; dotnet run"
Start-Sleep -Seconds 2

# Billing Service - Port 5005
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\BillingService'; dotnet run"
Start-Sleep -Seconds 2

# Pharmacy Service - Port 5006
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\PharmacyService'; dotnet run"
Start-Sleep -Seconds 2

# Laboratory Service - Port 5007
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\LaboratoryService'; dotnet run"
Start-Sleep -Seconds 2

# Doctor Service - Port 5008
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\DoctorService'; dotnet run"
Start-Sleep -Seconds 2

# EMR Service - Port 5012
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Digital Hospital Infrastructure Company\DigitalHospital\src\EMRService'; dotnet run"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "`nSwagger URLs:" -ForegroundColor Cyan
Write-Host "- Identity: http://localhost:5001/swagger" -ForegroundColor Gray
Write-Host "- Tenant: http://localhost:5002/swagger" -ForegroundColor Gray
Write-Host "- Patient: http://localhost:5003/swagger" -ForegroundColor Gray
Write-Host "- Appointment: http://localhost:5004/swagger" -ForegroundColor Gray
Write-Host "- Billing: http://localhost:5005/swagger" -ForegroundColor Gray
Write-Host "- Pharmacy: http://localhost:5006/swagger" -ForegroundColor Gray
Write-Host "- Laboratory: http://localhost:5007/swagger" -ForegroundColor Gray
Write-Host "- Doctor: http://localhost:5008/swagger" -ForegroundColor Gray
Write-Host "- EMR: http://localhost:5012/swagger" -ForegroundColor Gray
