# Encounter Service - Quick Start Guide

## Prerequisites

- .NET 8.0 SDK
- PostgreSQL 16
- Redis
- RabbitMQ
- Docker (optional)

## Setup

### 1. Database Setup

```bash
# Create database
createdb -h localhost -p 5436 -U postgres encounter_db

# Run schema script
psql -h localhost -p 5436 -U postgres -d encounter_db -f scripts/1.00.sql
```

### 2. Configuration

Update `appsettings.json`:
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

### 3. Run Service

```bash
cd src/EncounterService
dotnet restore
dotnet run
```

Service will start at: `http://localhost:5009`

### 4. Access Swagger

Open browser: `http://localhost:5009/swagger`

## Docker Setup

```bash
# Build and run with docker-compose
docker-compose up encounter-service

# Or build individually
docker build -t encounter-service -f src/EncounterService/Dockerfile .
docker run -p 5009:80 encounter-service
```

## API Testing

### 1. Get JWT Token

First, authenticate with Identity Service:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor@hospital.com",
    "password": "Password123!"
  }'
```

### 2. Create Encounter

```bash
curl -X POST http://localhost:5009/api/encounters \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "chiefComplaint": "Fever and cough",
    "presentIllness": "Patient has fever for 3 days"
  }'
```

### 3. Add Vitals

```bash
curl -X POST http://localhost:5009/api/encounters/{id}/vitals \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 38.5,
    "bloodPressure": "120/80",
    "heartRate": 85,
    "respiratoryRate": 18,
    "weight": 70.5,
    "height": 1.75,
    "oxygenSaturation": 97
  }'
```

### 4. Add Diagnosis

```bash
curl -X POST http://localhost:5009/api/encounters/{id}/diagnosis \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosisCode": "J00",
    "diagnosisName": "Acute nasopharyngitis",
    "diagnosisType": "Primary",
    "notes": "Common cold"
  }'
```

### 5. Add Prescription

```bash
curl -X POST http://localhost:5009/api/encounters/{id}/prescriptions \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "medicineName": "Paracetamol",
    "dosage": "500mg",
    "frequency": "3 times daily",
    "route": "Oral",
    "durationDays": 5,
    "instructions": "Take after meals"
  }'
```

### 6. Complete Encounter

```bash
curl -X POST http://localhost:5009/api/encounters/{id}/complete \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Patient treated and discharged"
  }'
```

### 7. Search Encounters

```bash
curl -X GET "http://localhost:5009/api/encounters/search?patientId={uuid}&page=1&pageSize=10" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-Id: {tenant-id}"
```

## Common Issues

### Issue: Database connection failed
**Solution**: Ensure PostgreSQL is running on port 5436 and database exists

### Issue: JWT authentication failed
**Solution**: Verify JWT secret matches Identity Service configuration

### Issue: Service integration failed
**Solution**: Ensure Appointment, Doctor, and Patient services are running

### Issue: Redis connection failed
**Solution**: Start Redis server: `redis-server`

### Issue: RabbitMQ connection failed
**Solution**: Start RabbitMQ: `rabbitmq-server`

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/encounter-feature
   ```

2. **Make Changes**
   - Update domain models
   - Add business logic
   - Create/update endpoints

3. **Test Locally**
   ```bash
   dotnet test
   dotnet run
   ```

4. **Build Docker Image**
   ```bash
   docker build -t encounter-service .
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add encounter feature"
   git push origin feature/encounter-feature
   ```

## Debugging

### Enable Detailed Logging

Update `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

### View Logs

```bash
# Console logs
dotnet run

# Docker logs
docker logs encounter-service -f
```

### Database Queries

```bash
# Connect to database
psql -h localhost -p 5436 -U postgres -d encounter_db

# View encounters
SELECT * FROM encounters WHERE is_deleted = false;

# View vitals
SELECT * FROM encounter_vitals WHERE is_deleted = false;
```

## Performance Testing

### Load Test with Apache Bench

```bash
ab -n 1000 -c 10 -H "Authorization: Bearer {token}" \
   -H "X-Tenant-Id: {tenant-id}" \
   http://localhost:5009/api/encounters/search
```

### Monitor Redis Cache

```bash
redis-cli
> KEYS encounter:*
> GET encounter:{tenant-id}:{encounter-id}
```

### Monitor RabbitMQ

Open browser: `http://localhost:15672`
- Username: admin
- Password: admin

## Health Monitoring

```bash
# Check service health
curl http://localhost:5009/api/encounters/health

# Expected response
{
  "status": "healthy",
  "service": "EncounterService",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Production Checklist

- [ ] Update JWT secret
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure RabbitMQ cluster
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backups
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline

## Support

For issues or questions:
1. Check README.md
2. Review IMPLEMENTATION_SUMMARY.md
3. Check Swagger documentation
4. Review application logs

## Next Steps

1. Implement unit tests
2. Add integration tests
3. Set up CI/CD pipeline
4. Configure monitoring and alerting
5. Implement additional features
