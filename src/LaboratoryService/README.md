# Laboratory Service

Production-ready microservice for Digital Hospital Laboratory Management System built with .NET 8, Clean Architecture, DDD, Dapper, PostgreSQL, Redis, and RabbitMQ.

## Architecture

- **Clean Architecture** with Domain, Application, Infrastructure layers
- **Domain-Driven Design (DDD)** patterns
- **Repository Pattern** with Dapper ORM
- **Event-Driven Architecture** with RabbitMQ
- **Multi-Tenancy** with tenant isolation
- **Redis Caching** for lab test catalog (30 min TTL)
- **JWT Authentication** with role-based authorization

## Domain Models

### 1. LabTest
Master catalog of laboratory tests with pricing and turnaround time.

**Fields:**
- `Id`, `TenantId`, `TestCode`, `TestName`, `Description`
- `Category`, `Price`, `TurnaroundTimeHours`, `SampleType`
- `IsActive`, Audit fields

### 2. LabTestParameter
Individual parameters/components measured in each test.

**Fields:**
- `Id`, `TenantId`, `LabTestId`, `ParameterName`, `Unit`
- `ReferenceMin`, `ReferenceMax` (normal range)
- `CriticalMin`, `CriticalMax` (critical values)
- `ReferenceRange`, `DisplayOrder`, Audit fields

### 3. LabOrder
Laboratory test orders placed by doctors.

**Fields:**
- `Id`, `TenantId`, `OrderNumber`, `PatientId`, `EncounterId`, `DoctorId`
- `OrderDate`, `Status`, `Priority`
- `SampleCollectedAt`, `SampleCollectedBy`
- `CompletedAt`, `CompletedBy`
- `ClinicalNotes`, `CancellationReason`, Audit fields

**Status Flow:**
```
Pending → SampleCollected → InProgress → Completed
         ↓
      Cancelled
```

**Priority Levels:**
- `Routine` - Standard processing
- `Urgent` - Expedited processing
- `STAT` - Immediate processing

### 4. LabOrderItem
Individual test items within an order.

**Fields:**
- `Id`, `TenantId`, `LabOrderId`, `LabTestId`
- `Status`, `ResultEnteredAt`, `ResultEnteredBy`, Audit fields

### 5. LabResult
Test results for each parameter with abnormal/critical flags.

**Fields:**
- `Id`, `TenantId`, `LabOrderItemId`, `LabTestParameterId`
- `Value`, `IsAbnormal`, `IsCritical`, `Comments`, Audit fields

### 6. LabSequence
Atomic sequence generation for order numbers.

**Fields:**
- `Id`, `TenantId`, `TenantCode`, `Year`, `LastSequence`, `UpdatedAt`

## Business Rules

### Order Number Generation
- **Format:** `LAB-{TENANTCODE}-{YYYY}-{SEQUENCE}`
- **Example:** `LAB-APOLLO-2024-000001`
- **Implementation:** PostgreSQL UPSERT for atomic sequence generation
- **Thread-Safe:** Handles concurrent order creation

### Abnormal Flag Logic
Result is flagged as abnormal if:
- `Value < ReferenceMin` OR `Value > ReferenceMax`

### Critical Flag Logic
Result is flagged as critical if:
- `Value < CriticalMin` OR `Value > CriticalMax`

### Auto-Completion
- Order automatically completes when all items have status = "Completed"
- Publishes `LabOrderCompletedEvent` to RabbitMQ

### Validation Rules
1. Cannot enter results if order status is "Cancelled"
2. Cannot cancel order if status is "Completed" or "Cancelled"
3. Sample collection only allowed for "Pending" orders
4. At least one lab test required when creating order
5. Test code must be unique per tenant

## API Endpoints

### Lab Test Management

#### Create Lab Test
```http
POST /api/lab/tests
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor

Request Body:
{
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "description": "Measures blood cell counts",
  "category": "Hematology",
  "price": 500.00,
  "turnaroundTimeHours": 4,
  "sampleType": "Blood",
  "parameters": [
    {
      "parameterName": "Hemoglobin",
      "unit": "g/dL",
      "referenceMin": 12.0,
      "referenceMax": 16.0,
      "criticalMin": 7.0,
      "criticalMax": 20.0,
      "referenceRange": "12.0 - 16.0 g/dL",
      "displayOrder": 1
    }
  ]
}
```

#### Get All Lab Tests (Cached)
```http
GET /api/lab/tests
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, LabTechnician

Response: List of lab tests with parameters
Cache: Redis, 30 minutes TTL
```

#### Get Lab Test By ID
```http
GET /api/lab/tests/{id}
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, LabTechnician
```

### Lab Order Management

#### Create Lab Order
```http
POST /api/lab/orders
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist

Request Body:
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "doctorId": "uuid",
  "priority": "Routine",
  "clinicalNotes": "Patient complains of fatigue",
  "labTestIds": ["uuid1", "uuid2"]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "LAB-APOLLO-2024-000001",
    "status": "Pending",
    "items": [...]
  }
}
```

#### Get Lab Order By ID
```http
GET /api/lab/orders/{id}
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, LabTechnician
```

#### Get Lab Orders By Patient
```http
GET /api/lab/orders/by-patient/{patientId}
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, LabTechnician

Response: List of all lab orders for patient
```

#### Collect Sample
```http
POST /api/lab/orders/{id}/collect-sample
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Nurse, LabTechnician

Request Body:
{
  "notes": "Sample collected successfully"
}

Effect:
- Order status: Pending → SampleCollected
- All items status: Pending → InProgress
- Records sample collection timestamp and user
```

#### Cancel Lab Order
```http
POST /api/lab/orders/{id}/cancel
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor

Request Body:
{
  "cancellationReason": "Patient refused test"
}

Effect:
- Order status → Cancelled
- Records cancellation reason
```

#### Enter Lab Results
```http
POST /api/lab/orders/{orderId}/items/{itemId}/results
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, LabTechnician

Request Body:
{
  "results": [
    {
      "labTestParameterId": "uuid",
      "value": "14.5",
      "comments": "Within normal range"
    }
  ]
}

Effect:
- Creates lab results with abnormal/critical flags
- Item status → Completed
- Records result entry timestamp and user
- Auto-completes order if all items completed
```

#### Complete Lab Order (Manual)
```http
POST /api/lab/orders/{id}/complete
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, LabTechnician

Effect:
- Order status → Completed
- Publishes LabOrderCompletedEvent
- Validates all items are completed
```

#### Get Lab Report
```http
GET /api/lab/orders/{id}/report
Authorization: Bearer {token}
Roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, LabTechnician

Response:
{
  "success": true,
  "data": {
    "orderNumber": "LAB-APOLLO-2024-000001",
    "orderDate": "2024-01-15T10:30:00Z",
    "priority": "Routine",
    "completedAt": "2024-01-15T14:30:00Z",
    "patientId": "uuid",
    "doctorId": "uuid",
    "tests": [
      {
        "testName": "Complete Blood Count",
        "sampleType": "Blood",
        "parameters": [
          {
            "parameterName": "Hemoglobin",
            "value": "14.5",
            "unit": "g/dL",
            "referenceRange": "12.0 - 16.0 g/dL",
            "isAbnormal": false,
            "isCritical": false
          }
        ]
      }
    ]
  }
}
```

#### Health Check
```http
GET /api/lab/health
No Authorization Required

Response:
{
  "status": "healthy",
  "service": "LaboratoryService",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Event Publishing

### LabOrderCompletedEvent
Published when lab order is completed.

**Event Structure:**
```json
{
  "eventId": "uuid",
  "occurredAt": "2024-01-15T14:30:00Z",
  "tenantId": "uuid",
  "labOrderId": "uuid",
  "orderNumber": "LAB-APOLLO-2024-000001",
  "patientId": "uuid",
  "encounterId": "uuid",
  "completedAt": "2024-01-15T14:30:00Z",
  "totalTests": 3,
  "abnormalResults": 1,
  "criticalResults": 0
}
```

**Exchange:** `LabOrderCompleted`

**Consumers:**
- Analytics Service (for lab statistics)
- Billing Service (for invoice generation)
- Notification Service (for patient/doctor alerts)

## Caching Strategy

### Lab Test Catalog Cache
- **Key Pattern:** `lab:tests:{tenantId}`
- **TTL:** 30 minutes
- **Invalidation:** On lab test creation/update
- **Rationale:** Lab test catalog changes infrequently, high read volume

### Cache Warming
Lab tests are cached on first read per tenant, subsequent reads served from Redis.

## Database Schema

### Tables
1. `lab_tests` - Master test catalog
2. `lab_test_parameters` - Test parameters
3. `lab_orders` - Lab orders
4. `lab_order_items` - Order line items
5. `lab_results` - Test results
6. `lab_sequences` - Atomic sequence generation

### Indexes
- Composite indexes on `(tenant_id, key_column)`
- Partial indexes with `WHERE is_deleted = false`
- Foreign key indexes for joins
- Status indexes for filtering

### Unique Constraints
- `(tenant_id, test_code)` - Unique test codes per tenant
- `(tenant_id, order_number)` - Unique order numbers per tenant
- `(tenant_id, year)` - Unique sequence per tenant per year

## Performance Optimizations

### For 500+ Hospitals, 15,000+ Lab Orders/Day

1. **Connection Pooling**
   - Dapper with connection-per-request pattern
   - PostgreSQL connection pooling

2. **Redis Caching**
   - 30-minute TTL for lab test catalog
   - Reduces database load by ~80% for test lookups

3. **Atomic Sequence Generation**
   - PostgreSQL UPSERT eliminates race conditions
   - Handles concurrent order creation

4. **Partial Indexes**
   - Indexes only active records (`WHERE is_deleted = false`)
   - Reduces index size by ~30%

5. **Composite Indexes**
   - `(tenant_id, patient_id)` for patient order history
   - `(tenant_id, status)` for order filtering
   - `(tenant_id, order_date DESC)` for recent orders

6. **Async/Await**
   - All database operations are async
   - Non-blocking I/O for high concurrency

7. **Event-Driven Architecture**
   - Asynchronous event publishing
   - Decouples services for scalability

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Can run multiple instances behind load balancer
- Redis for shared cache across instances

### Database Partitioning
For very large datasets (millions of orders):
```sql
-- Partition lab_orders by year
CREATE TABLE lab_orders_2024 PARTITION OF lab_orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Partition lab_results by year
CREATE TABLE lab_results_2024 PARTITION OF lab_results
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Read Replicas
- Use PostgreSQL read replicas for report queries
- Master for writes, replicas for reads

## Security

### Authentication
- JWT Bearer token required for all endpoints (except health check)
- Token contains: UserId, TenantId, TenantCode, Roles

### Authorization
- Role-based access control (RBAC)
- 8 roles: SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, Accountant, Pharmacist, LabTechnician

### Multi-Tenancy
- Tenant isolation via `tenant_id` column
- All queries filtered by tenant
- Unique constraints include tenant_id

### Data Protection
- Passwords hashed with BCrypt
- Sensitive data encrypted at rest
- HTTPS for data in transit

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5447;Database=laboratory_db;Username=postgres;Password=postgres"
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
  }
}
```

### Environment Variables (Docker)
```bash
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=laboratory_db;Username=postgres;Password=postgres
Jwt__Secret=YourSuperSecretKey
Redis__ConnectionString=redis:6379
RabbitMQ__Host=rabbitmq
```

## Running the Service

### Local Development
```bash
cd src/LaboratoryService
dotnet restore
dotnet run
```

Service runs on: `http://localhost:5007`

### Docker
```bash
docker build -t laboratory-service:latest -f src/LaboratoryService/Dockerfile .
docker run -p 5007:5007 laboratory-service:latest
```

### Docker Compose
```yaml
laboratory-service:
  build:
    context: .
    dockerfile: src/LaboratoryService/Dockerfile
  ports:
    - "5007:5007"
  environment:
    - ConnectionStrings__DefaultConnection=Host=postgres_laboratory;Port=5432;Database=laboratory_db;Username=postgres;Password=postgres
    - Jwt__Secret=YourSuperSecretKey
    - Redis__ConnectionString=redis:6379
    - RabbitMQ__Host=rabbitmq
  depends_on:
    - postgres_laboratory
    - redis
    - rabbitmq
```

## Database Setup

### Create Database
```bash
psql -U postgres
CREATE DATABASE laboratory_db;
\c laboratory_db
```

### Run Schema Script
```bash
psql -U postgres -d laboratory_db -f src/LaboratoryService/scripts/1.00.sql
```

## Testing

### Sample Test Data
```sql
-- Create lab test
INSERT INTO lab_tests (id, tenant_id, test_code, test_name, category, price, turnaround_time_hours, sample_type, is_active, created_by, is_deleted)
VALUES (gen_random_uuid(), '<tenant_id>', 'CBC', 'Complete Blood Count', 'Hematology', 500.00, 4, 'Blood', true, 'system', false);

-- Create test parameters
INSERT INTO lab_test_parameters (id, tenant_id, lab_test_id, parameter_name, unit, reference_min, reference_max, critical_min, critical_max, display_order, created_by, is_deleted)
VALUES (gen_random_uuid(), '<tenant_id>', '<test_id>', 'Hemoglobin', 'g/dL', 12.0, 16.0, 7.0, 20.0, 1, 'system', false);
```

### API Testing with cURL
```bash
# Create lab order
curl -X POST http://localhost:5007/api/lab/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "uuid",
    "doctorId": "uuid",
    "priority": "Routine",
    "labTestIds": ["uuid"]
  }'
```

## Monitoring

### Logs
- Structured logging with Serilog
- Log files: `logs/laboratory-service-{date}.txt`
- Console output for Docker

### Health Check
```bash
curl http://localhost:5007/api/lab/health
```

### Metrics to Monitor
- Order creation rate (orders/minute)
- Average turnaround time (order to completion)
- Cache hit rate (Redis)
- Critical result count
- Database connection pool usage

## Integration Points

### Upstream Services
- **Identity Service** - JWT token validation
- **Tenant Service** - Tenant code lookup

### Downstream Services
- **Patient Service** - Patient validation
- **Doctor Service** - Doctor validation
- **Encounter Service** - Encounter linking

### Event Consumers
- **Analytics Service** - Lab statistics
- **Billing Service** - Invoice generation
- **Notification Service** - Result alerts

## Common Lab Tests

### Hematology
- CBC (Complete Blood Count)
- ESR (Erythrocyte Sedimentation Rate)
- Platelet Count

### Biochemistry
- Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)
- Liver Function Test (SGOT, SGPT, Bilirubin)
- Kidney Function Test (Creatinine, Urea, BUN)
- Blood Glucose (Fasting, Random, HbA1c)

### Endocrinology
- Thyroid Profile (T3, T4, TSH)
- Vitamin D
- Vitamin B12

### Microbiology
- Urine Culture
- Blood Culture
- Stool Culture

## Troubleshooting

### Issue: Order number generation fails
**Solution:** Check lab_sequences table, ensure UPSERT query is correct

### Issue: Cache not invalidating
**Solution:** Verify Redis connection, check cache key pattern

### Issue: Event not publishing
**Solution:** Check RabbitMQ connection, verify exchange exists

### Issue: Abnormal flag not setting
**Solution:** Ensure value is numeric, check reference ranges

## License
Proprietary - Digital Hospital Platform

## Support
For issues and questions, contact: support@digitalhospital.com

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Service Port:** 5007  
**Database Port:** 5447
