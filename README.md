# Digital Hospital Management Platform

Enterprise-Grade, Multi-Tenant, Microservices-Based Hospital Management System

## 🏗️ Architecture Overview

- **Architecture Pattern**: Microservices, Domain-Driven Design (DDD), Clean Architecture, Event-Driven
- **Backend**: .NET 8 Web API
- **Database**: PostgreSQL (Separate DB per Service)
- **ORM**: Dapper (No Entity Framework)
- **Message Bus**: RabbitMQ
- **Caching**: Redis
- **Authentication**: JWT
- **Logging**: Serilog
- **Containerization**: Docker & Docker Compose
- **Orchestration Ready**: Kubernetes

## 📁 Solution Structure

```
DigitalHospital/
├── src/
│   ├── ApiGateway/                 # API Gateway (Ocelot)
│   ├── IdentityService/            # Authentication & Authorization
│   ├── TenantService/              # Multi-tenancy Management
│   ├── PatientService/             # Patient Management
│   ├── AppointmentService/         # Appointment Scheduling
│   ├── BillingService/             # Billing & Invoicing
│   ├── PharmacyService/            # Pharmacy & Medicine
│   ├── LaboratoryService/          # Lab Tests & Results
│   ├── IPDService/                 # In-Patient Department (Skeleton)
│   ├── EMRService/                 # Electronic Medical Records (Skeleton)
│   ├── InventoryService/           # Inventory Management (Skeleton)
│   ├── HRService/                  # Human Resources (Skeleton)
│   ├── MISService/                 # Management Information System (Skeleton)
│   └── Shared/
│       ├── Common/                 # Shared utilities, models, middleware
│       └── EventBus/               # Event bus implementation
├── docker/
├── docs/
├── scripts/
├── docker-compose.yml
└── DigitalHospital.sln
```

## 🚀 Phase 1 Services (Fully Implemented)

### 1. Identity Service (Port: 5001)
- User Registration & Authentication
- Role Management (SuperAdmin, HospitalAdmin, Doctor, Nurse, Receptionist, Accountant, Pharmacist, LabTechnician)
- JWT Token Generation & Refresh
- Login Audit Logging
- Password Hashing

**Endpoints:**
- `POST /api/identity/v1/auth/login`
- `POST /api/identity/v1/auth/refresh`
- `POST /api/identity/v1/auth/register`
- `POST /api/identity/v1/roles`
- `GET /api/identity/v1/roles`

### 2. Tenant Service (Port: 5002)
- Hospital Registration
- Tenant Management
- Multi-tenant Isolation

### 3. Patient Service (Port: 5003)
- Patient Registration
- Patient Profile Management
- Medical History
- Document Metadata
- Insurance Details

### 4. Appointment Service (Port: 5004)
- Doctor Schedule Management
- Appointment Booking
- Appointment Cancellation
- Rescheduling
- Status Tracking

### 5. Billing Service (Port: 5005)
- Invoice Generation
- Invoice Items Management
- GST Calculation
- Payment Tracking
- Refund Handling
- Revenue Summary

### 6. Pharmacy Service (Port: 5006)
- Medicine Master Data
- Stock Management
- Stock Transactions
- Sales Entry
- Low Stock Alerts

### 7. Laboratory Service (Port: 5007)
- Test Master Data
- Test Categories
- Lab Order Management
- Result Entry
- Report Status Tracking

## 🔧 Prerequisites

- .NET 8 SDK
- Docker Desktop
- PostgreSQL 16 (if running locally)
- Node.js 18+ (for frontend)
- Visual Studio 2022 or VS Code

## 🏃 Quick Start

### 1. Clone the Repository

```bash
cd "Digital Hospital Infrastructure Company/DigitalHospital"
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d postgres-identity postgres-tenant postgres-patient postgres-appointment postgres-billing postgres-pharmacy postgres-laboratory rabbitmq redis
```

### 3. Initialize Databases

Run the SQL scripts for each service:

```bash
# Identity Service
psql -h localhost -p 5432 -U postgres -d identity_db -f src/IdentityService/scripts/1.00.sql

# Repeat for other services when scripts are created
```

### 4. Run Services Locally (Development)

```bash
# Identity Service
cd src/IdentityService
dotnet run

# Open new terminals for other services
cd src/TenantService
dotnet run

# ... and so on
```

### 5. Run All Services with Docker

```bash
docker-compose up --build
```

## 🔐 Authentication Flow

1. **Login**: `POST /api/identity/v1/auth/login`
   ```json
   {
     "email": "admin@hospital.com",
     "password": "password123"
   }
   ```
   Headers: `X-Tenant-Id: {tenant-guid}`

2. **Response**:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "accessToken": "eyJhbGc...",
       "refreshToken": "abc123...",
       "userId": "guid",
       "tenantId": "guid",
       "email": "admin@hospital.com",
       "role": "HospitalAdmin",
       "expiresAt": "2024-01-01T12:00:00Z"
     }
   }
   ```

3. **Use Token**: Add to all subsequent requests
   ```
   Authorization: Bearer {accessToken}
   X-Tenant-Id: {tenant-guid}
   X-User-Id: {user-guid}
   ```

## 📊 Database Schema

Each service has its own PostgreSQL database with the following standard fields:

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
created_at TIMESTAMP NOT NULL
created_by UUID
updated_at TIMESTAMP
updated_by UUID
is_deleted BOOLEAN DEFAULT FALSE
```

### Database Ports:
- Identity: 5432
- Tenant: 5433
- Patient: 5434
- Appointment: 5435
- Billing: 5436
- Pharmacy: 5437
- Laboratory: 5438

## 🎯 API Standards

### Base Route Pattern
```
/api/{service}/v1/{resource}
```

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": []
}
```

### Common Headers
- `X-Tenant-Id`: Tenant identifier (required)
- `X-User-Id`: User identifier (required for authenticated requests)
- `Authorization`: Bearer token
- `X-Request-Id`: Auto-generated request tracking ID

### Pagination
```
GET /api/{service}/v1/{resource}?pageNumber=1&pageSize=10&sortBy=createdAt&sortOrder=desc
```

## 🔄 Event-Driven Architecture

### Events Published:
- `PatientCreatedEvent`
- `AppointmentBookedEvent`
- `InvoiceGeneratedEvent`
- `PaymentCompletedEvent`
- `MedicineDispensedEvent`

### RabbitMQ Management:
- URL: http://localhost:15672
- Username: admin
- Password: admin

## 🧪 Testing

### Swagger UI
Each service exposes Swagger UI:
- Identity: http://localhost:5001/swagger
- Tenant: http://localhost:5002/swagger
- Patient: http://localhost:5003/swagger
- Appointment: http://localhost:5004/swagger
- Billing: http://localhost:5005/swagger
- Pharmacy: http://localhost:5006/swagger
- Laboratory: http://localhost:5007/swagger

## 📝 Logging

Logs are written to:
- Console (Development)
- File: `logs/{service-name}-.log` (Rolling daily)

View logs:
```bash
docker-compose logs -f identity-service
```

## 🔒 Security Features

- JWT-based authentication
- Role-based authorization
- Tenant isolation at database level
- Password hashing (SHA256)
- Request tracking with unique IDs
- Login audit logging
- Global exception handling

## 🏗️ Development Guidelines

### Adding a New Service

1. Create service folder structure
2. Create `.csproj` file
3. Implement Domain models
4. Create Repositories (Dapper)
5. Implement Application services
6. Create Controllers
7. Add database script (`1.00.sql`)
8. Create Dockerfile
9. Update docker-compose.yml
10. Update solution file

### Code Standards

- Use async/await
- Follow SOLID principles
- Implement dependency injection
- Use proper layering (Domain, Application, Infrastructure)
- No hardcoded values
- Comprehensive error handling
- Meaningful variable names

## 🚢 Deployment

### Docker Compose (Local/Dev)
```bash
docker-compose up -d
```

### Kubernetes (Production-Ready)
```bash
# Coming soon - K8s manifests
kubectl apply -f k8s/
```

## 📚 Additional Resources

- [API Documentation](./docs/api-documentation.md)
- [Database Schema](./docs/database-schema.md)
- [Event Catalog](./docs/event-catalog.md)
- [Deployment Guide](./docs/deployment-guide.md)

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write unit tests
3. Update documentation
4. Follow code standards
5. Create pull requests

## 📄 License

Proprietary - All Rights Reserved

## 👥 Team

Enterprise Software Architecture Team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Phase 1 Complete, Phase 2 In Progress
