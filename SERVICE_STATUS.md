# Digital Hospital Services Status

## ✅ Working Services (Successfully Running)

### 1. IdentityService - Port 5001
- Status: ✅ Running
- Database: ✅ Migrated
- Swagger: http://localhost:5001/swagger

### 2. PatientService - Port 5003  
- Status: ✅ Running
- Database: ✅ Migrated
- Swagger: http://localhost:5003/swagger

## ⚠️ Services with Port Issues (Need appsettings.json fix)

### 3. AppointmentService
- Issue: Trying to use port 5000 instead of 5004
- Fix: Check appsettings.json

### 4. DoctorService
- Issue: Trying to use port 5000 instead of 5008
- Fix: Check appsettings.json

### 5. LaboratoryService
- Issue: Trying to use port 5000 instead of 5007
- Fix: Check appsettings.json

### 6. EMRService
- Issue: Trying to use port 5000 instead of 5012
- Fix: Check appsettings.json

## ❌ Services with Database/Build Errors

### 7. PharmacyService
- Issue: SQL error - "functions in index predicate must be marked IMMUTABLE"
- Fix: Database schema needs correction

### 8. BillingService
- Issue: Build errors - PagedResult.Page not found
- Fix: Code compilation errors

### 9. InsuranceService
- Issue: Build errors - Missing implementations
- Fix: Code compilation errors

### 10. EncounterService
- Issue: Build errors - Missing implementations
- Fix: Code compilation errors

### 11. AnalyticsService
- Issue: Build errors - Missing implementations
- Fix: Code compilation errors

## 🎯 Immediate Action Required

**For Working Services:**
Run only these 2 services for now:
1. IdentityService (Port 5001) - ✅ Working
2. PatientService (Port 5003) - ✅ Working

**Test Login:**
```powershell
.\test-api.ps1
```

**Access Swagger:**
- Identity: http://localhost:5001/swagger
- Patient: http://localhost:5003/swagger

## 📝 Next Steps

1. Fix port configuration in appsettings.json for other services
2. Fix PharmacyService database schema
3. Fix build errors in Billing/Insurance/Encounter/Analytics services
4. Then run all services together

## 🚀 Quick Start (Working Services Only)

```powershell
# Terminal 1
cd src/IdentityService
dotnet run

# Terminal 2  
cd src/PatientService
dotnet run

# Terminal 3
.\test-api.ps1
```
