# Analytics Service

Production-ready microservice for real-time analytics and dashboards in a digital hospital management system. Designed for enterprise-scale deployment across 500+ hospitals processing 50,000+ transactions per day.

## Overview

The Analytics Service consumes events from other microservices and maintains pre-aggregated projection tables for fast analytics queries. It powers real-time dashboards for hospital executives with revenue analytics, doctor performance metrics, insurance summaries, and patient statistics.

## Architecture

- **Clean Architecture**: Domain, Application, Infrastructure, Controllers layers
- **Event-Driven**: RabbitMQ event consumers for real-time data processing
- **Database**: PostgreSQL with table partitioning by year
- **Caching**: Redis for dashboard APIs (10 min TTL)
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Logging**: Structured logging with Serilog

## Port Allocation

- **Service**: 5012
- **Database**: 5442 (PostgreSQL)

## Database Schema

### Projection Tables (All Partitioned by Year)

1. **analytics_revenue_summary** - Daily/Monthly/Yearly revenue aggregates
2. **analytics_doctor_performance** - Doctor performance metrics
3. **analytics_insurance_summary** - Insurance claim statistics
4. **analytics_patient_summary** - Patient activity metrics
5. **analytics_event_offsets** - Event deduplication tracking

All tables include:
- UUID primary keys
- Multi-tenant support (tenant_id)
- Audit fields (created_at, created_by, updated_at, updated_by)
- Soft delete (is_deleted)
- **Partitioning by year** for scalability
- **Composite indexes** on (tenant_id, date)

## Event Consumption

### Subscribed Events

1. **EncounterCompletedEvent**
   - Updates doctor performance metrics
   - Updates patient encounter counts

2. **InvoiceGeneratedEvent**
   - Updates revenue summary (invoice count)

3. **PaymentCompletedEvent**
   - Updates revenue summary (paid amount)
   - Calculates total revenue (PaidAmount - RefundAmount)

4. **ClaimSubmittedEvent**
   - Updates insurance summary (total claims)

5. **ClaimSettledEvent**
   - Updates insurance summary (settled claims)
   - Updates approval rates

### Event Processing

- **Idempotency**: Uses analytics_event_offsets table to prevent duplicate processing
- **Atomic Operations**: UPSERT queries for concurrent event handling
- **Error Handling**: Failed events are requeued with exponential backoff

## Business Logic

### Revenue Calculation
```
TotalRevenue = PaidAmount - RefundAmount
```

### Approval Rate Calculation
```
ApprovalRate = (ApprovedClaims / TotalClaims) * 100
```

### Average Revenue Per Encounter
```
AvgRevenuePerEncounter = TotalRevenue / EncounterCount
```

### Growth Rate Calculation
```
GrowthRate = ((SecondHalfRevenue - FirstHalfRevenue) / FirstHalfRevenue) * 100
```

## API Endpoints

### 1. Get Daily Revenue
```http
GET /api/analytics/revenue/daily?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant
```

### 2. Get Monthly Revenue
```http
GET /api/analytics/revenue/monthly?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant
```

### 3. Get Yearly Revenue
```http
GET /api/analytics/revenue/yearly?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant
```

### 4. Get Doctor Performance
```http
GET /api/analytics/doctors/performance?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Doctor
```

### 5. Get Insurance Summary
```http
GET /api/analytics/insurance/summary?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant
```

### 6. Get Insurance Approval Rate
```http
GET /api/analytics/insurance/approval-rate
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant
```

### 7. Get Patient Summary
```http
GET /api/analytics/patients/summary?fromDate={date}&toDate={date}
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Doctor
```

### 8. Get Dashboard
```http
GET /api/analytics/dashboard
Authorization: Bearer {token}
X-Tenant-Id: {tenant-id}
Roles: HospitalAdmin, Accountant, Doctor

Response:
{
  "revenue": {
    "todayRevenue": 150000,
    "monthRevenue": 4500000,
    "yearRevenue": 50000000,
    "growthRate": 15.5
  },
  "encounters": {
    "todayCount": 120,
    "monthCount": 3500,
    "yearCount": 42000
  },
  "insurance": {
    "totalClaims": 850,
    "approvedClaims": 720,
    "approvalRate": 84.7,
    "totalClaimAmount": 12500000
  },
  "patients": {
    "todayNew": 45,
    "monthNew": 1200,
    "yearNew": 15000,
    "totalActive": 25000
  }
}
```

### 9. Health Check
```http
GET /api/analytics/health
```

## Caching Strategy

- **Dashboard API**: 10 minutes TTL
- **Cache Key Format**: `dashboard:{tenantId}`
- **Cache Invalidation**: Automatic expiry after 10 minutes
- **Benefits**: Reduces database load for frequently accessed dashboards

## Performance Optimizations

### Table Partitioning
- All projection tables partitioned by year
- Automatic partition pruning for date-range queries
- Improved query performance for large datasets

### Composite Indexes
```sql
CREATE INDEX idx_revenue_tenant_date ON analytics_revenue_summary(tenant_id, date);
CREATE INDEX idx_doctor_tenant_date ON analytics_doctor_performance(tenant_id, date);
CREATE INDEX idx_insurance_tenant_date ON analytics_insurance_summary(tenant_id, date);
CREATE INDEX idx_patient_tenant_date ON analytics_patient_summary(tenant_id, date);
```

### Pre-Aggregated Data
- No heavy joins at query time
- Data pre-computed during event processing
- Sub-second response times for dashboard queries

### UPSERT Operations
```sql
INSERT INTO table (...) VALUES (...)
ON CONFLICT (tenant_id, date) 
DO UPDATE SET ...
```

## Role-Based Access

| Endpoint | HospitalAdmin | Accountant | Doctor |
|----------|---------------|------------|--------|
| Daily Revenue | ✓ | ✓ | ✗ |
| Monthly Revenue | ✓ | ✓ | ✗ |
| Yearly Revenue | ✓ | ✓ | ✗ |
| Doctor Performance | ✓ | ✗ | ✓ |
| Insurance Summary | ✓ | ✓ | ✗ |
| Insurance Approval Rate | ✓ | ✓ | ✗ |
| Patient Summary | ✓ | ✗ | ✓ |
| Dashboard | ✓ | ✓ | ✓ |

## Configuration

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5442;Database=analytics_db;Username=postgres;Password=postgres"
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

## Running the Service

### Local Development
```bash
cd src/AnalyticsService
dotnet restore
dotnet run
```

### Docker
```bash
docker-compose up analytics-service
```

## Database Migration

Run the schema script:
```bash
psql -h localhost -p 5442 -U postgres -d analytics_db -f scripts/1.00.sql
```

## Testing

Use Swagger UI at: `http://localhost:5012/swagger`

## Performance Characteristics

- **Throughput**: 50,000+ transactions per day
- **Query Response**: Sub-second for dashboard queries
- **Event Processing**: Real-time with <1 second latency
- **Scalability**: Horizontal scaling via stateless design
- **Data Retention**: Partitioned tables for efficient archival

## Monitoring

- Health check endpoint for container orchestration
- Structured logging with Serilog
- Request tracking middleware
- Exception handling middleware
- Event processing metrics
- Log files: `logs/analytics-service-{date}.txt`

## Dependencies

- .NET 8.0
- Dapper 2.1.28
- Npgsql 8.0.1
- StackExchange.Redis 2.7.10
- RabbitMQ.Client 6.8.1
- Serilog 8.0.0
- JWT Bearer Authentication
- Swagger/OpenAPI

## Error Handling

- Global exception handling middleware
- Event processing error handling with requeue
- Database error handling
- Service integration error handling
- Structured error responses

## Enterprise Scale

- **Multi-Hospital**: Deployed across 500+ hospitals
- **High Volume**: 50,000+ transactions per day capacity
- **Multi-Tenant**: Complete tenant isolation
- **Scalability**: Partitioned tables + stateless design
- **Reliability**: Event-driven architecture with idempotency
- **Performance**: Pre-aggregated data + Redis caching

## Data Flow

```
Other Services → RabbitMQ Events → Analytics Consumer → Projection Tables → API → Dashboard
```

## Partition Management

### Adding New Year Partitions
```sql
CREATE TABLE analytics_revenue_summary_2027 PARTITION OF analytics_revenue_summary
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

### Archiving Old Partitions
```sql
-- Detach partition
ALTER TABLE analytics_revenue_summary DETACH PARTITION analytics_revenue_summary_2020;

-- Archive to separate tablespace or drop
DROP TABLE analytics_revenue_summary_2020;
```

## Security

- JWT authentication required for all endpoints (except health check)
- Role-based authorization enforced
- Multi-tenant isolation via tenant_id
- SQL injection prevention via parameterized queries
- Event deduplication via offset tracking
- Audit trail for all data modifications

## Compliance

- **HIPAA**: Patient data protection
- **Data Retention**: Configurable via partition management
- **Audit Trail**: Complete event processing history
- **Data Integrity**: Idempotent event processing

## Future Enhancements

1. **Real-time Streaming**: WebSocket support for live dashboards
2. **Advanced Analytics**: Machine learning predictions
3. **Custom Reports**: User-defined report builder
4. **Data Export**: CSV/Excel export functionality
5. **Alerting**: Threshold-based alerts for executives
6. **Comparative Analytics**: Hospital-to-hospital comparisons
7. **Trend Analysis**: Time-series forecasting
8. **Mobile Dashboards**: Native mobile app support
