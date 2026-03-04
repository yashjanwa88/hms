# Encounter Service

Production-ready microservice for managing clinical encounters in a digital hospital management system.

## Overview

The Encounter Service manages patient-doctor encounters, including vitals recording, diagnosis, prescriptions, clinical notes, and lab orders. It integrates with Appointment, Doctor, and Patient services to ensure data consistency.

## Architecture

- **Clean Architecture**: Domain, Application, Infrastructure, Controllers layers
- **DDD Pattern**: Domain-driven design with rich domain models
- **Database**: PostgreSQL with Dapper ORM (NO Entity Framework)
- **Caching**: Redis for performance optimization
- **Messaging**: RabbitMQ for event-driven communication
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control

## Port Allocation

- **Service**: 5009
- **Database**: 5436 (PostgreSQL)

## Database Schema

### Tables

1. **encounters** - Main encounter records
2. **encounter_vitals** - Patient vital signs
3. **encounter_diagnosis** - Diagnosis records
4. **encounter_prescriptions** - Medication prescriptions
5. **encounter_notes** - Clinical notes
6. **encounter_lab_orders** - Laboratory test orders

All tables include:
- UUID primary keys
- Multi-tenant support (tenant_id)
- Audit fields (created_at, created_by, updated_at, updated_by)
- Soft delete (is_deleted)

## Business Rules

### Encounter Number Generation
- Format: `ENC-{TENANTCODE}-{YYYY}-{SEQUENCE}`
- Example: `ENC-APOLLO-2024-000001`
- Atomic sequential generation per tenant per year

### Validation Rules

1. **Create Encounter**
   - Appointment must be in "CheckedIn" status
   - Only one active encounter per appointment
   - Patient must exist (validated via Patient Service)
   - Doctor must exist (validated via Doctor Service)

2. **Complete Encounter**
   - At least one diagnosis required
   - Cannot complete cancelled encounter
   - Cannot complete already completed encounter

3. **Modify Encounter**
   - Cannot modify completed encounters
   - Cannot modify cancelled encounters

4. **Vitals**
   - Temperature: 35.0 - 45.0°C
   - Heart Rate: 30 - 250 bpm
   - Respiratory Rate: 5 - 60 breaths/min
   - Oxygen Saturation: 0 - 100%
   - BMI auto-calculated from weight and height

## API Endpoints

### 1. Create Encounter
```http
POST /api/encounters
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse

Request Body:
{
  "appointmentId": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "chiefComplaint": "string",
  "presentIllness": "string"
}
```

### 2. Get Encounter
```http
GET /api/encounters/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse, Receptionist
```

### 3. Complete Encounter
```http
POST /api/encounters/{id}/complete
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor

Request Body:
{
  "summary": "string"
}
```

### 4. Cancel Encounter
```http
POST /api/encounters/{id}/cancel
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse

Request Body:
{
  "reason": "string"
}
```

### 5. Add Vitals
```http
POST /api/encounters/{id}/vitals
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse

Request Body:
{
  "temperature": 37.5,
  "bloodPressure": "120/80",
  "heartRate": 72,
  "respiratoryRate": 16,
  "weight": 70.5,
  "height": 1.75,
  "oxygenSaturation": 98
}
```

### 6. Add Diagnosis
```http
POST /api/encounters/{id}/diagnosis
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor

Request Body:
{
  "diagnosisCode": "J00",
  "diagnosisName": "Acute nasopharyngitis",
  "diagnosisType": "Primary",
  "notes": "string"
}
```

### 7. Add Prescription
```http
POST /api/encounters/{id}/prescriptions
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor

Request Body:
{
  "medicineName": "Paracetamol",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "route": "Oral",
  "durationDays": 5,
  "instructions": "Take after meals"
}
```

### 8. Add Note
```http
POST /api/encounters/{id}/notes
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse

Request Body:
{
  "noteType": "Progress",
  "noteText": "Patient showing improvement"
}
```

### 9. Add Lab Order
```http
POST /api/encounters/{id}/lab-orders
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor

Request Body:
{
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "priority": "Routine",
  "clinicalNotes": "string"
}
```

### 10. Search Encounters
```http
GET /api/encounters/search?patientId={uuid}&doctorId={uuid}&fromDate={date}&toDate={date}&status={status}&page=1&pageSize=10
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse, Receptionist
```

## Service Integration

### Appointment Service
- **Validate Appointment**: Check appointment exists and status
- **Update Status**: Update appointment status after encounter creation

### Doctor Service
- **Validate Doctor**: Verify doctor exists and is active

### Patient Service
- **Validate Patient**: Verify patient exists and is active

## Events Published

### 1. EncounterCreatedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "encounterId": "uuid",
  "encounterNumber": "string",
  "appointmentId": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "encounterDate": "date"
}
```

### 2. EncounterCompletedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "encounterId": "uuid",
  "encounterNumber": "string",
  "patientId": "uuid",
  "doctorId": "uuid",
  "completedAt": "timestamp"
}
```

### 3. PrescriptionCreatedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "encounterId": "uuid",
  "prescriptionId": "uuid",
  "patientId": "uuid",
  "medicineName": "string"
}
```

### 4. LabOrderCreatedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "encounterId": "uuid",
  "labOrderId": "uuid",
  "patientId": "uuid",
  "testName": "string",
  "priority": "string"
}
```

## Caching Strategy

- **Get Encounter**: 10 minutes TTL
- **Cache Invalidation**: On update, complete, cancel, add vitals/diagnosis/prescription/note/lab order
- **Cache Key Format**: `encounter:{tenantId}:{encounterId}`

## Status Flow

```
Active → Completed
Active → Cancelled
```

## Role-Based Access

| Endpoint | Doctor | Nurse | Receptionist |
|----------|--------|-------|--------------|
| Create Encounter | ✓ | ✓ | ✗ |
| Get Encounter | ✓ | ✓ | ✓ |
| Complete Encounter | ✓ | ✗ | ✗ |
| Cancel Encounter | ✓ | ✓ | ✗ |
| Add Vitals | ✓ | ✓ | ✗ |
| Add Diagnosis | ✓ | ✗ | ✗ |
| Add Prescription | ✓ | ✗ | ✗ |
| Add Note | ✓ | ✓ | ✗ |
| Add Lab Order | ✓ | ✗ | ✗ |
| Search Encounters | ✓ | ✓ | ✓ |

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5436;Database=encounter_db;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "YourSuperSecretKeyForJWTTokenGenerationMinimum32Characters!@#"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Port": "5672",
    "Username": "guest",
    "Password": "guest"
  },
  "ServiceUrls": {
    "AppointmentService": "http://localhost:5004",
    "DoctorService": "http://localhost:5008",
    "PatientService": "http://localhost:5003"
  }
}
```

## Running the Service

### Local Development
```bash
cd src/EncounterService
dotnet restore
dotnet run
```

### Docker
```bash
docker-compose up encounter-service
```

## Health Check
```http
GET /api/encounters/health
```

## Dependencies

- .NET 8.0
- Dapper 2.1.28
- Npgsql 8.0.1
- StackExchange.Redis 2.7.10
- JWT Bearer Authentication
- Swagger/OpenAPI

## Database Migration

Run the schema script:
```bash
psql -h localhost -p 5436 -U postgres -d encounter_db -f scripts/1.00.sql
```

## Testing

Use Swagger UI at: `http://localhost:5009/swagger`

## Security

- JWT authentication required for all endpoints (except health check)
- Role-based authorization enforced
- Multi-tenant isolation via tenant_id
- SQL injection prevention via parameterized queries
- Input validation on all requests

## Performance

- Redis caching reduces database load
- Indexed queries for fast searches
- Async/await throughout for scalability
- Connection pooling for database efficiency

## Monitoring

- Health check endpoint for container orchestration
- Structured logging with Serilog
- Request tracking middleware
- Exception handling middleware
