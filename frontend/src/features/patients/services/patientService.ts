import api from '@/lib/api';

const BASE = import.meta.env.VITE_PATIENT_SERVICE_URL;
/** Full query + CRUD aligned with OptimizedPatientController (`api/patients/v2`) */
const V2 = `${BASE}/api/patients/v2`;

function mapSortByToApi(sortBy?: string): string {
  const map: Record<string, string> = {
    registrationDate: 'registration_date',
    registration_date: 'registration_date',
    fullName: 'first_name',
    firstName: 'first_name',
    lastName: 'last_name',
  };
  if (!sortBy) return 'registration_date';
  return map[sortBy] ?? sortBy;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientSearchParams {
  searchTerm?: string;
  uhid?: string;
  mobileNumber?: string;
  policyNumber?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePatientPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: string;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  whatsAppNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  allergiesSummary?: string;
  chronicConditions?: string;
  currentMedications?: string;
  disabilityStatus?: string;
  organDonor?: boolean;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactMobile?: string;
  insuranceProviderId?: string;
  policyNumber?: string;
  validFrom?: string;
  validTo?: string;

  /** Required for v1 registration; optional for other callers. */
  consentTermsAccepted?: boolean;
  consentPrivacyAccepted?: boolean;
  consentHealthDataSharing?: boolean;
}

export interface UpdatePatientPayload extends CreatePatientPayload {
  status?: string;
}

export interface CheckDuplicatePayload {
  mobileNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface QuickSearchPayload {
  searchTerm: string;
  maxResults?: number;
}

export interface MergePatientPayload {
  primaryPatientId: string;
  secondaryPatientId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const patientService = {

  // ── List / Search ──────────────────────────────────────────────────────────

  /** Paginated patient list with optional filters */
  getPatients: (page = 1, pageSize = 20) =>
    api
      .get(`${V2}/search`, {
        params: {
          pageNumber: page,
          pageSize,
          sortBy: 'registration_date',
          sortOrder: 'desc',
        },
      })
      .then((r) => r.data),

  /** Advanced search — maps UI filters to PatientSearchRequest (v2) */
  searchPatients: (filters: any) => {
    const f = filters as Record<string, any>;
    const searchTerm =
      (f.searchTerm as string | undefined) ||
      (f.searchText as string | undefined) ||
      [f.firstName, f.lastName].filter(Boolean).join(' ').trim() ||
      undefined;

    const params: Record<string, unknown> = {
      searchTerm: searchTerm || undefined,
      uhid: f.uhid,
      mobileNumber: f.mobileNumber,
      policyNumber: f.policyNumber,
      status: f.status,
      pageNumber: f.pageNumber ?? 1,
      pageSize: f.pageSize ?? 20,
      sortBy: mapSortByToApi(f.sortBy as string | undefined),
      sortOrder: f.sortOrder ?? 'desc',
    };

    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    return api.get(`${V2}/search`, { params: clean }).then((r) => r.data);
  },

  /** Typeahead quick search (UHID / name / mobile) */
  quickSearch: (searchTerm: string, maxResults = 10) =>
    api
      .get(`${BASE}/api/patients/quick-search`, { params: { q: searchTerm, maxResults } })
      .then((r) => r.data?.data ?? []),

  /** Recently registered patients */
  getRecentPatients: (limit = 10) =>
    api.get(`${BASE}/api/patients/recent`, { params: { limit } })
      .then(r => r.data?.data ?? []),

  // ── Single Patient ─────────────────────────────────────────────────────────

  /** Get patient by UUID */
  getPatientById: (id: string) =>
    api.get(`${BASE}/api/patients/${id}`).then(r => r.data),

  /** Get patient by UHID string */
  getPatientByUHID: (uhid: string) =>
    api.get(`${V2}/uhid/${encodeURIComponent(uhid)}`).then((r) => r.data),

  /** Get patient via registration endpoint (returns full registration response) */
  getPatientByUHIDRegistration: (uhid: string) =>
    api.get(`${BASE}/api/patients/v1/registration/uhid/${uhid}`).then(r => r.data),

  // ── Create / Update / Delete ───────────────────────────────────────────────

  /** Register new patient (full registration flow with duplicate check) */
  createPatient: (data: CreatePatientPayload) =>
    api.post(`${BASE}/api/patients/v1/registration/register`, data).then(r => r.data),

  /** Active insurance providers for tenant (master dropdown) */
  getInsuranceProviders: () =>
    api.get(`${BASE}/api/patients/insurance-providers`).then((r) => r.data?.data ?? []),

  /** Update existing patient */
  updatePatient: (id: string, data: UpdatePatientPayload) =>
    api.put(`${V2}/${id}`, data).then((r) => r.data),

  /** Soft-delete / deactivate patient */
  deletePatient: (id: string) =>
    api.post(`${V2}/${id}/deactivate`).then((r) => r.data),

  // ── Duplicate Detection ────────────────────────────────────────────────────

  /** Check for duplicates before registration */
  checkDuplicates: (data: CheckDuplicatePayload) =>
    api.post(`${BASE}/api/patients/v1/registration/check-duplicates`, data).then(r => r.data),

  /** Duplicate check (same contract as v1; uses v2 implementation) */
  checkDuplicatesLegacy: (data: CheckDuplicatePayload) =>
    api.post(`${V2}/check-duplicates`, data).then((r) => r.data),

  // ── Quick Search (POST) ────────────────────────────────────────────────────

  /** POST-based quick search (registration controller) */
  quickSearchPost: (data: QuickSearchPayload) =>
    api.post(`${BASE}/api/patients/v1/registration/quick-search`, data).then(r => r.data),

  // ── Merge ──────────────────────────────────────────────────────────────────

  /** Merge two patient records */
  mergePatients: (data: MergePatientPayload) =>
    api.post(`${V2}/merge`, data).then((r) => r.data),

  // ── Stats & Dashboard ──────────────────────────────────────────────────────

  /** Patient stats (total, active, today registrations, etc.) */
  getStats: () =>
    api.get(`${V2}/stats`).then((r) => r.data),

  /** Full dashboard summary (patients + encounters + billing) */
  getDashboardSummary: () =>
    api.get(`${BASE}/api/dashboard/summary`).then(r => r.data),

  // ── Visit Count ────────────────────────────────────────────────────────────

  /** Increment visit count for a patient (called by other services) */
  incrementVisitCount: (id: string) =>
    api.post(`${BASE}/api/patients-legacy/${id}/increment-visit`).then(r => r.data),

  // ── Health ─────────────────────────────────────────────────────────────────

  healthCheck: () =>
    api.get(`${BASE}/api/patients-legacy/health`).then(r => r.data),

  // -- Queue ------------------------------------------------------------------

  getQueue: (params?: { date?: string; doctorId?: string; status?: string }) =>
    api.get(`${BASE}/api/patients/queue`, { params }).then(r => r.data),

  getQueueStats: (date?: string) =>
    api.get(`${BASE}/api/patients/queue/stats`, { params: { date } }).then(r => r.data),

  addToQueue: (data: { patientId: string; departmentName?: string; doctorId?: string; doctorName?: string; priority?: string; notes?: string }) =>
    api.post(`${BASE}/api/patients/queue`, data).then(r => r.data),

  updateQueueStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch(`${BASE}/api/patients/queue/${id}/status`, { status, cancelReason }).then(r => r.data),

  // -- Renewal ----------------------------------------------------------------

  searchRenewal: (term: string) =>
    api.get(`${BASE}/api/patients/renewal/search`, { params: { term } }).then(r => r.data),

  renewPatient: (data: { patientId: string; renewalPeriodDays: number; renewalFee: number; discount: number; finalAmount: number; paymentMode: string; paymentReference?: string; notes?: string }) =>
    api.post(`${BASE}/api/patients/renewal`, data).then(r => r.data),

  getRenewalHistory: (patientId: string) =>
    api.get(`${BASE}/api/patients/${patientId}/renewal/history`).then(r => r.data),

  getExpiringPatients: (daysAhead = 30) =>
    api.get(`${BASE}/api/patients/renewal/expiring`, { params: { daysAhead } }).then(r => r.data),

  // -- Card Reprint -----------------------------------------------------------

  searchCardReprint: (term: string) =>
    api.get(`${BASE}/api/patients/card-reprint/search`, { params: { term } }).then(r => r.data),

  createCardReprint: (data: { patientId: string; reason: string; charges: number; paymentMode: string; paymentReference?: string; notes?: string }) =>
    api.post(`${BASE}/api/patients/card-reprint`, data).then(r => r.data),

  getReprintHistory: (patientId: string) =>
    api.get(`${BASE}/api/patients/card-reprint/${patientId}/history`).then(r => r.data),

  // -- Audit Log --------------------------------------------------------------

  getAuditLogs: (params?: { search?: string; action?: string; patientId?: string; dateFrom?: string; dateTo?: string; pageNumber?: number; pageSize?: number }) =>
    api.get(`${BASE}/api/patients/audit-logs`, { params }).then(r => r.data),

  // -- Export / Import --------------------------------------------------------

  exportPatients: (filters: { status?: string; patientType?: string; registrationType?: string; fromDate?: string; toDate?: string; format?: string }) =>
    api.post(`${BASE}/api/patients/export`, filters, { responseType: 'blob' }).then(r => r.data),

  importPatients: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`${BASE}/api/patients/import`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },

  downloadImportTemplate: () => `${BASE}/api/patients/import/template`,

  // -- Walk-in ----------------------------------------------------------------

  createWalkIn: (data: { firstName: string; lastName?: string; gender: string; age: number; mobileNumber?: string; emergencyContact?: string; chiefComplaint?: string }) =>
    api.post(`${BASE}/api/patients/walk-in`, data).then(r => r.data),

  // -- Patient Documents -------------------------------------------------------

  getDocuments: (patientId: string, params?: { category?: string; search?: string }) =>
    api.get(`${BASE}/api/patients/${patientId}/documents`, { params }).then(r => r.data),

  uploadDocuments: (patientId: string, formData: FormData) =>
    api.post(`${BASE}/api/patients/${patientId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  deleteDocument: (patientId: string, docId: string) =>
    api.delete(`${BASE}/api/patients/${patientId}/documents/${docId}`).then(r => r.data),

  downloadDocument: (patientId: string, docId: string) =>
    api.get(`${BASE}/api/patients/${patientId}/documents/${docId}/download`, { responseType: 'blob' }).then(r => r),

  // -- Appointment History -----------------------------------------------------

  getPatientAppointments: (patientId: string, params?: { status?: string; pageNumber?: number; pageSize?: number }) =>
    api.get(`${BASE}/api/patients/${patientId}/appointments`, { params }).then(r => r.data),

  // -- Billing History ---------------------------------------------------------

  getPatientBilling: (patientId: string, params?: { status?: string; pageNumber?: number; pageSize?: number }) =>
    api.get(`${BASE}/api/patients/${patientId}/billing`, { params }).then(r => r.data),

  // -- Patient Dashboard Stats (PatientDashboardStatsController)

  getPatientDashboardStats: () =>
    api.get(`${BASE}/api/patients/dashboard/stats`).then((r) => r.data?.data),
};

