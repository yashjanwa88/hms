/**
 * Enhanced Patient Service
 * Comprehensive patient management service inspired by web-softclinic-app
 * Includes advanced search, filtering, and patient registration workflows
 */

import api from '@/lib/api';
import { apiConfig, ApiRoutes } from '@/config/apiConfig';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface PatientPersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other' | 'Transgender';
  dateOfBirth: string;
  age?: number;
  bloodGroup?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  religion?: string;
  occupation?: string;
  education?: string;
  income?: string;
  nationality?: string;
  ethnicity?: string;
  aadharNumber?: string;
  panNumber?: string;
  voterId?: string;
}

export interface PatientContactDetails {
  countryCode?: string;
  mobileNo: string;
  alternateMobile?: string;
  emailId?: string;
  whatsAppNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  area?: string;
  landmark?: string;
}

export interface PatientEmergencyContact {
  name: string;
  relation?: string;
  mobileNo: string;
  alternateMobile?: string;
  emailId?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface PatientInsuranceDetails {
  insuranceProviderId?: string;
  insuranceProviderName?: string;
  policyNumber?: string;
  policyHolderName?: string;
  validFrom?: string;
  validTo?: string;
  sumInsured?: number;
  tpaName?: string;
  tpaNumber?: string;
  groupCode?: string;
  memberId?: string;
}

export interface PatientPersonalIdentification {
  idType?: string;
  idNumber?: string;
  issuedBy?: string;
  validFrom?: string;
  validTo?: string;
}

export interface PatientBiometricDetails {
  photographUrl?: string;
  photographData?: string;
  signatureUrl?: string;
  signatureData?: string;
  fingerPrintData?: string;
  fingerPrintType?: string;
}

export interface PatientReferralDetails {
  referredBy?: string;
  referralType?: 'Self' | 'Doctor' | 'Hospital' | 'Insurance' | 'Other';
  referralHospital?: string;
  referralDoctor?: string;
  referralNotes?: string;
  referralDate?: string;
}

export interface PatientFertilityInformation {
  isFertile?: boolean;
  lastMenstrualPeriod?: string;
  expectedDeliveryDate?: string;
  numberOfPregnancies?: number;
  numberOfLiveBirths?: number;
  numberOfStillBirths?: number;
  highRiskPregnancy?: boolean;
  bloodTypeRhFactor?: string;
}

export interface PatientDeathDetails {
  dateOfDeath?: string;
  causeOfDeath?: string;
  placeOfDeath?: string;
  deathCertificateNumber?: string;
  autopsyPerformed?: boolean;
  autopsyReportNumber?: string;
}

export interface PatientQueueDetails {
  queueNumber?: string;
  tokenNumber?: number;
  departmentId?: string;
  departmentName?: string;
  doctorId?: string;
  doctorName?: string;
  priority?: 'Normal' | 'Urgent' | 'Emergency';
  status?: 'Waiting' | 'InConsultation' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface PatientRegistration {
  patientId?: string;
  uhid?: string;
  crNumber?: string;
  registrationNumber?: string;
  patientType?: string;
  patientTypeId?: string;
  registrationType?: string;
  registrationTypeId?: string;
  facilityId?: string;
  facilityName?: string;
  registrationDate?: string;
  registrationFee?: number;
  discount?: number;
  finalAmount?: number;
  paymentMode?: string;
  paymentReference?: string;
  status?: 'Active' | 'Inactive' | 'Expired';
  validFrom?: string;
  validTo?: string;
  renewalRequired?: boolean;

  // Nested objects
  personalInfo?: PatientPersonalInfo;
  contactDetails?: PatientContactDetails;
  emergencyContact?: PatientEmergencyContact;
  insuranceDetails?: PatientInsuranceDetails;
  personalIdentification?: PatientPersonalIdentification;
  biometricDetails?: PatientBiometricDetails;
  referralDetails?: PatientReferralDetails;
  fertilityInformation?: PatientFertilityInformation;
  deathDetails?: PatientDeathDetails;
  queueDetails?: PatientQueueDetails;

  // Metadata
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  isDeleted?: boolean;
  tenantId?: string;
}

export interface PatientSearchModel {
  patientId: string;
  uhid: string;
  crNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  age?: number;
  dateOfBirth?: string;
  mobileNo: string;
  address?: string;
  city?: string;
  patientType?: string;
  registrationType?: string;
  status?: string;
  photographUrl?: string;
  lastVisitDate?: string;
  totalVisits?: number;
}

export interface PatientFilter {
  searchTerm?: string;
  uhid?: string;
  crNumber?: string;
  mobileNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  patientType?: string;
  patientTypeId?: string;
  registrationType?: string;
  registrationTypeId?: string;
  city?: string;
  state?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  facilityId?: string;
  insuranceProviderId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientPrefix {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  isDefault: boolean;
}

export interface PatientType {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  registrationFee?: number;
  validDays?: number;
}

export interface RegistrationType {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  patientTypes?: PatientType[];
  registrationFee?: number;
  validDays?: number;
  features?: RegistrationFeature[];
}

export interface RegistrationFeature {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

export interface PatientRegistrationFee {
  id: string;
  patientTypeId?: string;
  registrationTypeId?: string;
  facilityId?: string;
  feeAmount: number;
  discountPercentage?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

// ─── Enhanced Service ─────────────────────────────────────────────────────────

export const enhancedPatientService = {
  // ─── Patient Search & Retrieval ─────────────────────────────────────────────

  /**
   * Advanced patient search with multiple filters
   * Similar to web-softclinic-app's patientinfo-search component
   */
  searchPatients: async (filter: PatientFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20,
      sortBy: filter.sortBy || 'registrationDate',
      sortOrder: filter.sortOrder || 'desc'
    };

    // Remove empty/null values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.search}`, { params })
      .then(r => r.data);
  },

  /**
   * Quick patient search by CR Number
   * Similar to web-softclinic-app's getPatientregistrationcrno
   */
  getPatientByCrNumber: async (crNumber: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/v1/registration/uhid/${encodeURIComponent(crNumber)}`)
      .then(r => r.data);
  },

  /**
   * Get patient by UHID
   */
  getPatientByUHID: async (uhid: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/v2/uhid/${encodeURIComponent(uhid)}`)
      .then(r => r.data);
  },

  /**
   * Get patient by ID
   */
  getPatientById: async (patientId: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/${patientId}`)
      .then(r => r.data);
  },

  /**
   * Quick search for dropdowns/autocomplete
   * Similar to web-softclinic-app's search method
   */
  quickSearch: async (term: string, patientType?: string, admissionStatus?: string) => {
    const params: any = { filter: term };
    if (patientType) params.patientType = patientType;
    if (admissionStatus) params.admissionStatus = admissionStatus;

    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/quick-search`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get patient list with facility-wise filtering
   * Similar to web-softclinic-app's getPatientregistrationsFacilityWIse
   */
  getPatientsByFacility: async (facilityId: string, filter: PatientFilter) => {
    const params = {
      ...filter,
      facilityId
    };
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/v2/search`, { params })
      .then(r => r.data);
  },

  // ─── Patient Registration ───────────────────────────────────────────────────

  /**
   * Register new patient with full details
   */
  registerPatient: async (registration: PatientRegistration) => {
    return api.post(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.registration}/register`, registration)
      .then(r => r.data);
  },

  /**
   * Check for duplicate patients before registration
   */
  checkDuplicates: async (data: {
    mobileNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) => {
    return api.post(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.registration}/check-duplicates`, data)
      .then(r => r.data);
  },

  /**
   * Update patient information
   */
  updatePatient: async (patientId: string, updates: Partial<PatientRegistration>) => {
    return api.put(`${apiConfig.patientService.baseUrl}/api/patients/v2/${patientId}`, updates)
      .then(r => r.data);
  },

  /**
   * Deactivate patient
   */
  deactivatePatient: async (patientId: string) => {
    return api.post(`${apiConfig.patientService.baseUrl}/api/patients/v2/${patientId}/deactivate`)
      .then(r => r.data);
  },

  /**
   * Merge two patient records
   */
  mergePatients: async (primaryPatientId: string, secondaryPatientId: string) => {
    return api.post(`${apiConfig.patientService.baseUrl}/api/patients/v2/merge`, {
      primaryPatientId,
      secondaryPatientId
    })
      .then(r => r.data);
  },

  // ─── Masters & Dropdowns ────────────────────────────────────────────────────

  /**
   * Get patient types list
   * Similar to web-softclinic-app's getpattypelist
   */
  getPatientTypes: async (facilityId?: string) => {
    const params = facilityId ? { facilityId } : {};
    return api.get(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.masters.types}`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get registration types list
   * Similar to web-softclinic-app's getregtypelist
   */
  getRegistrationTypes: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.masters.registrationTypes}`)
      .then(r => r.data?.data || []);
  },

  /**
   * Get patient prefixes list
   */
  getPatientPrefixes: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}${ApiRoutes.patient.masters.prefixes}`)
      .then(r => r.data?.data || []);
  },

  /**
   * Get applicable visit types
   * Similar to web-softclinic-app's getapplicableVisitTypeList
   */
  getApplicableVisitTypes: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/registrationtype/applicableVisitType`)
      .then(r => r.data?.data || []);
  },

  // ─── Common Master Data ─────────────────────────────────────────────────────

  /**
   * Get countries list
   * Similar to web-softclinic-app's getCountryByID
   */
  getCountries: async (filter?: string) => {
    const params = filter ? { filter } : {};
    return api.get(`${apiConfig.patientService.baseUrl}/odata/countries`, { params })
      .then(r => r.data?.value || []);
  },

  /**
   * Get states list
   */
  getStates: async (countryId?: string) => {
    const params = countryId ? { filter: `countryId eq ${countryId}` } : {};
    return api.get(`${apiConfig.patientService.baseUrl}/odata/states`, { params })
      .then(r => r.data?.value || []);
  },

  /**
   * Get cities list
   */
  getCities: async (stateId?: string) => {
    const params = stateId ? { filter: `stateId eq ${stateId}` } : {};
    return api.get(`${apiConfig.patientService.baseUrl}/odata/cities`, { params })
      .then(r => r.data?.value || []);
  },

  // ─── Enumerations ───────────────────────────────────────────────────────────

  /**
   * Get enum values by type
   * Similar to web-softclinic-app's fetch_Enum_Gender
   */
  getEnumByType: async (enumType: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/common/enums/${enumType}`)
      .then(r => r.data?.data || []);
  },

  /**
   * Get all enums
   */
  getAllEnums: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/common/enums`)
      .then(r => r.data?.data || {});
  },

  // ─── Patient Appointments ───────────────────────────────────────────────────

  /**
   * Get appointment list by patient ID
   * Similar to web-softclinic-app's getAppointmentListByPatientID
   */
  getPatientAppointments: async (patientId: string, visitType?: string, doctorId?: string) => {
    const params: any = {};
    if (visitType) params.visitType = visitType;
    if (doctorId) params.doctorId = doctorId;

    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/${patientId}/appointments`, { params })
      .then(r => r.data?.data || []);
  },

  // ─── Patient Statistics ─────────────────────────────────────────────────────

  /**
   * Get patient statistics
   */
  getPatientStats: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/v2/stats`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get patient dashboard summary
   */
  getDashboardSummary: async () => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/dashboard/summary`)
      .then(r => r.data?.data || {});
  },

  // ─── Patient Documents ──────────────────────────────────────────────────────

  /**
   * Get patient documents
   */
  getPatientDocuments: async (patientId: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/${patientId}/documents`)
      .then(r => r.data?.data || []);
  },

  /**
   * Upload patient document
   */
  uploadPatientDocument: async (patientId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    return api.post(`${apiConfig.patientService.baseUrl}/api/patients/${patientId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(r => r.data);
  },

  // ─── Patient Reports ────────────────────────────────────────────────────────

  /**
   * Generate patient registration report
   */
  generatePatientReport: async (patientId: string, reportType: string) => {
    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/${patientId}/reports/${reportType}`, {
      responseType: 'blob'
    })
      .then(r => r.data);
  },

  /**
   * Get patient registration statistics
   */
  getRegistrationStatistics: async (dateFrom: string, dateTo: string, groupBy?: string) => {
    const params: any = { dateFrom, dateTo };
    if (groupBy) params.groupBy = groupBy;

    return api.get(`${apiConfig.patientService.baseUrl}/api/patients/statistics/registrations`, { params })
      .then(r => r.data?.data || []);
  }
};

export default enhancedPatientService;