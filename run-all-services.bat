@echo off
echo Starting Digital Hospital Services...

start "IdentityService" cmd /k "cd src\IdentityService && dotnet run --urls=http://localhost:5001"
timeout /t 2 /nobreak >nul

start "TenantService" cmd /k "cd src\TenantService && dotnet run --urls=http://localhost:5002"
timeout /t 2 /nobreak >nul

start "PatientService" cmd /k "cd src\PatientService && dotnet run --urls=http://localhost:5003"
timeout /t 2 /nobreak >nul

start "AppointmentService" cmd /k "cd src\AppointmentService && dotnet run --urls=http://localhost:5004"
timeout /t 2 /nobreak >nul

start "PharmacyService" cmd /k "cd src\PharmacyService && dotnet run --urls=http://localhost:5006"
timeout /t 2 /nobreak >nul

start "LaboratoryService" cmd /k "cd src\LaboratoryService && dotnet run --urls=http://localhost:5007"
timeout /t 2 /nobreak >nul

start "DoctorService" cmd /k "cd src\DoctorService && dotnet run --urls=http://localhost:5008"
timeout /t 2 /nobreak >nul

start "EncounterService" cmd /k "cd src\EncounterService && dotnet run --urls=http://localhost:5009"
timeout /t 2 /nobreak >nul

start "BillingService" cmd /k "cd src\BillingService && dotnet run --urls=http://localhost:5010"
timeout /t 2 /nobreak >nul

start "InsuranceService" cmd /k "cd src\InsuranceService && dotnet run --urls=http://localhost:5011"
timeout /t 2 /nobreak >nul

start "AnalyticsService" cmd /k "cd src\AnalyticsService && dotnet run --urls=http://localhost:5012"

echo.
echo All services started!
echo Close individual windows to stop services.
pause
