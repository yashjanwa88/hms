# Stop all running .NET services

Write-Host "Stopping all Digital Hospital services..." -ForegroundColor Red

# Kill all dotnet.exe processes
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill specific service executables
$services = @("IdentityService", "PatientService", "AppointmentService", "BillingService", 
              "DoctorService", "PharmacyService", "LaboratoryService", "EMRService")

foreach ($service in $services) {
    Get-Process -Name $service -ErrorAction SilentlyContinue | Stop-Process -Force
}

Write-Host "All services stopped!" -ForegroundColor Green
