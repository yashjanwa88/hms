# Doctor Service - Production Ready Implementation

## ✅ Status: 100% COMPLETE

### Overview
Complete microservice for managing doctors, their specializations, qualifications, availability schedules, and leave management in a multi-tenant hospital management system.

---

## 🎯 Features Implemented

### Core Functionality
- ✅ Doctor CRUD operations
- ✅ Doctor Code auto-generation (DOC-{TENANTCODE}-{SEQUENCE})
- ✅ Search with pagination and filtering
- ✅ Mobile number uniqueness validation per tenant

### Sub-Resources
- ✅ Add Specializations
- ✅ Add Qualifications
- ✅ Add Availability Schedule
- ✅ Add Leave Records
- ✅ Get Doctor Availability

### Business Rules
- ✅ No overlapping availability slots
- ✅ No overlapping leave dates
- ✅ Atomic doctor code generation
- ✅ Unique mobile number per tenant

### Technical Features
- ✅ Redis caching (10 min for get, 5 min for search)
- ✅ RabbitMQ event publishing
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Multi-tenant support
- ✅ Health check endpoint
- ✅ Swagger documentation
- ✅ Docker support

---

## 🗄️ Database Schema

### Tables (5 tables)
1. **doctors** - Master doctor data
2. **doctor_specializations** - Specializations and certifications
3. **doctor_qualifications** - Educational qualifications
4. **doctor_availability** - Weekly availability schedule
5. **doctor_leave** - Leave records

### Key Constraints
- Unique: (tenant_id, doctor_code)
- Unique: (tenant_id, mobile_number)
- Check: end_time > start_time (availability)
- Check: end_date >= start_date (leave)

---

## 🚀 Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d postgres-doctor rabbitmq redis
```

### 2. Initialize Database
```bash
psql -h localhost -p 5439 -U postgres -d doctor_db -f src/DoctorService/scripts/1.00.sql
```

### 3. Run Service
```bash
cd src/DoctorService
dotnet run
```

### 4. Access
- Swagger: http://localhost:5008/swagger
- Health: http://localhost:5008/api/doctor/v1/health

---

## 📡 API Endpoints

### Doctor Management

#### Create Doctor
```http
POST /api/doctor/v1/doctors
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-Tenant-Code: HOSP01
X-User-Id: {user-guid}

{
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "1980-05-15",
  "gender": "Male",
  "mobileNumber": "+1234567890",
  "email": "dr.smith@hospital.com",
  "licenseNumber": "MED123456",
  "licenseExpiryDate": "2025-12-31",
  "experienceYears": 15,
  "department": "Cardiology",
  "consultationFee": 500.00,
  "emergencyContactName": "Jane Smith",
  "emergencyContactNumber": "+1234567891"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "id": "guid",
    "doctorCode": "DOC-HOSP01-000001",
    "firstName": "John",
    "lastName": "Smith",
    "fullName": "John Smith",
    "age": 44,
    "department": "Cardiology",
    "consultationFee": 500.00,
    "isActive": true
  }
}
```

#### Get Doctor
```http
GET /api/doctor/v1/doctors/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
```

#### Update Doctor
```http
PUT /api/doctor/v1/doctors/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}
```

#### Delete Doctor
```http
DELETE /api/doctor/v1/doctors/{id}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}
```

#### Search Doctors
```http
GET /api/doctor/v1/doctors/search?department=Cardiology&isActive=true&pageNumber=1&pageSize=10
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
```

**Query Parameters:**
- `searchTerm` - Search in name or doctor code
- `doctorCode` - Filter by exact code
- `department` - Filter by department
- `specialization` - Filter by specialization
- `isActive` - Filter by active status
- `pageNumber`, `pageSize`, `sortBy`, `sortOrder`

### Specializations

#### Add Specialization
```http
POST /api/doctor/v1/doctors/{id}/specializations
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}

{
  "specializationName": "Interventional Cardiology",
  "certificationBody": "American Board of Internal Medicine",
  "certificationDate": "2015-06-01",
  "isPrimary": true
}
```

### Qualifications

#### Add Qualification
```http
POST /api/doctor/v1/doctors/{id}/qualifications
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}

{
  "degreeName": "MD - Doctor of Medicine",
  "institution": "Harvard Medical School",
  "university": "Harvard University",
  "yearOfCompletion": 2005,
  "country": "USA"
}
```

### Availability

#### Add Availability
```http
POST /api/doctor/v1/doctors/{id}/availability
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}

{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "slotDurationMinutes": 15
}
```

**Validation:** Prevents overlapping time slots for the same day.

#### Get Availability
```http
GET /api/doctor/v1/doctors/{id}/availability
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
```

### Leave Management

#### Add Leave
```http
POST /api/doctor/v1/doctors/{id}/leave
Authorization: Bearer {token}
X-Tenant-Id: {tenant-guid}
X-User-Id: {user-guid}

{
  "startDate": "2024-12-20",
  "endDate": "2024-12-25",
  "leaveType": "Vacation",
  "reason": "Family vacation"
}
```

**Validation:** Prevents overlapping leave dates.

---

## 🔐 Role-Based Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| Create Doctor | HospitalAdmin, SuperAdmin |
| Get Doctor | Doctor, Nurse, Receptionist, HospitalAdmin, SuperAdmin |
| Update Doctor | HospitalAdmin, SuperAdmin |
| Delete Doctor | HospitalAdmin, SuperAdmin |
| Search Doctors | Doctor, Nurse, Receptionist, HospitalAdmin, SuperAdmin |
| Add Specialization | HospitalAdmin, SuperAdmin |
| Add Qualification | HospitalAdmin, SuperAdmin |
| Add Availability | Doctor, HospitalAdmin, SuperAdmin |
| Get Availability | Doctor, Nurse, Receptionist, HospitalAdmin, SuperAdmin |
| Add Leave | Doctor, HospitalAdmin, SuperAdmin |

---

## 🎯 Doctor Code Generation

**Format:** `DOC-{TENANTCODE}-{SEQUENCE}`

**Example:** `DOC-HOSP01-000001`

- **DOC**: Fixed prefix
- **TENANTCODE**: Hospital/tenant code
- **SEQUENCE**: 6-digit sequential number per tenant

**Features:**
- Atomic generation (thread-safe)
- Sequential per tenant
- Unique constraint at database level

---

## 💾 Redis Caching

### Cached Operations
1. **Get Doctor by ID** - 10 minutes TTL
2. **Search Doctors** - 5 minutes TTL

### Cache Keys
- Doctor: `doctor:{tenantId}:{doctorId}`
- Search: `doctors:search:{tenantId}:{searchParams}`

### Cache Invalidation
- Automatic on doctor update
- Automatic on doctor delete

---

## 📨 Events Published

### DoctorCreatedEvent
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T10:00:00Z",
  "tenantId": "tenant-guid",
  "doctorId": "doctor-guid",
  "doctorCode": "DOC-HOSP01-000001",
  "doctorName": "Dr. John Smith",
  "department": "Cardiology",
  "mobileNumber": "+1234567890",
  "email": "dr.smith@hospital.com"
}
```

### DoctorUpdatedEvent
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T10:00:00Z",
  "tenantId": "tenant-guid",
  "doctorId": "doctor-guid",
  "doctorCode": "DOC-HOSP01-000001"
}
```

### DoctorDeletedEvent
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T10:00:00Z",
  "tenantId": "tenant-guid",
  "doctorId": "doctor-guid",
  "doctorCode": "DOC-HOSP01-000001"
}
```

### DoctorAvailabilityUpdatedEvent
```json
{
  "eventId": "guid",
  "occurredAt": "2024-01-01T10:00:00Z",
  "tenantId": "tenant-guid",
  "doctorId": "doctor-guid",
  "doctorCode": "DOC-HOSP01-000001",
  "dayOfWeek": "Monday"
}
```

---

## 🧪 Business Rule Validations

### 1. Mobile Number Uniqueness
- Validates mobile number is unique per tenant
- Excludes current doctor when updating

### 2. Overlapping Availability
- Prevents overlapping time slots for same day
- Checks: start/end time conflicts

### 3. Overlapping Leave
- Prevents overlapping leave dates
- Excludes rejected leave applications
- Checks: date range conflicts

---

## 📊 Database Indexes

### Performance Indexes
```sql
idx_doctors_tenant_id
idx_doctors_doctor_code
idx_doctors_department
idx_doctors_is_active
idx_doctors_is_deleted
idx_doctors_created_at

idx_doctor_availability_doctor_id
idx_doctor_availability_day
idx_doctor_availability_is_available

idx_doctor_leave_doctor_id
idx_doctor_leave_dates
idx_doctor_leave_status
```

---

## 🐳 Docker

### Build
```bash
docker build -t doctor-service:latest -f src/DoctorService/Dockerfile src/DoctorService
```

### Run
```bash
docker-compose up -d doctor-service
```

### Logs
```bash
docker-compose logs -f doctor-service
```

---

## 📁 Files Created

```
DoctorService/
├── Domain/
│   └── Models.cs                     ✅ 5 domain models
├── DTOs/
│   └── DoctorDTOs.cs                 ✅ 10+ DTOs
├── Repositories/
│   └── DoctorRepositories.cs         ✅ 5 repositories
├── Events/
│   └── DoctorEvents.cs               ✅ 4 events
├── Application/
│   └── DoctorAppService.cs           ✅ Complete logic
├── Controllers/
│   └── DoctorController.cs           ✅ 11 endpoints
├── scripts/
│   └── 1.00.sql                      ✅ Complete schema
├── DoctorService.csproj              ✅ Project file
├── Program.cs                        ✅ DI setup
├── appsettings.json                  ✅ Configuration
└── Dockerfile                        ✅ Container
```

---

## ✅ Checklist

- [x] Domain models (5 models)
- [x] DTOs (10+ request/response)
- [x] Repositories with Dapper (5 repos)
- [x] Business validations
- [x] Service layer with caching
- [x] Controllers with auth
- [x] Doctor code generation
- [x] Overlap validations
- [x] Redis caching
- [x] Event publishing
- [x] Database script (1.00.sql)
- [x] Proper indexing
- [x] Multi-tenant support
- [x] JWT authentication
- [x] Health check
- [x] Swagger docs
- [x] Dockerfile
- [x] docker-compose update

---

## 🎉 Production Ready

**Lines of Code:** ~1,600+

**The Doctor Service is complete and ready for production deployment!**

**Next:** Integrate with Appointment Service for scheduling.
