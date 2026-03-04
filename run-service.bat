@echo off
if "%1"=="" (
    echo Usage: run-service.bat [service-name]
    echo.
    echo Available services:
    echo   identity
    echo   tenant
    echo   patient
    echo   appointment
    echo   pharmacy
    echo   laboratory
    echo   doctor
    echo   encounter
    echo   billing
    echo   insurance
    echo   analytics
    exit /b
)

if /i "%1"=="identity" (
    cd src\IdentityService
    dotnet run --urls=http://localhost:5001
) else if /i "%1"=="tenant" (
    cd src\TenantService
    dotnet run --urls=http://localhost:5002
) else if /i "%1"=="patient" (
    cd src\PatientService
    dotnet run --urls=http://localhost:5003
) else if /i "%1"=="appointment" (
    cd src\AppointmentService
    dotnet run --urls=http://localhost:5004
) else if /i "%1"=="pharmacy" (
    cd src\PharmacyService
    dotnet run --urls=http://localhost:5006
) else if /i "%1"=="laboratory" (
    cd src\LaboratoryService
    dotnet run --urls=http://localhost:5007
) else if /i "%1"=="doctor" (
    cd src\DoctorService
    dotnet run --urls=http://localhost:5008
) else if /i "%1"=="encounter" (
    cd src\EncounterService
    dotnet run --urls=http://localhost:5009
) else if /i "%1"=="billing" (
    cd src\BillingService
    dotnet run --urls=http://localhost:5010
) else if /i "%1"=="insurance" (
    cd src\InsuranceService
    dotnet run --urls=http://localhost:5011
) else if /i "%1"=="analytics" (
    cd src\AnalyticsService
    dotnet run --urls=http://localhost:5012
) else (
    echo Invalid service name: %1
)
