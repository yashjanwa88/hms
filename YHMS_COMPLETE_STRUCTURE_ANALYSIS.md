# YHMS-Inspired Module Structure Implementation

## 📊 Complete Module Analysis from YHMS Project

Based on detailed analysis of `D:\YHMS\web-softclinic-app`, here's the complete implementation plan:

---

## 🏥 1. PATIENT MODULE - Complete Structure

### **Main Components:**

#### A. **Patient Registration** (Main Component)
**Sub-components (9 tabs):**
1. **PatRegi** - Basic registration info
   - Registration type, date, time
   - Patient prefix, name
   - Gender, DOB, age calculation
   - Blood group, marital status
   - Mother's CR number / Staff code
   
2. **Personal Identification**
   - Multiple ID types (Aadhar, PAN, Passport, etc.)
   - ID number
   - Dynamic table for multiple IDs

3. **Fertility Information** (Optional)
   - Partner details
   - File number
   - Contact info

4. **Contact Details**
   - Urban/Rural toggle
   - Mobile with country code
   - Email, address
   - Country, state, city, pincode

5. **Emergency Contact Details**
   - Contact person info
   - Relationship
   - Address

6. **Referral Details**
   - Referred by/to
   - Referring date

7. **Biometric Details**
   - Patient photograph
   - Signature
   - Fingerprint

8. **Insurance Details**
   - Sponsor type
   - Policy details
   - Insurance card image

9. **Death Details**
   - Deceased checkbox
   - Date & reason of death

#### B. **Patient List**
- Search & filter
- Pagination
- Actions (View, Edit, Delete)

#### C. **Patient Info**
- Quick patient details view
- Medical history summary

#### D. **Patient Search**
- Autocomplete search
- Search by name, UHID, mobile

#### E. **Patient Address List**
- Multiple addresses management

#### F. **Patient Details Report**
- Printable patient report

#### G. **Patient Prefix Master**
- Manage prefixes (Mr, Mrs, Dr, etc.)

#### H. **Patient Types Master**
- General, VIP, Staff, etc.

#### I. **Registration Types Master**
- General, Emergency, etc.
- Registration fees
- Features configuration

#### J. **File Manager**
- Document upload
- Document list
- File viewer

#### K. **Print Page**
- Registration card print
- Barcode/QR code

### **Models (30+ TypeScript interfaces):**
```
- PatientRegistrationModel
- PatRegiModel
- PatientContactDetailsModel
- PatientEmergencyContactDetailsModel
- PatientPersonalIdentificationDetailsModel
- PatientFertilityInformationDetailsModel
- PatientDeathDetailModel
- PatientFingerprintDetailModel
- PatientPhotographDetailModel
- PatientSignatureDetailModel
- PatientInsuranceDetailModel
- PatientInsuranceCardImageModel
- PatientReferralDetailModel
- PatientGuardianDetailsModel
- PatientPersonalInfoModel
- PatientPrefixModel
- PatientTypeModel
- RegistrationTypeModel
- FileManagerModel
- ... and more
```

### **Services:**
```
- PatientRegistrationService
- PatientInfoService
- PatientPrefixService
- PatientTypeService
- RegistrationTypeService
- FileManagerService
- PatientAddressService
- SharedService
```

---

## 💰 2. BILLING MODULE - Complete Structure

### **Main Components:**

#### A. **Billing Detail** (Invoice Generation)
**Sub-components:**
1. **Billing Main**
   - Patient selection
   - Service/item selection
   - Quantity, price, discount
   - Tax calculation
   - Grand total

2. **Billing Item**
   - Service item row
   - Calculations

3. **Billing Load Requisition**
   - Load from lab/pharmacy orders

4. **Invoice Print**
   - Print preview
   - PDF generation

5. **Report Preview**
   - Invoice preview before save

#### B. **Deposit Management**
**Sub-components:**
1. **Deposit**
   - Add deposit
   - Payment modes
   - Receipt generation

2. **Deposit Print**
   - Receipt print

3. **Deposit Report**
   - Deposit history

#### C. **Refund Management**
**Sub-components:**
1. **Refund**
   - Refund request
   - Approval workflow
   - Refund modes

2. **Refund Print**
   - Refund receipt

#### D. **Settlement**
**Sub-components:**
1. **Settlement**
   - Invoice settlement
   - Multiple payment modes
   - Partial payments

2. **Settlement Item**
   - Settlement line items

3. **Tab Settlement**
   - Settlement tabs

4. **Settlement General**
   - General settlement info

#### E. **Cancellation**
**Sub-components:**
1. **Cancellation**
   - Invoice cancellation
   - Reason

2. **Cancellation Item**
   - Cancelled items

3. **Invoice Detail Item**
   - Invoice items for cancellation

#### F. **Invoice Cancellation**
**Sub-components:**
1. **Invoice Cancellation**
   - Full invoice cancellation

2. **Invoice Cancellation Item**
   - Item-wise cancellation

3. **Patient Invoice List**
   - Patient's invoice history

#### G. **Patient Ledger**
**Sub-components:**
1. **Patient Ledger**
   - Complete transaction history
   - Balance calculation

2. **Deposit Modal**
   - Quick deposit

3. **Invoice Settlement Modal**
   - Quick settlement

4. **Refunds Modal**
   - Quick refund

5. **Settlement Details**
   - Settlement breakdown

#### H. **Cash Management**
- User-wise cash collection
- Day-end closing
- Cash handover

#### I. **Discount Master**
**Sub-components:**
1. **Discount Master**
   - Discount types
   - Percentage/Amount

2. **Discount Master Details**
   - Discount configuration

3. **Apply Discount**
   - Apply discount to invoice

4. **Billing Discount**
   - Discount application

#### J. **Tax Configuration**
**Sub-components:**
1. **Tax Configurations**
   - Tax list

2. **Tax Configuration Detail**
   - Tax setup

3. **Tax Configuration Table**
   - Tax rates table

4. **Exception Tax Configuration**
   - Tax exceptions

5. **Tax Master**
   - Tax types (GST, VAT, etc.)

#### K. **Organisation/Insurance Module**
**Sub-components:**
1. **List Organisation**
   - Insurance companies
   - Corporate clients

2. **Organisation Detail**
   - Company details
   - Contact persons

3. **Contract Organisation**
   - Contract details

4. **Agreement Details**
   - Agreement terms

5. **Agreement Tariffs**
   - Special rates

6. **Service Code Mapping**
   - Map services to insurance codes

7. **Standard Tariffs**
   - Standard rate plans

8. **Rate Plan Standard Tariffs**
   - Rate plan configuration

9. **Contract Organisation Audit**
   - Audit trail

#### L. **Rate Plans**
**Sub-components:**
1. **Base Rate Plan List**
   - Base rates

2. **Base Rate Tariffs Detail**
   - Rate configuration

3. **Billing Service Details**
   - Service-wise rates

4. **Rate Plan Audit**
   - Rate change history

5. **Rate Search Criteria**
   - Search rates

6. **Rate Service Details**
   - Service rate details

7. **Organisation Rate Plan List**
   - Organisation-specific rates

8. **Organisation Rate Plan Definition**
   - Define org rates

9. **Organisation Rate Plan Audit**
   - Audit trail

10. **Organisation Rate Plan Search Criteria**
    - Search org rates

11. **Organisation Standard Service Details**
    - Standard services

#### M. **Package Management**
**Sub-components:**
1. **Package Type Master**
   - Package types

2. **Package Type Master Detail**
   - Package configuration

3. **IPD Package Service Details**
   - IPD package services

#### N. **Reports & Lists**
1. **OPD Transaction List**
   - OPD billing list

2. **IPD Transaction List**
   - IPD billing list

3. **Receipt List**
   - All receipts

4. **New Receipt List**
   - Recent receipts

5. **Patient OS (Outstanding)**
   - Outstanding amounts

6. **Groupwise Billing Report**
   - Group-wise analysis

7. **Doctor Share Posting**
   - Doctor commission

8. **Doctor Share Reward**
   - Doctor incentives

#### O. **Other Components**
1. **Bill Adjustment**
   - Adjust bills
   - Add services
   - Adjust deposit
   - Adjust discount
   - Package reconciliation

2. **Bill Amendment**
   - Amend invoices

3. **Patient Eligibility**
   - Check insurance eligibility

4. **Payment with Option**
   - Multiple payment modes

5. **Class Master**
   - Patient classes

6. **Currency Conversion Rate**
   - Multi-currency support

7. **Bank Detail**
   - Bank accounts
   - Branch details

8. **Barcode**
   - Barcode generation

9. **Print Check**
   - Print verification

10. **CMN Billing Field**
    - Common billing fields

### **Models (60+ TypeScript interfaces):**
```
- BillingModel
- InvoiceMasterModel
- InvoiceDetailModel
- InvoiceServiceDetailModel
- InvoiceServiceItemDetailModel
- InvoicePaymentModel
- DepositModel
- RefundModel
- SettlementModel
- SettlementDetailModel
- SettlementInvoiceModel
- SettlementPaymentModel
- CancellationModel
- CancellationInvoiceModel
- CancellationReceiptModel
- PatientLedgerModel
- CashManagementModel
- DiscountMasterModel
- ApplyDiscountModel
- TaxModel
- TaxConfigurationModel
- TaxConfigurationDetailModel
- OrganisationModel
- AgreementDetailsModel
- AgreementTariffsModel
- BaseRatePlanModel
- OrganisationRatePlanModel
- PackageTypeModel
- PackageDetailsModel
- DoctorShareRewardModel
- BillAdjustmentModel
- BillAmendmentModel
- PatientOSModel
- ModeOfPaymentModel
- ClassMasterModel
- CurrencyConversionRateModel
- BankModel
- BranchDetailModel
- ... and more
```

### **Services:**
```
- BillingService
- DepositService
- RefundService
- SettlementService
- CancellationService
- PaymentService
- DiscountMasterService
- TaxService
- TaxConfigurationService
- OrganisationService
- OrganisationRatePlanService
- BaseRatePlanService
- CashManagementService
- DoctorShareRewardService
- BillAdjustmentService
- PreInvoiceService
- ReportPreviewService
- AccountMasterTenantService
- BankService
- CurrencyConversationRateService
- SharedService
```

---

## 📅 3. APPOINTMENT/OPD MODULE - Structure

### **Components:**
1. **OPD Service App** (Main)
2. **Appointment Booking**
3. **Doctor Schedule**
4. **Appointment List**
5. **Appointment Calendar**

### **Models:**
```
- AppointmentModel
- DoctorScheduleModel
- AppointmentDetailModel
```

### **Services:**
```
- OPDRestService
- AppointmentService
```

---

## 🎯 Implementation Strategy for Your React Project

### **Phase 1: Patient Module (Week 1-2)**
✅ Already Created:
- PatientRegistrationForm (8 tabs)
- PatientSearch
- QuickRegisterModal

🔄 To Create:
- PatientList with advanced filters
- PatientTypes master
- RegistrationTypes master
- PatientPrefix master
- FileManager component
- PrintPage component
- All 30+ TypeScript interfaces/types

### **Phase 2: Billing Module (Week 3-6)**
✅ Already Created:
- CreateInvoiceForm (basic)
- BillingPage (basic)

🔄 To Create:
- **Core Billing:**
  - Enhanced invoice with requisition loading
  - Invoice print/PDF
  - Billing item component
  
- **Deposit:**
  - Deposit form
  - Deposit list
  - Deposit print
  
- **Refund:**
  - Refund form
  - Refund approval workflow
  - Refund print
  
- **Settlement:**
  - Settlement form
  - Multiple payment modes
  - Settlement history
  
- **Cancellation:**
  - Invoice cancellation
  - Item cancellation
  - Cancellation approval
  
- **Patient Ledger:**
  - Complete transaction view
  - Balance calculation
  - Quick actions (deposit, settle, refund)
  
- **Masters:**
  - Discount master
  - Tax configuration
  - Class master
  - Bank master
  
- **Organisation/Insurance:**
  - Organisation list
  - Contract management
  - Rate plans
  - Agreement tariffs
  
- **Reports:**
  - OPD/IPD transaction lists
  - Receipt lists
  - Outstanding report
  - Doctor share reports
  
- All 60+ TypeScript interfaces/types

### **Phase 3: Appointment Module (Week 7)**
✅ Already Created:
- BookAppointmentModalEnhanced (4-step wizard)
- AppointmentsPage

🔄 To Create:
- Doctor schedule management
- Appointment calendar view
- Appointment history
- Appointment reports

---

## 📁 Recommended Folder Structure

```
frontend/src/features/
├── patients/
│   ├── components/
│   │   ├── registration/
│   │   │   ├── PatientRegistrationForm.tsx ✅
│   │   │   ├── PatRegiTab.tsx
│   │   │   ├── PersonalIdentificationTab.tsx
│   │   │   ├── FertilityInformationTab.tsx
│   │   │   ├── ContactDetailsTab.tsx
│   │   │   ├── EmergencyContactTab.tsx
│   │   │   ├── ReferralDetailsTab.tsx
│   │   │   ├── BiometricDetailsTab.tsx
│   │   │   ├── InsuranceDetailsTab.tsx
│   │   │   └── DeathDetailsTab.tsx
│   │   ├── PatientList.tsx
│   │   ├── PatientSearch.tsx ✅
│   │   ├── PatientInfo.tsx
│   │   ├── QuickRegisterModal.tsx ✅
│   │   ├── FileManager.tsx
│   │   └── PrintPage.tsx
│   ├── masters/
│   │   ├── PatientTypes.tsx
│   │   ├── PatientPrefix.tsx
│   │   └── RegistrationTypes.tsx
│   ├── models/
│   │   └── (30+ type definitions)
│   ├── services/
│   │   └── (8+ services)
│   └── pages/
│       └── PatientsPage.tsx ✅
│
├── billing/
│   ├── components/
│   │   ├── invoice/
│   │   │   ├── CreateInvoiceForm.tsx ✅
│   │   │   ├── BillingItem.tsx
│   │   │   ├── LoadRequisition.tsx
│   │   │   ├── InvoicePrint.tsx
│   │   │   └── ReportPreview.tsx
│   │   ├── deposit/
│   │   │   ├── DepositForm.tsx
│   │   │   ├── DepositList.tsx
│   │   │   └── DepositPrint.tsx
│   │   ├── refund/
│   │   │   ├── RefundForm.tsx
│   │   │   ├── RefundList.tsx
│   │   │   └── RefundPrint.tsx
│   │   ├── settlement/
│   │   │   ├── SettlementForm.tsx
│   │   │   ├── SettlementItem.tsx
│   │   │   └── SettlementHistory.tsx
│   │   ├── cancellation/
│   │   │   ├── InvoiceCancellation.tsx
│   │   │   ├── ItemCancellation.tsx
│   │   │   └── CancellationApproval.tsx
│   │   ├── ledger/
│   │   │   ├── PatientLedger.tsx
│   │   │   ├── DepositModal.tsx
│   │   │   ├── SettlementModal.tsx
│   │   │   └── RefundModal.tsx
│   │   ├── masters/
│   │   │   ├── DiscountMaster.tsx
│   │   │   ├── TaxConfiguration.tsx
│   │   │   ├── ClassMaster.tsx
│   │   │   └── BankMaster.tsx
│   │   ├── organisation/
│   │   │   ├── OrganisationList.tsx
│   │   │   ├── OrganisationDetail.tsx
│   │   │   ├── ContractManagement.tsx
│   │   │   ├── RatePlans.tsx
│   │   │   └── AgreementTariffs.tsx
│   │   └── reports/
│   │       ├── OPDTransactionList.tsx
│   │       ├── IPDTransactionList.tsx
│   │       ├── ReceiptList.tsx
│   │       ├── OutstandingReport.tsx
│   │       └── DoctorShareReport.tsx
│   ├── models/
│   │   └── (60+ type definitions)
│   ├── services/
│   │   └── (20+ services)
│   └── pages/
│       ├── BillingPage.tsx ✅
│       ├── DepositPage.tsx
│       ├── RefundPage.tsx
│       ├── SettlementPage.tsx
│       └── PatientLedgerPage.tsx
│
└── appointments/
    ├── components/
    │   ├── BookAppointmentModal.tsx ✅
    │   ├── DoctorSchedule.tsx
    │   ├── AppointmentCalendar.tsx
    │   └── AppointmentHistory.tsx
    ├── models/
    │   └── (5+ type definitions)
    ├── services/
    │   └── (3+ services)
    └── pages/
        └── AppointmentsPage.tsx ✅
```

---

## 🚀 Next Steps

Kya aap chahte ho ki main:

1. **Complete Patient Module** - All remaining components?
2. **Complete Billing Module** - All 30+ components?
3. **Specific Component** - Koi particular component detail mein?
4. **All TypeScript Types** - Sare models/interfaces?
5. **All Services** - API integration services?

Batao kahan se start karu! 🎯
