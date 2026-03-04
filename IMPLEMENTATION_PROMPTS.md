# 🎯 QUICK IMPLEMENTATION PROMPTS

Use these prompts to quickly implement missing features in your Digital Hospital project.

---

## 🚀 IMMEDIATE FIXES (30 minutes)

### 1. Add AR Aging Report Route
```
Add AR Aging Report page to the routing in App.tsx. The page already exists at 
frontend/src/features/billing/pages/ARAgingReportPage.tsx but is not routed. 
Add route: /billing/ar-aging
Also add navigation menu item in the sidebar.
```

---

## 🔴 HIGH PRIORITY IMPLEMENTATIONS

### 2. Refund Approval Workflow (2 days)

**Backend Prompt:**
```
Implement refund approval APIs in BillingService. Database schema is ready (4.00.sql).
Need these endpoints:
1. POST /api/billing/refunds/{id}/approve - Approve refund
2. POST /api/billing/refunds/{id}/reject - Reject refund with reason
3. GET /api/billing/refunds/pending - Get pending refunds
4. GET /api/billing/refunds/{id}/approval-history - Get approval history

Use existing RefundRepository and create RefundApprovalRepository.
Add RequirePermission("refund.approve") attribute.
```

**Frontend Prompt:**
```
Create refund approval page at frontend/src/features/billing/pages/RefundApprovalPage.tsx
Features needed:
1. List of pending refunds with invoice details
2. Approve/Reject modal with comments field
3. Approval history view
4. Status badges (Pending/Approved/Rejected)
Add route: /billing/refunds/approval
```

### 3. RBAC Permission Management (2-3 days)

**Backend Prompt:**
```
Complete RBAC implementation in IdentityService:
1. Create PermissionService using existing PermissionRepository
2. Add endpoints:
   - GET /api/identity/permissions - List all permissions
   - POST /api/identity/roles/{roleId}/permissions - Assign permissions to role
   - DELETE /api/identity/roles/{roleId}/permissions/{permissionId} - Remove permission
   - GET /api/identity/users/{userId}/permissions - Get user permissions
3. Implement dynamic permission checking in RequirePermissionAttribute
4. Add token revocation endpoint: POST /api/identity/auth/revoke
```

**Frontend Prompt:**
```
Create permission management pages:
1. frontend/src/features/users/pages/PermissionsPage.tsx
   - List all permissions grouped by module
   - Assign/remove permissions to roles
   - Permission matrix view (roles vs permissions)
2. frontend/src/features/users/pages/RolePermissionsPage.tsx
   - Edit permissions for specific role
   - Checkbox grid for easy assignment
Add routes: /users/permissions and /users/roles/:id/permissions
```

### 4. Patient Clinical Data (3-4 days)

**Backend Prompt:**
```
Expand PatientService with clinical data:
1. Create database migration script 2.00.sql with tables:
   - patient_allergies (id, patient_id, allergen, severity, reaction, notes)
   - patient_conditions (id, patient_id, condition_name, diagnosed_date, status, notes)
   - patient_medications (id, patient_id, medication_name, dosage, frequency, start_date, end_date)
   - patient_immunizations (id, patient_id, vaccine_name, date_given, next_due_date, notes)
   - patient_documents (id, patient_id, document_type, file_path, file_name, uploaded_at)
2. Add blood_group VARCHAR(5) to patients table
3. Create repositories and services for each
4. Add CRUD endpoints for all clinical data
```

**Frontend Prompt:**
```
Add clinical data management to patient profile:
1. Create components in frontend/src/features/patients/components/:
   - AllergiesTab.tsx - List and add allergies
   - ConditionsTab.tsx - Chronic conditions tracker
   - MedicationsTab.tsx - Medication history
   - ImmunizationsTab.tsx - Immunization records
   - DocumentsTab.tsx - Document upload and list
2. Add tabs to PatientProfilePage
3. Create modals for adding each type of data
4. Add blood group field to patient registration form
```

### 5. Security Enhancements (2 days)

**Backend Prompt:**
```
Enhance security in IdentityService:
1. Implement data masking:
   - Create MaskingHelper in Shared.Common
   - Mask Aadhaar: Show only last 4 digits (XXXX-XXXX-1234)
   - Mask phone: Show only last 4 digits (XXXXXX1234)
2. Add session management:
   - Create sessions table (id, user_id, token_hash, expires_at, ip_address)
   - Track active sessions
   - Add endpoint: GET /api/identity/sessions/active
   - Add endpoint: DELETE /api/identity/sessions/{id} - Logout specific session
3. Implement token revocation:
   - Create revoked_tokens table (token_hash, revoked_at)
   - Check revocation in JWT validation
```

**Frontend Prompt:**
```
Add security UI features:
1. Account lockout display on login page
   - Show "Account locked until {time}" message
   - Show remaining failed attempts
2. Password policy enforcement:
   - Show password requirements on registration
   - Real-time validation feedback
   - Password strength meter
3. Force password change flow:
   - Redirect to change password page after login
   - Block access until password changed
4. Session management page:
   - List active sessions with device/IP
   - Logout specific session button
   - Logout all other sessions button
Add route: /profile/sessions
```

---

## 🟡 MEDIUM PRIORITY IMPLEMENTATIONS

### 6. Enhanced Audit Service (2 days)

**Backend Prompt:**
```
Enhance AuditService with search and export:
1. Add search endpoint: GET /api/audit/search
   Query params: userId, entityType, action, startDate, endDate, pageNumber, pageSize
2. Add export endpoint: GET /api/audit/export
   Query params: format (csv/excel), filters (same as search)
   Use EPPlus for Excel generation
3. Implement table partitioning:
   - Create monthly partitions for audit_logs table
   - Add partition management script
4. Add suspicious activity detection:
   - Multiple failed logins from different IPs
   - Unusual access patterns
   - Endpoint: GET /api/audit/suspicious
```

**Frontend Prompt:**
```
Enhance AuditLogsPage with advanced features:
1. Add advanced search filters:
   - User dropdown
   - Entity type dropdown
   - Action type dropdown
   - Date range picker
2. Add export button:
   - Export to CSV
   - Export to Excel
   - Show download progress
3. Add activity timeline view:
   - Visual timeline of events
   - Group by date
   - Color-coded by action type
4. Add suspicious activity alerts:
   - Red badge for suspicious activities
   - Detailed view modal
```

### 7. Doctor Management UI (2 days)

**Frontend Prompt:**
```
Create doctor management pages (backend already exists):
1. frontend/src/features/doctors/pages/DoctorsPage.tsx
   - List all doctors with search
   - Filter by specialization
   - Add/Edit doctor modal
2. frontend/src/features/doctors/pages/DoctorProfilePage.tsx
   - Doctor details
   - Specializations
   - Availability schedule
   - Appointment history
3. frontend/src/features/doctors/components/DoctorScheduleCalendar.tsx
   - Weekly schedule view
   - Add/edit time slots
Add routes: /doctors and /doctors/:id
Add navigation menu item.
```

### 8. Appointment Management UI (3 days)

**Frontend Prompt:**
```
Create appointment management pages (backend already exists):
1. frontend/src/features/appointments/pages/AppointmentsPage.tsx
   - Calendar view of appointments
   - List view with filters
   - Book appointment button
2. frontend/src/features/appointments/components/BookAppointmentModal.tsx
   - Select patient
   - Select doctor
   - Select date/time from available slots
   - Add notes
3. frontend/src/features/appointments/components/AppointmentCalendar.tsx
   - Full calendar with appointments
   - Color-coded by status
   - Click to view details
4. Add reschedule and cancel modals
Add routes: /appointments and /appointments/book
Add navigation menu item.
```

---

## 🟢 LOW PRIORITY (Future)

### 9. Insurance Management (4-5 days)

**Backend Prompt:**
```
Complete InsuranceService implementation:
1. Fix build errors first
2. Add pre-authorization workflow:
   - Create pre_authorizations table
   - Add approval workflow
   - Endpoints for submit/approve/reject
3. Add claims processing:
   - Create claims table
   - Link to invoices
   - Track claim status
   - Settlement workflow
4. Add insurance provider management:
   - CRUD for providers
   - Policy templates
   - Coverage rules
```

**Frontend Prompt:**
```
Create insurance management UI:
1. Insurance providers page
2. Pre-authorization request form
3. Claims submission page
4. Claims tracking dashboard
5. Policy management
Add routes under /insurance/*
```

### 10. Analytics Dashboard (5-7 days)

**Backend Prompt:**
```
Complete AnalyticsService:
1. Fix build errors
2. Implement dashboard metrics:
   - Patient statistics
   - Revenue analytics
   - Appointment analytics
   - Department-wise performance
3. Add report generation:
   - Custom date ranges
   - Export to PDF/Excel
4. Add real-time metrics using Redis
```

**Frontend Prompt:**
```
Create analytics dashboard:
1. Dashboard widgets:
   - Revenue charts (line, bar)
   - Patient statistics (pie charts)
   - Appointment trends
   - Top doctors/departments
2. Custom report builder
3. Date range selector
4. Export functionality
Add route: /analytics
```

---

## 📋 QUICK FIX PROMPTS

### Fix Build Errors

**EncounterService:**
```
Fix build errors in EncounterService. Check for:
1. Missing using statements
2. Incorrect PagedResult usage (should be PagedResult<T>)
3. Missing repository implementations
4. Incorrect dependency injection
```

**InsuranceService:**
```
Fix build errors in InsuranceService. Check for:
1. Missing implementations in InsuranceAppService
2. Incomplete repository methods
3. Missing DTOs
4. Incorrect controller endpoints
```

**AnalyticsService:**
```
Fix build errors in AnalyticsService. Check for:
1. Missing event consumer implementations
2. Incomplete repository methods
3. Missing analytics calculation logic
4. Incorrect dependency injection
```

**PharmacyService Database:**
```
Fix PharmacyService database schema error:
The error "functions in index predicate must be marked IMMUTABLE" means
a function used in an index is not marked as IMMUTABLE.
Find the problematic index in 1.00.sql and either:
1. Remove the index
2. Mark the function as IMMUTABLE
3. Use a different approach for the index
```

---

## 🎯 USAGE INSTRUCTIONS

1. **Copy the relevant prompt** for the feature you want to implement
2. **Paste it in Amazon Q chat** or your AI assistant
3. **Provide context** by mentioning the file paths if needed
4. **Review and test** the generated code
5. **Iterate** if needed with follow-up questions

---

**Pro Tip:** Always implement backend first, then frontend. Test each feature thoroughly before moving to the next.

**Generated by:** Amazon Q Developer  
**Last Updated:** March 4, 2025
