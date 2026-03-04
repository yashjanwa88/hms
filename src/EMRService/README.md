# EMR Service (Electronic Medical Record)

Production-ready microservice for managing electronic medical records in a multi-tenant hospital environment.

## Features

- **Encounter Management**: Create and manage patient encounters with unique encounter numbers
- **Clinical Notes**: SOAP format support for clinical documentation
- **Diagnosis Management**: ICD-10 coded diagnoses with primary/secondary classification
- **Vital Signs**: Automatic BMI calculation from height and weight
- **Allergy Tracking**: Patient allergy records with severity levels
- **Procedure Management**: Track planned and completed procedures
- **Multi-tenant**: Complete tenant isolation at database level
- **Event-Driven**: Publishes events to RabbitMQ for integration
- **Redis Caching**: 30-minute TTL for ICD-10 codes and templates
- **Role-Based Access**: Only assigned doctors can modify encounters

## Architecture

- **Pattern**: Clean Architecture + DDD
- **Framework**: .NET 8 Web API
- **Database**: PostgreSQL with Dapper ORM
- **Caching**: Redis
- **Messaging**: RabbitMQ
- **Logging**: Serilog (Console + File)
- **Authentication**: JWT Bearer tokens

## Domain Models

### Encounter
- Unique encounter number: `ENC-{TENANTCODE}-{YYYY}-{SEQUENCE}`
- Status: Open, Closed
- Types: OPD, IPD, Emergency
- Assigned to specific doctor

### Clinical Note
- SOAP format (Subjective, Objective, Assessment, Plan)
- Types: SOAP, Progress, Discharge
- Linked to encounter

### Diagnosis
- ICD-10 code support
- Primary/Secondary classification
- At least one primary diagnosis required to close encounter

### Vital
- Temperature, Pulse, BP, Respiratory Rate, SpO2
- Height, Weight with auto-calculated BMI
- Formula: BMI = Weight(kg) / (Height(m))²

### Allergy
- Types: Drug, Food, Environmental
- Severity: Mild, Moderate, Severe
- Patient-level tracking

### Procedure
- Procedure code and name
- Status: Planned, Completed, Cancelled
- Linked to encounter

## API Endpoints

### Encounters
```
POST   /api/emr/encounters
GET    /api/emr/encounters/{id}
GET    /api/emr/encounters/by-patient/{patientId}
POST   /api/emr/encounters/{id}/close
```

### Clinical Notes
```
POST   /api/emr/encounters/{id}/notes
GET    /api/emr/encounters/{id}/notes
```

### Vitals
```
POST   /api/emr/encounters/{id}/vitals
GET    /api/emr/encounters/{id}/vitals
```

### Diagnosis
```
POST   /api/emr/encounters/{id}/diagnosis
GET    /api/emr/encounters/{id}/diagnosis
```

### Allergies
```
POST   /api/emr/patients/{patientId}/allergies
GET    /api/emr/patients/{patientId}/allergies
```

### Procedures
```
POST   /api/emr/encounters/{id}/procedures
GET    /api/emr/encounters/{id}/procedures
```

### Health Check
```
GET    /api/emr/health
```

## Business Rules

1. **Encounter Number Generation**: Atomic sequence using PostgreSQL UPSERT
2. **Closed Encounter**: Cannot be modified once closed
3. **Doctor Authorization**: Only assigned doctor can edit encounter
4. **Primary Diagnosis**: Required before closing encounter
5. **BMI Calculation**: Automatic when height and weight provided
6. **Soft Delete**: All records use soft delete (is_deleted flag)

## Events Published

- `encounter.closed` - EncounterClosedEvent
- `lab.order.requested` - LabOrderRequestedEvent
- `prescription.requested` - PrescriptionRequestedEvent

## Database Schema

### Tables
- `encounters` - Patient encounters
- `clinical_notes` - SOAP notes
- `diagnoses` - ICD-10 diagnoses
- `vitals` - Vital signs
- `allergies` - Patient allergies
- `procedures` - Medical procedures
- `emr_sequences` - Encounter number sequences

### Performance Indexes
- Composite indexes on (tenant_id, patient_id)
- Partial indexes WHERE is_deleted = false
- Optimized for 50,000+ encounters/day

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "EMRDatabase": "Host=localhost;Port=5439;Database=emr_db;...",
    "Redis": "localhost:6379"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Port": "5672"
  },
  "Jwt": {
    "Key": "your-secret-key",
    "Issuer": "DigitalHospital"
  }
}
```

## Setup

### 1. Database Setup
```bash
# Create database
createdb -h localhost -p 5439 -U postgres emr_db

# Run schema
psql -h localhost -p 5439 -U postgres -d emr_db -f scripts/1.00.sql
```

### 2. Run Locally
```bash
dotnet restore
dotnet build
dotnet run
```

### 3. Run with Docker
```bash
docker build -t emr-service .
docker run -p 5008:5008 emr-service
```

## Required Headers

All authenticated requests require:
```
Authorization: Bearer {jwt-token}
X-Tenant-Id: {tenant-guid}
X-Tenant-Code: {tenant-code}
X-User-Id: {user-guid}
```

## Sample Request

### Create Encounter
```bash
curl -X POST http://localhost:5008/api/emr/encounters \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "X-Tenant-Code: HOSP01" \
  -H "X-User-Id: {user-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "guid",
    "doctorId": "guid",
    "encounterType": "OPD",
    "encounterDate": "2024-01-15T10:00:00Z",
    "chiefComplaint": "Fever and cough"
  }'
```

### Add Vital Signs
```bash
curl -X POST http://localhost:5008/api/emr/encounters/{id}/vitals \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "X-User-Id: {user-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 98.6,
    "pulseRate": 72,
    "bloodPressure": "120/80",
    "height": 170,
    "weight": 70,
    "oxygenSaturation": 98,
    "recordedAt": "2024-01-15T10:05:00Z"
  }'
```

## Swagger UI

Access API documentation at: `http://localhost:5008/swagger`

## Logging

Logs are written to:
- Console (structured JSON)
- File: `logs/emr-service-{date}.log` (rolling daily)

## Performance

- Designed for 50,000+ encounters per day
- Optimized indexes for multi-tenant queries
- Redis caching for frequently accessed data
- Async/await throughout for scalability

## Security

- JWT authentication required
- Role-based authorization
- Tenant isolation enforced
- Soft delete for audit trail
- Request tracking with unique IDs

## Dependencies

- .NET 8.0
- Dapper 2.1.28
- Npgsql 8.0.1
- StackExchange.Redis 2.7.10
- RabbitMQ.Client 6.8.1
- Serilog.AspNetCore 8.0.0

## Port

Default: **5008**

## Status

✅ Production Ready - Phase 1 Complete

---

**Service**: EMRService  
**Version**: 1.0.0  
**Last Updated**: 2024
