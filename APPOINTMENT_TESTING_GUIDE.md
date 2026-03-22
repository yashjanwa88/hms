# Appointment Booking System - Testing Guide

## 🚀 Quick Start Testing

### 1. Start Services
```bash
# Start infrastructure
docker-compose up -d postgres-appointment postgres-patient postgres-doctor rabbitmq redis

# Start backend services
cd src/AppointmentService && dotnet run  # Port 5004
cd src/PatientService && dotnet run     # Port 5003  
cd src/DoctorService && dotnet run      # Port 5008

# Start frontend
cd frontend && npm run dev               # Port 3000
```

### 2. Access Points
- **Frontend**: http://localhost:3000
- **Swagger**: http://localhost:5004/swagger
- **Health Check**: http://localhost:5004/api/appointment/v1/health

## 📋 Test Scenarios

### Scenario 1: Complete Booking Flow ✅

**Steps:**
1. **Login** → Navigate to Appointments page
2. **Click "Book New Appointment"**
3. **Select Patient** → Search "John" → Select patient
4. **Filter Doctor** → Type "Cardiology" in specialization
5. **Select Doctor** → Choose cardiologist from dropdown
6. **Choose Date** → Select tomorrow's date
7. **Select Time Slot** → Click available slot (e.g., 10:00-10:30)
8. **Set Type** → Choose "New Consultation"
9. **Add Reason** → "Chest pain consultation"
10. **Enable Notification** → Keep checkbox checked
11. **Click "Book Appointment"**

**Expected Results:**
- ✅ Success toast: "Appointment booked successfully"
- ✅ Modal closes automatically
- ✅ New appointment appears in list
- ✅ SMS/Email notification event published

### Scenario 2: Validation Testing ❌

**Test Past Date:**
1. Select doctor and try to pick yesterday's date
2. **Expected**: Date input disabled for past dates

**Test No Available Slots:**
1. Select doctor with no availability on selected day
2. **Expected**: "No available slots for selected date"

**Test Daily Limit:**
1. Book maximum appointments for a doctor on same day
2. Try booking one more
3. **Expected**: "Doctor has reached maximum appointments limit"

**Test Double Booking:**
1. Book appointment for 10:00-10:30
2. Try booking another for same time slot
3. **Expected**: Slot not available in grid

### Scenario 3: Search & Filter Testing 🔍

**Test Appointment Search:**
1. Go to Appointments page
2. **Filter by Status** → Select "Scheduled"
3. **Date Range** → Set from/to dates
4. **Page Size** → Change to 25 per page
5. **Expected**: Filtered results with pagination

**Test Doctor Specialization Filter:**
1. In booking modal, type "Cardiology" in specialization
2. **Expected**: Only cardiologists in doctor dropdown

## 🧪 API Testing (Postman/Swagger)

### 1. Get Doctors for Booking
```http
GET http://localhost:5004/api/appointment/v1/booking/doctors?specialization=Cardiology
Headers:
  Authorization: Bearer {token}
  X-Tenant-Id: {tenant-id}
```

### 2. Validate Date
```http
GET http://localhost:5004/api/appointment/v1/booking/validate-date/{doctorId}/2024-12-25
Headers:
  Authorization: Bearer {token}
  X-Tenant-Id: {tenant-id}
```

### 3. Get Available Slots
```http
GET http://localhost:5004/api/appointment/v1/booking/available-slots/{doctorId}/2024-12-25
Headers:
  Authorization: Bearer {token}
  X-Tenant-Id: {tenant-id}
```

### 4. Book Appointment
```http
POST http://localhost:5004/api/appointment/v1/booking/book
Headers:
  Authorization: Bearer {token}
  X-Tenant-Id: {tenant-id}
  X-Tenant-Code: HOSP01
  X-User-Id: {user-id}
Body:
{
  "patientId": "guid",
  "doctorId": "guid",
  "appointmentDate": "2024-12-25",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "appointmentType": "New",
  "reason": "Consultation",
  "sendNotification": true
}
```

## 🔧 Test Data Setup

### Create Test Patient
```http
POST http://localhost:5003/api/patient/v1/patients
{
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "9876543210",
  "email": "john@test.com",
  "dateOfBirth": "1990-01-01",
  "gender": "Male"
}
```

### Create Test Doctor
```http
POST http://localhost:5008/api/doctor/v1/doctors
{
  "firstName": "Dr. Smith",
  "lastName": "Cardiologist",
  "department": "Cardiology",
  "specializations": ["Cardiology", "Heart Surgery"],
  "consultationFee": 500,
  "maxPatientsPerDay": 20
}
```

## 🐛 Common Issues & Solutions

### Issue 1: "Doctor not found"
**Solution**: Ensure DoctorService is running on port 5008

### Issue 2: "Patient not found" 
**Solution**: Ensure PatientService is running on port 5003

### Issue 3: "No available slots"
**Solution**: Check doctor availability schedule in DoctorService

### Issue 4: Frontend not loading doctors
**Solution**: Check CORS settings and service URLs in .env

### Issue 5: Database connection errors
**Solution**: Ensure PostgreSQL containers are running

## 📊 Performance Testing

### Load Test Scenarios:
1. **Concurrent Bookings**: 10 users booking same time slot
2. **Slot Availability**: 100 requests for available slots
3. **Doctor Search**: 50 concurrent specialization searches

### Tools:
- **Artillery.js** for load testing
- **Postman Runner** for API testing
- **Browser DevTools** for frontend performance

## 🔍 Monitoring & Logs

### Check Logs:
```bash
# Appointment Service logs
docker-compose logs -f appointment-service

# Database queries
docker-compose logs -f postgres-appointment

# RabbitMQ messages
docker-compose logs -f rabbitmq
```

### Health Checks:
- http://localhost:5004/api/appointment/v1/health
- http://localhost:5003/api/patient/v1/health  
- http://localhost:5008/api/doctor/v1/health

## ✅ Test Checklist

### Frontend Tests:
- [ ] Patient search autocomplete works
- [ ] Doctor dropdown loads with specializations
- [ ] Date picker disables past dates
- [ ] Available slots load dynamically
- [ ] Form validation works
- [ ] Success/error messages display
- [ ] Modal opens/closes properly
- [ ] Appointment list updates after booking

### Backend Tests:
- [ ] All API endpoints respond correctly
- [ ] Date validation prevents past dates
- [ ] Double booking prevention works
- [ ] Daily limit enforcement works
- [ ] Events are published to RabbitMQ
- [ ] Database constraints work
- [ ] Authentication/authorization works

### Integration Tests:
- [ ] Frontend → Backend communication
- [ ] Service-to-service calls (Patient/Doctor)
- [ ] Database transactions
- [ ] Event publishing
- [ ] Notification system

## 🎯 Success Criteria

**✅ System is working correctly if:**
1. Can book appointment end-to-end without errors
2. All validations prevent invalid bookings
3. Real-time slot availability updates
4. Search and filtering work properly
5. Notifications are sent
6. Data persists correctly in database
7. No double bookings occur
8. Performance is acceptable (<2s response times)

## 🚨 Critical Test Cases

### Must Pass:
1. **No Double Booking**: Same slot cannot be booked twice
2. **Past Date Prevention**: Cannot book appointments in past
3. **Daily Limit**: Cannot exceed doctor's daily appointment limit
4. **Data Integrity**: All appointment data saves correctly
5. **Authentication**: Only authorized users can book
6. **Notification**: SMS/Email events are published

**Start with Scenario 1 (Complete Booking Flow) to verify basic functionality, then proceed with validation testing!**