# Patient Service - Digital Hospital Platform

Production-ready Patient Management Microservice optimized for 5M+ patient records.

## Features

### Core Functionality
- **Fast Patient Registration** - Quick registration with minimal required fields
- **Duplicate Detection** - Smart duplicate checking by mobile, name, and DOB
- **Smart Search** - Search by UHID, mobile, name, policy number
- **Patient Merge** - Merge duplicate patient records
- **Visit Tracking** - Automatic visit count management
- **Multi-tenant Isolation** - Complete data isolation per hospital

### UHID Generation
Format: `PAT-{TENANTCODE}-{YYYY}-{SEQUENCE}`
Example: `PAT-HOSP-2024-000001`

Auto-incremented sequence per tenant per year using PostgreSQL function.

## Architecture

- **Pattern**: Clean Architecture + DDD
- **Framework**: .NET 8 Web API
- **ORM**: Dapper (No EF)
- **Database**: PostgreSQL with optimized indexes
- **Caching**: Redis (optional)
- **Events**: RabbitMQ (optional)
- **Auth**: JWT with role-based authorization

## Database Schema

### Tables
1. **patients** - Main patient registry
2. **patient_sequences** - UHID sequence generator
3. **patient_insurance_providers** - Insurance provider master

### Performance Optimizations
- Composite index on (tenant_id, mobile_number)
- Partial indexes WHERE is_deleted = false
- Full-text search index for name/UHID/mobile
- B-tree index with text_pattern_ops for LIKE queries
- Optimized for 5M+ records

## API Endpoints

### Patient Management
```
POST   /api/patients                    - Create patient
GET    /api/patients/{id}               - Get by ID
GET    /api/patients/uhid/{uhid}        - Get by UHID
PUT    /api/patients/{id}               - Update patient
GET    /api/patients/search             - Search patients
POST   /api/patients/{id}/deactivate    - Deactivate patient
```

### Advanced Features
```
POST   /api/patients/check-duplicates   - Check for duplicates
POST   /api/patients/merge              - Merge two patients
GET    /api/patients/stats              - Get statistics
GET    /api/patients/health             - Health check
```

## Request/Response Examples

### Create Patient
```json
POST /api/patients
Headers:
  Authorization: Bearer {token}
  X-Tenant-Id: {tenant-guid}
  X-Tenant-Code: HOSP
  X-User-Id: {user-guid}

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "Male",
  "dateOfBirth": "1990-01-15",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "bloodGroup": "O+",
  "city": "Mumbai",
  "state": "Maharashtra",
  "emergencyContactName": "Jane Doe",
  "emergencyContactMobile": "9876543211"
}

Response:
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "id": "guid",
    "uhid": "PAT-HOSP-2024-000001",
    "firstName": "John",
    "lastName": "Doe",
    "age": 34,
    "mobileNumber": "9876543210",
    "registrationDate": "2024-01-01T10:00:00Z",
    "status": "Active"
  }
}
```

### Search Patients
```json
GET /api/patients/search?searchTerm=john&pageNumber=1&pageSize=20

Response:
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 150,
    "pageNumber": 1,
    "pageSize": 20
  }
}
```

### Check Duplicates
```json
POST /api/patients/check-duplicates
Body: {same as create patient}

Response:
{
  "success": true,
  "data": {
    "isDuplicate": true,
    "potentialDuplicates": [
      {
        "id": "guid",
        "uhid": "PAT-HOSP-2024-000001",
        "fullName": "John Doe",
        "mobileNumber": "9876543210"
      }
    ]
  }
}
```

### Patient Stats
```json
GET /api/patients/stats

Response:
{
  "success": true,
  "data": {
    "totalPatients": 5234,
    "activePatients": 5100,
    "inactivePatients": 134,
    "todayRegistrations": 45,
    "thisMonthRegistrations": 892
  }
}
```

## Business Rules

1. **Duplicate Prevention**
   - Check by mobile + DOB (100% match)
   - Check by mobile only (80% match)
   - Check by name + DOB (70% match)

2. **Patient Status**
   - Active (default)
   - Inactive (deactivated)
   - Merged (merged into another record)

3. **Soft Delete**
   - No hard deletes
   - is_deleted flag used
   - Audit trail maintained

4. **Visit Count**
   - Auto-incremented on appointment
   - Merged during patient merge

## Authorization Roles

- **Create/Update**: Admin, HospitalAdmin, Doctor, Nurse, Receptionist
- **View**: All roles including Accountant
- **Deactivate/Merge**: Admin, HospitalAdmin only
- **Stats**: Admin, HospitalAdmin only

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=patient_db;Username=postgres;Password=your_password"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "RabbitMQ": {
    "HostName": "localhost"
  },
  "Urls": "http://localhost:5003"
}
```

## Running the Service

### Prerequisites
- .NET 8 SDK
- PostgreSQL 16
- Redis (optional)
- RabbitMQ (optional)

### Local Development
```bash
cd src/PatientService
dotnet restore
dotnet run
```

### Docker
```bash
docker build -t patient-service .
docker run -p 5003:5003 patient-service
```

### Database Setup
```bash
psql -h localhost -U postgres -d patient_db -f scripts/1.00.sql
```

## Performance Benchmarks

- **Search by Mobile**: < 50ms (with index)
- **Search by Name**: < 100ms (with full-text index)
- **Create Patient**: < 200ms
- **Duplicate Check**: < 100ms
- **Supports**: 5M+ patient records

## Monitoring

### Health Check
```
GET /api/patients/health
```

### Logs
- Location: `logs/patient-service-{date}.log`
- Format: JSON structured logging
- Levels: Information, Warning, Error

## Testing

### Swagger UI
http://localhost:5003/swagger

### Sample Test Data
Use the commented section in `scripts/1.00.sql` to insert sample insurance providers.

## Future Enhancements

- [ ] Photo upload support
- [ ] Document management
- [ ] Family linking
- [ ] Appointment history integration
- [ ] Billing history integration
- [ ] Lab results integration

## Version

**1.0.0** - Production Ready

## License

Proprietary - All Rights Reserved
