# ✅ Digital Hospital - Implementation Checklist

Track your progress as you implement missing features.

---

## 🚀 WEEK 1: CRITICAL FIXES

### Day 1: Quick Wins (4 hours)
- [ ] Add AR Aging Report route to App.tsx
- [ ] Add AR Aging navigation menu item
- [ ] Fix PharmacyService database schema error
- [ ] Fix EncounterService build errors
- [ ] Fix InsuranceService build errors
- [ ] Fix AnalyticsService build errors
- [ ] Test all services start successfully

### Day 2-3: Refund Approval Workflow (16 hours)

**Backend (8 hours)**
- [ ] Create RefundApprovalRepository
- [ ] Implement ApproveRefundAsync method
- [ ] Implement RejectRefundAsync method
- [ ] Implement GetPendingRefundsAsync method
- [ ] Implement GetApprovalHistoryAsync method
- [ ] Add POST /api/billing/refunds/{id}/approve endpoint
- [ ] Add POST /api/billing/refunds/{id}/reject endpoint
- [ ] Add GET /api/billing/refunds/pending endpoint
- [ ] Add GET /api/billing/refunds/{id}/approval-history endpoint
- [ ] Add RequirePermission attributes
- [ ] Test all endpoints with Postman

**Frontend (8 hours)**
- [ ] Create RefundApprovalPage.tsx
- [ ] Create pending refunds list component
- [ ] Create approve/reject modal
- [ ] Create approval history component
- [ ] Add refund approval service methods
- [ ] Add route /billing/refunds/approval
- [ ] Add navigation menu item
- [ ] Test end-to-end workflow

### Day 4-5: RBAC Completion (16 hours)

**Backend (8 hours)**
- [ ] Create PermissionService interface
- [ ] Implement PermissionService
- [ ] Add GET /api/identity/permissions endpoint
- [ ] Add POST /api/identity/roles/{roleId}/permissions endpoint
- [ ] Add DELETE /api/identity/roles/{roleId}/permissions/{permissionId} endpoint
- [ ] Add GET /api/identity/users/{userId}/permissions endpoint
- [ ] Add POST /api/identity/auth/revoke endpoint (token revocation)
- [ ] Update RequirePermissionAttribute for dynamic checking
- [ ] Add permission checking to all controllers
- [ ] Test permission-based access control

**Frontend (8 hours)**
- [ ] Create PermissionsPage.tsx
- [ ] Create RolePermissionsPage.tsx
- [ ] Create permission assignment component
- [ ] Create permission matrix view
- [ ] Add permission service methods
- [ ] Add routes /users/permissions and /users/roles/:id/permissions
- [ ] Add navigation menu items
- [ ] Test permission assignment workflow

---

## 📅 WEEK 2: PATIENT CLINICAL DATA

### Day 1-2: Backend Implementation (16 hours)

**Database (4 hours)**
- [ ] Create 2.00.sql migration script
- [ ] Add patient_allergies table
- [ ] Add patient_conditions table
- [ ] Add patient_medications table
- [ ] Add patient_immunizations table
- [ ] Add patient_documents table
- [ ] Add blood_group column to patients table
- [ ] Add indexes
- [ ] Run migration script

**Repositories (4 hours)**
- [ ] Create AllergyRepository
- [ ] Create ConditionRepository
- [ ] Create MedicationRepository
- [ ] Create ImmunizationRepository
- [ ] Create DocumentRepository
- [ ] Implement CRUD methods for each

**Services & Controllers (8 hours)**
- [ ] Create AllergyService
- [ ] Create ConditionService
- [ ] Create MedicationService
- [ ] Create ImmunizationService
- [ ] Create DocumentService
- [ ] Add allergy endpoints to PatientController
- [ ] Add condition endpoints to PatientController
- [ ] Add medication endpoints to PatientController
- [ ] Add immunization endpoints to PatientController
- [ ] Add document endpoints to PatientController
- [ ] Test all endpoints

### Day 3-5: Frontend Implementation (24 hours)

**Components (12 hours)**
- [ ] Create AllergiesTab.tsx
- [ ] Create AddAllergyModal.tsx
- [ ] Create ConditionsTab.tsx
- [ ] Create AddConditionModal.tsx
- [ ] Create MedicationsTab.tsx
- [ ] Create AddMedicationModal.tsx
- [ ] Create ImmunizationsTab.tsx
- [ ] Create AddImmunizationModal.tsx
- [ ] Create DocumentsTab.tsx
- [ ] Create DocumentUploadModal.tsx

**Integration (8 hours)**
- [ ] Add tabs to PatientProfilePage
- [ ] Add blood group field to patient registration
- [ ] Add blood group field to edit patient form
- [ ] Create patient clinical service methods
- [ ] Integrate all tabs with backend APIs
- [ ] Add loading states
- [ ] Add error handling

**Testing (4 hours)**
- [ ] Test allergy management
- [ ] Test condition management
- [ ] Test medication management
- [ ] Test immunization management
- [ ] Test document upload
- [ ] Test blood group field
- [ ] End-to-end patient profile testing

---

## 🔒 WEEK 3: SECURITY & AUDIT

### Day 1-2: Security Enhancements (16 hours)

**Backend (10 hours)**
- [ ] Create MaskingHelper in Shared.Common
- [ ] Implement Aadhaar masking
- [ ] Implement phone masking
- [ ] Create sessions table
- [ ] Create SessionRepository
- [ ] Create SessionService
- [ ] Add GET /api/identity/sessions/active endpoint
- [ ] Add DELETE /api/identity/sessions/{id} endpoint
- [ ] Create revoked_tokens table
- [ ] Implement token revocation checking
- [ ] Update JWT validation middleware
- [ ] Test all security features

**Frontend (6 hours)**
- [ ] Add account lockout display on login page
- [ ] Add remaining attempts counter
- [ ] Add password requirements display
- [ ] Add password strength meter
- [ ] Create ChangePasswordPage.tsx for forced change
- [ ] Create SessionsPage.tsx
- [ ] Add active sessions list
- [ ] Add logout session button
- [ ] Add logout all sessions button
- [ ] Add route /profile/sessions
- [ ] Test all security UI features

### Day 3-4: Enhanced Audit (16 hours)

**Backend (8 hours)**
- [ ] Add search parameters to AuditRepository
- [ ] Implement advanced search query
- [ ] Add GET /api/audit/search endpoint
- [ ] Install EPPlus NuGet package
- [ ] Create ExportService
- [ ] Implement CSV export
- [ ] Implement Excel export
- [ ] Add GET /api/audit/export endpoint
- [ ] Create partition management script
- [ ] Implement suspicious activity detection
- [ ] Add GET /api/audit/suspicious endpoint
- [ ] Test all audit features

**Frontend (8 hours)**
- [ ] Add advanced search filters to AuditLogsPage
- [ ] Add user dropdown filter
- [ ] Add entity type dropdown filter
- [ ] Add action type dropdown filter
- [ ] Add date range picker
- [ ] Create export button component
- [ ] Implement CSV export
- [ ] Implement Excel export
- [ ] Create ActivityTimelineView.tsx
- [ ] Add suspicious activity alerts
- [ ] Create SuspiciousActivityModal.tsx
- [ ] Test all audit UI features

### Day 5: Testing & Documentation (8 hours)
- [ ] End-to-end security testing
- [ ] Test account lockout
- [ ] Test password policy enforcement
- [ ] Test session management
- [ ] Test token revocation
- [ ] Test audit search
- [ ] Test audit export
- [ ] Test suspicious activity detection
- [ ] Update README.md
- [ ] Update API documentation
- [ ] Create security documentation

---

## 👨‍⚕️ WEEK 4: DOCTOR & APPOINTMENT MANAGEMENT

### Day 1-2: Doctor Management UI (16 hours)

**Pages & Components (12 hours)**
- [ ] Create DoctorsPage.tsx
- [ ] Create doctor list component
- [ ] Create doctor search component
- [ ] Create specialization filter
- [ ] Create AddDoctorModal.tsx
- [ ] Create EditDoctorModal.tsx
- [ ] Create DoctorProfilePage.tsx
- [ ] Create doctor details component
- [ ] Create specializations component
- [ ] Create DoctorScheduleCalendar.tsx
- [ ] Create appointment history component

**Integration (4 hours)**
- [ ] Create doctor service methods
- [ ] Add routes /doctors and /doctors/:id
- [ ] Add navigation menu item
- [ ] Integrate with backend APIs
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test doctor management workflow

### Day 3-5: Appointment Management UI (24 hours)

**Pages & Components (16 hours)**
- [ ] Create AppointmentsPage.tsx
- [ ] Create AppointmentCalendar.tsx
- [ ] Create appointment list view
- [ ] Create status filters
- [ ] Create BookAppointmentModal.tsx
- [ ] Create patient selector
- [ ] Create doctor selector
- [ ] Create time slot selector
- [ ] Create RescheduleAppointmentModal.tsx
- [ ] Create CancelAppointmentModal.tsx
- [ ] Create AppointmentDetailModal.tsx

**Integration (6 hours)**
- [ ] Create appointment service methods
- [ ] Add routes /appointments and /appointments/book
- [ ] Add navigation menu item
- [ ] Integrate with backend APIs
- [ ] Add loading states
- [ ] Add error handling

**Testing (2 hours)**
- [ ] Test appointment calendar view
- [ ] Test book appointment flow
- [ ] Test reschedule appointment
- [ ] Test cancel appointment
- [ ] Test appointment filters
- [ ] End-to-end appointment workflow

---

## 📊 PROGRESS TRACKING

### Overall Completion
- [ ] Week 1: Critical Fixes (0/7 tasks)
- [ ] Week 2: Patient Clinical Data (0/10 tasks)
- [ ] Week 3: Security & Audit (0/11 tasks)
- [ ] Week 4: Doctor & Appointment Management (0/7 tasks)

### Service Status
- [ ] IdentityService: 85% → 95%
- [ ] PatientService: 70% → 95%
- [ ] BillingService: 75% → 90%
- [ ] AuditService: 50% → 85%
- [ ] PharmacyService: 75% → 80% (fix schema)
- [ ] EncounterService: 70% → 80% (fix build)
- [ ] InsuranceService: 50% → 60% (fix build)
- [ ] AnalyticsService: 40% → 50% (fix build)

### Frontend Completion
- [ ] Authentication: 100%
- [ ] Dashboard: 80%
- [ ] Patient Management: 70% → 95%
- [ ] Billing: 80% → 95%
- [ ] Doctor Management: 0% → 90%
- [ ] Appointment Management: 0% → 90%
- [ ] Audit: 60% → 90%
- [ ] Users & Permissions: 50% → 90%

---

## 🎯 DAILY CHECKLIST TEMPLATE

Copy this for each day:

```
## Day: _____ Date: _____

### Morning (4 hours)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Afternoon (4 hours)
- [ ] Task 4
- [ ] Task 5
- [ ] Task 6

### Testing & Documentation (1 hour)
- [ ] Test implemented features
- [ ] Update documentation
- [ ] Commit and push code

### Blockers/Issues:
- 

### Notes:
- 
```

---

## 📝 NOTES

- Mark tasks as complete with [x]
- Add notes for any blockers or issues
- Update progress percentages weekly
- Celebrate small wins! 🎉

---

**Last Updated:** March 4, 2025  
**Target Completion:** April 1, 2025 (4 weeks)
