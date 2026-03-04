@echo off
echo ========================================
echo Digital Hospital Platform - Quick Start
echo ========================================
echo.

echo [1/5] Building Solution...
dotnet build DigitalHospital.sln
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [2/5] Starting Infrastructure Services...
docker-compose up -d postgres-identity postgres-tenant rabbitmq redis
if %errorlevel% neq 0 (
    echo ERROR: Docker services failed to start!
    pause
    exit /b 1
)
echo Infrastructure services started!
echo.

echo [3/5] Waiting for databases to be ready...
timeout /t 10 /nobreak
echo.

echo [4/5] Database initialization...
echo Please run the following commands manually:
echo   psql -h localhost -p 5432 -U postgres -d identity_db -f src\IdentityService\scripts\1.00.sql
echo   psql -h localhost -p 5433 -U postgres -d tenant_db -f src\TenantService\scripts\1.00.sql
echo.

echo [5/5] Services Information:
echo   Identity Service: http://localhost:5001/swagger
echo   Tenant Service: http://localhost:5002/swagger
echo   RabbitMQ Management: http://localhost:15672 (admin/admin)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To run services:
echo   cd src\IdentityService
echo   dotnet run
echo.
echo To stop infrastructure:
echo   docker-compose down
echo.
pause
