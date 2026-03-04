# Laboratory Service - Workflow Examples

## Complete Lab Order Workflow

### Step 1: Create Lab Test (One-time Setup)

**Request:**
```http
POST http://localhost:5007/api/lab/tests
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "description": "Measures different components of blood",
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
    },
    {
      "parameterName": "WBC Count",
      "unit": "cells/μL",
      "referenceMin": 4000,
      "referenceMax": 11000,
      "criticalMin": 2000,
      "criticalMax": 30000,
      "referenceRange": "4000 - 11000 cells/μL",
      "displayOrder": 2
    },
    {
      "parameterName": "Platelet Count",
      "unit": "cells/μL",
      "referenceMin": 150000,
      "referenceMax": 450000,
      "criticalMin": 50000,
      "criticalMax": 1000000,
      "referenceRange": "150000 - 450000 cells/μL",
      "displayOrder": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "testCode": "CBC",
    "testName": "Complete Blood Count",
    "description": "Measures different components of blood",
    "category": "Hematology",
    "price": 500.00,
    "turnaroundTimeHours": 4,
    "sampleType": "Blood",
    "isActive": true,
    "parameters": [
      {
        "id": "param-1",
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
}
```

### Step 2: Doctor Creates Lab Order

**Request:**
```http
POST http://localhost:5007/api/lab/orders
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "patientId": "patient-uuid-123",
  "encounterId": "encounter-uuid-456",
  "doctorId": "doctor-uuid-789",
  "priority": "Routine",
  "clinicalNotes": "Patient complains of fatigue and weakness. Suspected anemia.",
  "labTestIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "order-uuid-001",
    "orderNumber": "LAB-APOLLO-2024-000001",
    "patientId": "patient-uuid-123",
    "encounterId": "encounter-uuid-456",
    "doctorId": "doctor-uuid-789",
    "orderDate": "2024-01-15T10:30:00Z",
    "status": "Pending",
    "priority": "Routine",
    "clinicalNotes": "Patient complains of fatigue and weakness. Suspected anemia.",
    "items": [
      {
        "id": "item-uuid-001",
        "labTestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "testName": "Complete Blood Count",
        "status": "Pending",
        "results": []
      }
    ]
  }
}
```

### Step 3: Nurse Collects Sample

**Request:**
```http
POST http://localhost:5007/api/lab/orders/order-uuid-001/collect-sample
Authorization: Bearer {nurse_token}
Content-Type: application/json

{
  "notes": "Blood sample collected from left arm. Patient tolerated procedure well."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "order-uuid-001",
    "orderNumber": "LAB-APOLLO-2024-000001",
    "status": "SampleCollected",
    "sampleCollectedAt": "2024-01-15T11:00:00Z",
    "sampleCollectedBy": "nurse-user-id",
    "items": [
      {
        "id": "item-uuid-001",
        "status": "InProgress",
        "testName": "Complete Blood Count"
      }
    ]
  }
}
```

### Step 4: Lab Technician Enters Results

**Request:**
```http
POST http://localhost:5007/api/lab/orders/order-uuid-001/items/item-uuid-001/results
Authorization: Bearer {lab_tech_token}
Content-Type: application/json

{
  "results": [
    {
      "labTestParameterId": "param-1",
      "value": "10.5",
      "comments": "Below normal range - possible anemia"
    },
    {
      "labTestParameterId": "param-2",
      "value": "7500",
      "comments": "Within normal range"
    },
    {
      "labTestParameterId": "param-3",
      "value": "280000",
      "comments": "Within normal range"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "order-uuid-001",
    "orderNumber": "LAB-APOLLO-2024-000001",
    "status": "Completed",
    "completedAt": "2024-01-15T14:30:00Z",
    "completedBy": "lab-tech-user-id",
    "items": [
      {
        "id": "item-uuid-001",
        "status": "Completed",
        "testName": "Complete Blood Count",
        "resultEnteredAt": "2024-01-15T14:30:00Z",
        "resultEnteredBy": "lab-tech-user-id",
        "results": [
          {
            "id": "result-1",
            "parameterName": "Hemoglobin",
            "value": "10.5",
            "unit": "g/dL",
            "referenceRange": "12.0 - 16.0 g/dL",
            "isAbnormal": true,
            "isCritical": false,
            "comments": "Below normal range - possible anemia"
          },
          {
            "id": "result-2",
            "parameterName": "WBC Count",
            "value": "7500",
            "unit": "cells/μL",
            "referenceRange": "4000 - 11000 cells/μL",
            "isAbnormal": false,
            "isCritical": false,
            "comments": "Within normal range"
          },
          {
            "id": "result-3",
            "parameterName": "Platelet Count",
            "value": "280000",
            "unit": "cells/μL",
            "referenceRange": "150000 - 450000 cells/μL",
            "isAbnormal": false,
            "isCritical": false,
            "comments": "Within normal range"
          }
        ]
      }
    ]
  }
}
```

**Event Published:**
```json
{
  "eventId": "event-uuid-123",
  "occurredAt": "2024-01-15T14:30:00Z",
  "tenantId": "tenant-uuid",
  "labOrderId": "order-uuid-001",
  "orderNumber": "LAB-APOLLO-2024-000001",
  "patientId": "patient-uuid-123",
  "encounterId": "encounter-uuid-456",
  "completedAt": "2024-01-15T14:30:00Z",
  "totalTests": 1,
  "abnormalResults": 1,
  "criticalResults": 0
}
```

### Step 5: Doctor Views Lab Report

**Request:**
```http
GET http://localhost:5007/api/lab/orders/order-uuid-001/report
Authorization: Bearer {doctor_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "orderNumber": "LAB-APOLLO-2024-000001",
    "orderDate": "2024-01-15T10:30:00Z",
    "priority": "Routine",
    "completedAt": "2024-01-15T14:30:00Z",
    "patientId": "patient-uuid-123",
    "doctorId": "doctor-uuid-789",
    "clinicalNotes": "Patient complains of fatigue and weakness. Suspected anemia.",
    "tests": [
      {
        "testName": "Complete Blood Count",
        "sampleType": "Blood",
        "parameters": [
          {
            "parameterName": "Hemoglobin",
            "value": "10.5",
            "unit": "g/dL",
            "referenceRange": "12.0 - 16.0 g/dL",
            "isAbnormal": true,
            "isCritical": false,
            "comments": "Below normal range - possible anemia"
          },
          {
            "parameterName": "WBC Count",
            "value": "7500",
            "unit": "cells/μL",
            "referenceRange": "4000 - 11000 cells/μL",
            "isAbnormal": false,
            "isCritical": false,
            "comments": "Within normal range"
          },
          {
            "parameterName": "Platelet Count",
            "value": "280000",
            "unit": "cells/μL",
            "referenceRange": "150000 - 450000 cells/μL",
            "isAbnormal": false,
            "isCritical": false,
            "comments": "Within normal range"
          }
        ]
      }
    ]
  }
}
```

## Critical Result Workflow

### Scenario: Critical Hemoglobin Value

**Enter Results:**
```http
POST http://localhost:5007/api/lab/orders/order-uuid-002/items/item-uuid-002/results
Authorization: Bearer {lab_tech_token}
Content-Type: application/json

{
  "results": [
    {
      "labTestParameterId": "param-1",
      "value": "6.5",
      "comments": "CRITICAL: Severe anemia - immediate attention required"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "results": [
          {
            "parameterName": "Hemoglobin",
            "value": "6.5",
            "unit": "g/dL",
            "referenceRange": "12.0 - 16.0 g/dL",
            "isAbnormal": true,
            "isCritical": true,
            "comments": "CRITICAL: Severe anemia - immediate attention required"
          }
        ]
      }
    ]
  }
}
```

**Event Published:**
```json
{
  "eventId": "event-uuid-456",
  "occurredAt": "2024-01-15T15:00:00Z",
  "tenantId": "tenant-uuid",
  "labOrderId": "order-uuid-002",
  "orderNumber": "LAB-APOLLO-2024-000002",
  "patientId": "patient-uuid-456",
  "completedAt": "2024-01-15T15:00:00Z",
  "totalTests": 1,
  "abnormalResults": 1,
  "criticalResults": 1
}
```

## STAT Order Workflow

### Scenario: Emergency Lab Order

**Create STAT Order:**
```http
POST http://localhost:5007/api/lab/orders
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "patientId": "patient-uuid-789",
  "encounterId": "encounter-uuid-789",
  "doctorId": "doctor-uuid-789",
  "priority": "STAT",
  "clinicalNotes": "Emergency: Patient with chest pain. Rule out MI.",
  "labTestIds": [
    "troponin-test-uuid",
    "cbc-test-uuid"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "LAB-APOLLO-2024-000003",
    "priority": "STAT",
    "status": "Pending",
    "clinicalNotes": "Emergency: Patient with chest pain. Rule out MI.",
    "items": [
      {
        "testName": "Troponin I",
        "status": "Pending"
      },
      {
        "testName": "Complete Blood Count",
        "status": "Pending"
      }
    ]
  }
}
```

## Order Cancellation Workflow

### Scenario: Patient Refuses Test

**Cancel Order:**
```http
POST http://localhost:5007/api/lab/orders/order-uuid-004/cancel
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "cancellationReason": "Patient refused blood draw. Will reschedule."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid-004",
    "orderNumber": "LAB-APOLLO-2024-000004",
    "status": "Cancelled",
    "cancellationReason": "Patient refused blood draw. Will reschedule."
  }
}
```

## Multi-Test Order Workflow

### Scenario: Comprehensive Metabolic Panel

**Create Order with Multiple Tests:**
```http
POST http://localhost:5007/api/lab/orders
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "patientId": "patient-uuid-999",
  "doctorId": "doctor-uuid-789",
  "priority": "Routine",
  "clinicalNotes": "Annual health checkup",
  "labTestIds": [
    "cbc-test-uuid",
    "lipid-profile-uuid",
    "lft-uuid",
    "kft-uuid",
    "thyroid-uuid"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "LAB-APOLLO-2024-000005",
    "status": "Pending",
    "items": [
      {"testName": "Complete Blood Count", "status": "Pending"},
      {"testName": "Lipid Profile", "status": "Pending"},
      {"testName": "Liver Function Test", "status": "Pending"},
      {"testName": "Kidney Function Test", "status": "Pending"},
      {"testName": "Thyroid Profile", "status": "Pending"}
    ]
  }
}
```

## Patient History Workflow

### Get All Lab Orders for Patient

**Request:**
```http
GET http://localhost:5007/api/lab/orders/by-patient/patient-uuid-123
Authorization: Bearer {doctor_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderNumber": "LAB-APOLLO-2024-000001",
      "orderDate": "2024-01-15T10:30:00Z",
      "status": "Completed",
      "priority": "Routine",
      "completedAt": "2024-01-15T14:30:00Z"
    },
    {
      "orderNumber": "LAB-APOLLO-2023-005432",
      "orderDate": "2023-12-10T09:00:00Z",
      "status": "Completed",
      "priority": "Routine",
      "completedAt": "2023-12-10T13:00:00Z"
    }
  ]
}
```

## Error Scenarios

### Attempt to Enter Results for Cancelled Order

**Request:**
```http
POST http://localhost:5007/api/lab/orders/cancelled-order-uuid/items/item-uuid/results
Authorization: Bearer {lab_tech_token}
Content-Type: application/json

{
  "results": [...]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Cannot enter results for cancelled order",
  "data": null
}
```

### Attempt to Cancel Completed Order

**Request:**
```http
POST http://localhost:5007/api/lab/orders/completed-order-uuid/cancel
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "cancellationReason": "Test"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Cannot cancel order with status: Completed",
  "data": null
}
```

### Duplicate Test Code

**Request:**
```http
POST http://localhost:5007/api/lab/tests
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "testCode": "CBC",
  "testName": "Complete Blood Count Duplicate",
  ...
}
```

**Response:**
```json
{
  "success": false,
  "message": "Test code already exists",
  "data": null
}
```

## Integration with Other Services

### Billing Service Integration

When lab order is completed, Billing Service consumes `LabOrderCompletedEvent`:

```csharp
// In Billing Service
public async Task HandleLabOrderCompleted(LabOrderCompletedEvent evt)
{
    // Get lab order details
    var labOrder = await _labServiceClient.GetLabOrderAsync(evt.LabOrderId);
    
    // Create invoice
    var invoice = new Invoice
    {
        PatientId = evt.PatientId,
        EncounterId = evt.EncounterId,
        InvoiceDate = DateTime.UtcNow,
        Items = labOrder.Items.Select(item => new InvoiceItem
        {
            Description = item.TestName,
            Quantity = 1,
            UnitPrice = item.Price,
            Amount = item.Price
        }).ToList()
    };
    
    await _invoiceRepo.CreateAsync(invoice);
}
```

### Analytics Service Integration

Analytics Service tracks lab statistics:

```csharp
// In Analytics Service
public async Task HandleLabOrderCompleted(LabOrderCompletedEvent evt)
{
    // Update lab summary
    await _analyticsRepo.UpsertLabSummaryAsync(new LabSummary
    {
        TenantId = evt.TenantId,
        Date = evt.CompletedAt.Date,
        TotalOrders = 1,
        TotalTests = evt.TotalTests,
        AbnormalResults = evt.AbnormalResults,
        CriticalResults = evt.CriticalResults,
        AverageTurnaroundHours = CalculateTurnaround(evt)
    });
}
```

## Performance Testing

### Load Test Scenario: 15,000 Orders/Day

**Concurrent Order Creation:**
```bash
# Using Apache Bench
ab -n 15000 -c 100 -H "Authorization: Bearer {token}" \
   -p order.json -T application/json \
   http://localhost:5007/api/lab/orders
```

**Expected Results:**
- Throughput: 173 orders/minute
- Average response time: < 500ms
- 99th percentile: < 1000ms
- Zero sequence collisions (atomic UPSERT)

### Cache Performance

**First Request (Cache Miss):**
```
GET /api/lab/tests
Response Time: 150ms (database query)
```

**Subsequent Requests (Cache Hit):**
```
GET /api/lab/tests
Response Time: 5ms (Redis cache)
```

**Cache Hit Rate:** ~95% for lab test catalog

---

**Document Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Service:** Laboratory Service  
**Port:** 5007
