# Digital Hospital Platform - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ React Web    │  │ Mobile App   │  │ Admin Portal │          │
│  │ Dashboard    │  │  (Future)    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 5000)                     │
│                    Route Aggregation & Auth                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Identity    │    │   Tenant     │    │   Patient    │
│  Service     │    │   Service    │    │   Service    │
│  Port: 5001  │    │  Port: 5002  │    │  Port: 5003  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ identity_db  │    │  tenant_db   │    │  patient_db  │
│ Port: 5432   │    │  Port: 5433  │    │  Port: 5434  │
└──────────────┘    └──────────────┘    └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Appointment  │    │   Billing    │    │  Pharmacy    │
│   Service    │    │   Service    │    │   Service    │
│  Port: 5004  │    │  Port: 5005  │    │  Port: 5006  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│appointment_db│    │  billing_db  │    │ pharmacy_db  │
│ Port: 5435   │    │  Port: 5436  │    │  Port: 5437  │
└──────────────┘    └──────────────┘    └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Laboratory   │    │     IPD      │    │     EMR      │
│   Service    │    │   Service    │    │   Service    │
│  Port: 5007  │    │  Port: 5008  │    │  Port: 5009  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│laboratory_db │    │    ipd_db    │    │    emr_db    │
│ Port: 5438   │    │  Port: 5439  │    │  Port: 5440  │
└──────────────┘    └──────────────┘    └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  RabbitMQ    │  │    Redis     │  │   Serilog    │          │
│  │  Port: 5672  │  │  Port: 6379  │  │   Logging    │          │
│  │  Mgmt: 15672 │  │   Caching    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Service Communication Patterns

### Synchronous Communication (REST API)
```
Client → API Gateway → Service → Database
```

### Asynchronous Communication (Event-Driven)
```
Service A → RabbitMQ → Service B
          (Event Bus)
```

## Clean Architecture Layers (Per Service)

```
┌─────────────────────────────────────────┐
│           Controllers                    │  ← API Endpoints
│  (Presentation Layer)                    │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Application                    │  ← Business Logic
│  (Services, DTOs, Interfaces)            │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│             Domain                       │  ← Domain Models
│  (Entities, Value Objects)               │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Infrastructure                   │  ← Data Access
│  (Repositories, Dapper, PostgreSQL)      │
└─────────────────────────────────────────┘
```

## Multi-Tenancy Architecture

### Tenant Isolation Strategy
- **Database Level**: Each tenant's data isolated by `tenant_id` column
- **Row Level Security**: All queries filtered by tenant_id
- **Header-Based**: X-Tenant-Id header in all requests

```
Request Headers:
├── Authorization: Bearer {jwt_token}
├── X-Tenant-Id: {tenant_guid}
└── X-User-Id: {user_guid}
```

## Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Token (60 min)
   ↓
4. Generate Refresh Token (7 days)
   ↓
5. Return Both Tokens
   ↓
6. Client Stores Tokens
   ↓
7. Include JWT in Authorization Header
   ↓
8. Service Validates JWT
   ↓
9. Extract Claims (UserId, TenantId, Role)
   ↓
10. Process Request
```

### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "nameid": "user-guid",
    "TenantId": "tenant-guid",
    "email": "user@hospital.com",
    "role": "Doctor",
    "exp": 1234567890
  }
}
```

## Event-Driven Architecture

### Event Flow
```
Service A                RabbitMQ              Service B
   │                        │                     │
   │  1. Publish Event      │                     │
   ├───────────────────────>│                     │
   │                        │                     │
   │                        │  2. Queue Event     │
   │                        ├────────────────────>│
   │                        │                     │
   │                        │  3. Consume Event   │
   │                        │<────────────────────┤
   │                        │                     │
   │                        │  4. Process Event   │
   │                        │                     ├──> Action
```

### Event Examples

**PatientCreatedEvent**
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T12:00:00Z",
  "tenantId": "tenant-guid",
  "patientId": "patient-guid",
  "patientName": "John Doe",
  "email": "john@example.com"
}
```

**AppointmentBookedEvent**
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T12:00:00Z",
  "tenantId": "tenant-guid",
  "appointmentId": "appointment-guid",
  "patientId": "patient-guid",
  "doctorId": "doctor-guid",
  "appointmentDate": "2024-01-15T10:00:00Z"
}
```

## Database Schema Standards

### Standard Table Structure
```sql
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    -- Business columns here
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_table_tenant_id ON table_name(tenant_id);
CREATE INDEX idx_table_is_deleted ON table_name(is_deleted);
```

### Naming Conventions
- Tables: snake_case, plural (e.g., `users`, `appointments`)
- Columns: snake_case (e.g., `first_name`, `created_at`)
- Indexes: `idx_{table}_{column}` (e.g., `idx_users_email`)
- Foreign Keys: `fk_{table}_{reference}` (e.g., `fk_users_role`)

## API Response Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "guid",
    "name": "John Doe"
  },
  "errors": []
}
```

### Error Response
```json
{
  "success": false,
  "message": "Operation failed",
  "data": null,
  "errors": [
    "Validation error: Email is required",
    "Validation error: Password must be at least 8 characters"
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "totalCount": 100,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 10
  },
  "errors": []
}
```

## Deployment Architecture

### Docker Compose (Development)
```
Host Machine
├── Docker Network: hospital-network
│   ├── PostgreSQL Containers (7)
│   ├── RabbitMQ Container
│   ├── Redis Container
│   └── Service Containers (7)
└── Volumes
    ├── postgres-*-data
    ├── rabbitmq-data
    └── redis-data
```

### Kubernetes (Production - Future)
```
Kubernetes Cluster
├── Namespace: digital-hospital
│   ├── Deployments
│   │   ├── identity-service (3 replicas)
│   │   ├── patient-service (3 replicas)
│   │   └── ... (other services)
│   ├── Services (LoadBalancer)
│   ├── ConfigMaps
│   ├── Secrets
│   └── Persistent Volume Claims
└── Ingress Controller
```

## Monitoring & Observability

### Logging Strategy
- **Serilog**: Structured logging
- **Console Sink**: Development
- **File Sink**: Production (rolling daily)
- **Request ID**: Unique identifier per request

### Health Checks (Future)
```
GET /health
GET /health/ready
GET /health/live
```

## Scalability Considerations

### Horizontal Scaling
- Stateless services
- Load balancer ready
- Database connection pooling
- Redis for distributed caching

### Performance Optimization
- Dapper for fast data access
- Async/await throughout
- Database indexing
- Redis caching layer
- Event-driven for long-running operations

## Security Best Practices

1. **Authentication**: JWT with short expiry
2. **Authorization**: Role-based access control
3. **Tenant Isolation**: Enforced at query level
4. **Password Security**: SHA256 hashing
5. **API Security**: HTTPS only in production
6. **Secrets Management**: Environment variables
7. **Audit Logging**: All login attempts tracked
8. **Input Validation**: DTOs with validation attributes

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Enterprise Architecture Team
