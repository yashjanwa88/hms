Write-Host "Starting Digital Hospital Services..." -ForegroundColor Green

$services = @(
    @{Name="IdentityService"; Port=5001; Path="src\IdentityService"},
    @{Name="TenantService"; Port=5002; Path="src\TenantService"},
    @{Name="PatientService"; Port=5003; Path="src\PatientService"},
    @{Name="AppointmentService"; Port=5004; Path="src\AppointmentService"},
    @{Name="PharmacyService"; Port=5006; Path="src\PharmacyService"},
    @{Name="LaboratoryService"; Port=5007; Path="src\LaboratoryService"},
    @{Name="DoctorService"; Port=5008; Path="src\DoctorService"},
    @{Name="EncounterService"; Port=5009; Path="src\EncounterService"},
    @{Name="BillingService"; Port=5010; Path="src\BillingService"},
    @{Name="InsuranceService"; Port=5011; Path="src\InsuranceService"},
    @{Name="AnalyticsService"; Port=5012; Path="src\AnalyticsService"}
)

foreach ($service in $services) {
    Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($service.Path)'; dotnet run --urls=http://localhost:$($service.Port)"
    Start-Sleep -Seconds 2
}

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping all services..." -ForegroundColor Red
Get-Process | Where-Object {$_.ProcessName -eq "dotnet"} | Stop-Process -Force
Write-Host "All services stopped." -ForegroundColor Green
