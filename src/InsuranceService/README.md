# Insurance Service

Production-ready microservice for managing insurance providers, policies, pre-authorizations, claims, and settlements in a digital hospital management system. Designed for enterprise-scale deployment across 500+ hospitals processing 20,000+ claims per day.

## Overview

The Insurance Service handles complete insurance operations including provider management, policy administration, pre-authorization workflows, claim processing, and settlement tracking. Built with Clean Architecture, DDD patterns, and event-driven design for high-volume enterprise deployment.

## Architecture

- **Clean Architecture**: Domain, Application, Infrastructure, Controllers layers
- **DDD Pattern**: Domain-driven design with rich domain models
- **Database**: PostgreSQL with Dapper ORM (NO Entity Framework)
- **Caching**: Redis for policy validation (10 min TTL)
- **Messaging**: RabbitMQ for event-driven communication
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Logging**: Structured logging with Serilog

## Port Allocation

- **Service**: 5011
- **Database**: 5441 (PostgreSQL)

## Database Schema

### Tables

1. **insurance_providers** - Insurance company records
2. **insurance_policies** - Patient insurance policies
3. **pre_authorizations** - Treatment pre-authorization requests
4. **insurance_claims** - Insurance claim submissions
5. **claim_settlements** - Claim settlement records
6. **insurance_sequences** - Atomic sequence generation

All tables include:
- UUID primary keys
- Multi-tenant support (tenant_id)
- Audit fields (created_at, created_by, updated_at, updated_by)
- Soft delete (is_deleted)

## Business Rules

### Claim Number Generation
- Format: `CLM-{TENANTCODE}-{YYYY}-{SEQUENCE}`
- Example: `CLM-APOLLO-2024-000001`
- Atomic sequential generation per tenant per year using PostgreSQL UPSERT

### Policy Validation
- Policy must be active
- Policy must not be expired (EndDate >= CurrentDate)
- UsedAmount cannot exceed CoverageAmount
- AvailableAmount = CoverageAmount - UsedAmount

### Pre-Authorization Rules
- EstimatedAmount cannot exceed AvailableAmount
- Only pending pre-auths can be approved/rejected
- ApprovedAmount validated against policy limits

### Claim Rules
- PreAuth must be approved before claim submission (if PreAuthId provided)
- ClaimAmount cannot exceed AvailableAmount
- ApprovedAmount cannot exceed ClaimAmount
- Cannot settle rejected claims
- Claim must be approved before settlement
- SettledAmount cannot exceed ApprovedAmount

### Settlement Rules
- One settlement per claim (unique constraint)
- Updates policy UsedAmount and AvailableAmount
- Claim status changes to "Settled"

## API Endpoints

### 1. Create Provider
```http
POST /api/insurance/providers
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant

Request Body:
{
  "providerCode": "ICICI",
  "providerName": "ICICI Lombard",
  "contactPerson": "John Doe",
  "contactEmail": "contact@icicilombard.com",
  "contactPhone": "+91-9876543210",
  "address": "Mumbai, India"
}
```

### 2. Get Providers
```http
GET /api/insurance/providers
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant, Receptionist, Doctor, Nurse
```

### 3. Create Policy
```http
POST /api/insurance/policies
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Receptionist, Accountant

Request Body:
{
  "providerId": "uuid",
  "patientId": "uuid",
  "policyNumber": "POL123456",
  "policyType": "Individual",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "coverageAmount": 500000,
  "notes": "string"
}
```

### 4. Get Policies by Patient
```http
GET /api/insurance/policies/by-patient/{patientId}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Receptionist, Accountant, Doctor, Nurse
```

### 5. Create PreAuth
```http
POST /api/insurance/preauth
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse

Request Body:
{
  "policyId": "uuid",
  "patientId": "uuid",
  "encounterId": "uuid",
  "estimatedAmount": 50000,
  "treatmentType": "Surgery",
  "diagnosis": "Appendicitis"
}
```

### 6. Get PreAuth
```http
GET /api/insurance/preauth/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Doctor, Nurse, Accountant
```

### 7. Approve PreAuth
```http
POST /api/insurance/preauth/{id}/approve
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, HospitalAdmin

Request Body:
{
  "approvedAmount": 45000,
  "notes": "Approved for surgery"
}
```

### 8. Reject PreAuth
```http
POST /api/insurance/preauth/{id}/reject
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, HospitalAdmin

Request Body:
{
  "rejectionReason": "Insufficient documentation"
}
```

### 9. Create Claim
```http
POST /api/insurance/claims
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, Receptionist

Request Body:
{
  "policyId": "uuid",
  "patientId": "uuid",
  "preAuthId": "uuid",
  "invoiceId": "uuid",
  "claimAmount": 45000,
  "claimType": "Cashless",
  "documents": "doc1.pdf,doc2.pdf",
  "notes": "string"
}
```

### 10. Get Claim
```http
GET /api/insurance/claims/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, Receptionist, Doctor, Nurse
```

### 11. Get Claims by Invoice
```http
GET /api/insurance/claims/by-invoice/{invoiceId}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, Receptionist
```

### 12. Update Claim Status
```http
POST /api/insurance/claims/{id}/update-status
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant, HospitalAdmin

Request Body:
{
  "status": "Approved",
  "approvedAmount": 42000,
  "rejectionReason": null
}
```

### 13. Settle Claim
```http
POST /api/insurance/claims/{id}/settle
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: Accountant

Request Body:
{
  "settledAmount": 42000,
  "paymentMethod": "BankTransfer",
  "transactionId": "TXN123456",
  "remarks": "Settlement completed"
}
```

### 14. Health Check
```http
GET /api/insurance/health
```

## Service Integration

### Patient Service
- **Validate Patient**: Verify patient exists before policy/claim creation
- **Get Patient Details**: Retrieve patient name for display

## Events Published

### 1. PolicyCreatedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "policyId": "uuid",
  "policyNumber": "string",
  "patientId": "uuid",
  "providerId": "uuid",
  "coverageAmount": 500000
}
```

### 2. PreAuthApprovedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "preAuthId": "uuid",
  "preAuthNumber": "string",
  "policyId": "uuid",
  "patientId": "uuid",
  "approvedAmount": 45000
}
```

### 3. ClaimSubmittedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "claimId": "uuid",
  "claimNumber": "string",
  "policyId": "uuid",
  "patientId": "uuid",
  "claimAmount": 45000,
  "claimType": "Cashless"
}
```

### 4. ClaimApprovedEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "claimId": "uuid",
  "claimNumber": "string",
  "patientId": "uuid",
  "approvedAmount": 42000
}
```

### 5. ClaimSettledEvent
```json
{
  "eventId": "uuid",
  "occurredAt": "timestamp",
  "tenantId": "uuid",
  "claimId": "uuid",
  "claimNumber": "string",
  "settlementId": "uuid",
  "patientId": "uuid",
  "settledAmount": 42000
}
```

## Caching Strategy

- **Policy Validation**: 10 minutes TTL
- **PreAuth Reads**: 10 minutes TTL
- **Cache Invalidation**: On approval, rejection, settlement
- **Cache Key Format**: `preauth:{tenantId}:{preAuthId}`

## Status Flows

### PreAuth Status
```
Pending → Approved
Pending → Rejected
```

### Claim Status
```
Submitted → UnderReview → Approved → Settled
Submitted → UnderReview → Rejected
```

### Policy Status
```
Active → Expired
Active → Cancelled
```

## Policy Types

- Individual
- Family
- Corporate

## Claim Types

- Cashless
- Reimbursement

## Role-Based Access

| Endpoint | HospitalAdmin | Accountant | Receptionist | Doctor | Nurse |
|----------|---------------|------------|--------------|--------|-------|
| Create Provider | ✓ | ✓ | ✗ | ✗ | ✗ |
| Get Providers | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Policy | ✗ | ✓ | ✓ | ✗ | ✗ |
| Get Policies | ✗ | ✓ | ✓ | ✓ | ✓ |
| Create PreAuth | ✗ | ✗ | ✗ | ✓ | ✓ |
| Approve/Reject PreAuth | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create Claim | ✗ | ✓ | ✓ | ✗ | ✗ |
| Update Claim Status | ✓ | ✓ | ✗ | ✗ | ✗ |
| Settle Claim | ✗ | ✓ | ✗ | ✗ | ✗ |

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5441;Database=insurance_db;Username=postgres;Password=postgres"
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
    "PatientService": "http://localhost:5003"
  }
}
```

## Running the Service

### Local Development
```bash
cd src/InsuranceService
dotnet restore
dotnet run
```

### Docker
```bash
docker-compose up insurance-service
```

## Database Migration

Run the schema script:
```bash
psql -h localhost -p 5441 -U postgres -d insurance_db -f scripts/1.00.sql
```

## Testing

Use Swagger UI at: `http://localhost:5011/swagger`

## Performance

- **Throughput**: Designed for 20,000+ claims per day
- **Redis Caching**: Reduces database load for policy validation
- **Indexed Queries**: Fast search and retrieval
- **Async/Await**: Non-blocking I/O throughout
- **Connection Pooling**: Efficient database connections
- **Atomic Operations**: UPSERT for sequence generation

## Security

- JWT authentication required for all endpoints (except health check)
- Role-based authorization enforced
- Multi-tenant isolation via tenant_id
- SQL injection prevention via parameterized queries
- Input validation on all requests
- Audit trail for all transactions

## Monitoring

- Health check endpoint for container orchestration
- Structured logging with Serilog
- Request tracking middleware
- Exception handling middleware
- Log files: `logs/insurance-service-{date}.txt`

## Dependencies

- .NET 8.0
- Dapper 2.1.28
- Npgsql 8.0.1
- StackExchange.Redis 2.7.10
- Serilog 8.0.0
- JWT Bearer Authentication
- Swagger/OpenAPI

## Error Handling

- Global exception handling middleware
- Business rule validation with descriptive messages
- Service integration error handling
- Database error handling
- Structured error responses

## Compliance

- **HIPAA**: Patient data protection
- **Financial Accuracy**: Precise decimal calculations
- **Audit Trail**: Complete transaction history
- **Data Integrity**: Foreign key constraints
- **Insurance Regulations**: Claim processing compliance

## Enterprise Scale

- **Multi-Hospital**: Deployed across 500+ hospitals
- **High Volume**: 20,000+ claims per day capacity
- **Multi-Tenant**: Complete tenant isolation
- **Scalability**: Stateless design for horizontal scaling
- **Reliability**: Event-driven architecture for resilience
