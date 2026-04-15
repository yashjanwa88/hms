/**
 * Enhanced Laboratory Service
 * Comprehensive laboratory management service inspired by web-softclinic-app
 * Includes investigation management, result entry, and advanced lab workflows
 */

import api from '@/lib/api';
import { apiConfig, ApiRoutes } from '@/config/apiConfig';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface InvestigationModel {
  id: string;
  code: string;
  name: string;
  displayName: string;
  shortName?: string;
  description?: string;
  sectionTypeId?: string;
  sectionTypeName?: string;
  serviceTypeId?: string;
  serviceTypeName?: string;
  investigationType?: string;
  status?: string;
  isActive: boolean;
  isTenantWise?: boolean;
  parameters?: InvestigationParameter[];
  resultEntryConfiguration?: ResultEntryConfiguration[];
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface InvestigationParameter {
  id: string;
  investigationId: string;
  parameterName: string;
  displayName: string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  referenceRange?: string;
  displayOrder: number;
  resultType?: 'Numeric' | 'Text' | 'Coded' | 'Image';
  isMandatory: boolean;
  isActive: boolean;
}

export interface ResultEntryConfiguration {
  id: string;
  investigationId: string;
  parameterId: string;
  parameterName: string;
  resultType: string;
  isCalculated: boolean;
  formula?: string;
  displayOrder: number;
  subParameters?: ResultEntrySubParameter[];
}

export interface ResultEntrySubParameter {
  id: string;
  configurationId: string;
  name: string;
  displayName: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  displayOrder: number;
}

export interface SpecimenModel {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ContainerTypeModel {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  volume?: number;
  volumeUnit?: string;
  material?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdditiveFixativeModel {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  type?: string;
  volume?: number;
  volumeUnit?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StainingMethodModel {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface LabRequisition {
  id: string;
  requisitionNumber: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  referringDoctorId: string;
  referringDoctorName: string;
  requisitionDate: string;
  priority: 'Routine' | 'Urgent' | 'STAT';
  status: 'Pending' | 'SampleCollected' | 'Processing' | 'Completed' | 'Cancelled' | 'OnHold';
  specimenType?: string;
  containerType?: string;
  collectionDate?: string;
  collectionTime?: string;
  receivedDate?: string;
  receivedTime?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  items: LabRequisitionItem[];
  billingDetails?: RequisitionBillingDetails;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface LabRequisitionItem {
  id: string;
  requisitionId: string;
  investigationId: string;
  investigationName: string;
  investigationCode: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  sampleId?: string;
  sampleBarcode?: string;
  resultEnteredAt?: string;
  resultEnteredBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  results: LabResultEntry[];
  charges?: number;
  discount?: number;
  finalAmount?: number;
}

export interface LabResultEntry {
  id: string;
  itemId: string;
  parameterId: string;
  parameterName: string;
  value: string;
  unit: string;
  referenceRange?: string;
  referenceMin?: number;
  referenceMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  isAbnormal: boolean;
  isCritical: boolean;
  isVerified: boolean;
  comments?: string;
  enteredAt?: string;
  enteredBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface RequisitionBillingDetails {
  totalAmount: number;
  discount: number;
  discountReason?: string;
  finalAmount: number;
  taxAmount?: number;
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Refunded';
  paymentMode?: string;
  paymentReference?: string;
  billedAt?: string;
  billedBy?: string;
}

export interface LabFilter {
  searchTerm?: string;
  investigationCode?: string;
  investigationName?: string;
  sectionTypeId?: string;
  serviceTypeId?: string;
  status?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequisitionFilter {
  requisitionNumber?: string;
  patientId?: string;
  patientUHID?: string;
  patientName?: string;
  referringDoctorId?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Enhanced Laboratory Service ──────────────────────────────────────────────

export const enhancedLabService = {
  // ─── Investigation Management ───────────────────────────────────────────────

  /**
   * Get investigations with filtering
   * Similar to web-softclinic-app's geinvestigations
   */
  getInvestigations: async (filter: LabFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20,
      sortBy: filter.sortBy || 'name',
      sortOrder: filter.sortOrder || 'asc'
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations`, { params })
      .then(r => r.data);
  },

  /**
   * Get investigation by ID
   * Similar to web-softclinic-app's getinvestigation
   */
  getInvestigationById: async (id: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${id}`)
      .then(r => r.data);
  },

  /**
   * Create new investigation
   * Similar to web-softclinic-app's create method
   */
  createInvestigation: async (investigation: Partial<InvestigationModel>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations`, investigation)
      .then(r => r.data);
  },

  /**
   * Update investigation
   * Similar to web-softclinic-app's update method
   */
  updateInvestigation: async (id: string, investigation: Partial<InvestigationModel>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${id}`, investigation)
      .then(r => r.data);
  },

  /**
   * Delete investigation
   * Similar to web-softclinic-app's remove method
   */
  deleteInvestigation: async (id: string) => {
    return api.delete(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${id}`)
      .then(r => r.data);
  },

  /**
   * Search investigations by term
   * Similar to web-softclinic-app's BindInv method
   */
  searchInvestigations: async (term: string, serviceTypeId?: string) => {
    const params: any = { term };
    if (serviceTypeId) params.serviceTypeId = serviceTypeId;

    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/search`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get investigations by OData
   * Similar to web-softclinic-app's fetchOdata methods
   */
  getInvestigationsOData: async (filter?: string, select?: string) => {
    const params: any = {};
    if (filter) params.$filter = filter;
    if (select) params.$select = select;

    return api.get(`${apiConfig.laboratoryService.baseUrl}/odata/investigations`, { params })
      .then(r => r.data?.value || []);
  },

  // ─── Investigation Parameters ───────────────────────────────────────────────

  /**
   * Add parameter to investigation
   * Similar to web-softclinic-app's addParameter method
   */
  addInvestigationParameter: async (investigationId: string, parameter: Partial<InvestigationParameter>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${investigationId}/parameters`, parameter)
      .then(r => r.data);
  },

  /**
   * Update investigation parameter
   */
  updateInvestigationParameter: async (investigationId: string, parameterId: string, parameter: Partial<InvestigationParameter>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${investigationId}/parameters/${parameterId}`, parameter)
      .then(r => r.data);
  },

  /**
   * Delete investigation parameter
   */
  deleteInvestigationParameter: async (investigationId: string, parameterId: string) => {
    return api.delete(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${investigationId}/parameters/${parameterId}`)
      .then(r => r.data);
  },

  // ─── Result Entry Configuration ─────────────────────────────────────────────

  /**
   * Get result entry configuration for investigation
   * Similar to web-softclinic-app's fetchOdataResultEntryConfigurationDetails
   */
  getResultEntryConfiguration: async (investigationId: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${investigationId}/result-configuration`)
      .then(r => r.data);
  },

  /**
   * Save result entry configuration
   */
  saveResultEntryConfiguration: async (investigationId: string, configuration: ResultEntryConfiguration[]) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/investigations/${investigationId}/result-configuration`, configuration)
      .then(r => r.data);
  },

  // ─── Lab Masters ────────────────────────────────────────────────────────────

  /**
   * Get specimen types
   */
  getSpecimens: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/specimens`)
      .then(r => r.data?.data || []);
  },

  /**
   * Create specimen type
   */
  createSpecimen: async (specimen: Partial<SpecimenModel>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/specimens`, specimen)
      .then(r => r.data);
  },

  /**
   * Update specimen type
   */
  updateSpecimen: async (id: string, specimen: Partial<SpecimenModel>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/specimens/${id}`, specimen)
      .then(r => r.data);
  },

  /**
   * Get container types
   */
  getContainerTypes: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/containers`)
      .then(r => r.data?.data || []);
  },

  /**
   * Create container type
   */
  createContainerType: async (container: Partial<ContainerTypeModel>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/containers`, container)
      .then(r => r.data);
  },

  /**
   * Update container type
   */
  updateContainerType: async (id: string, container: Partial<ContainerTypeModel>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/containers/${id}`, container)
      .then(r => r.data);
  },

  /**
   * Get additive/fixative types
   */
  getAdditiveFixatives: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/additive-fixatives`)
      .then(r => r.data?.data || []);
  },

  /**
   * Create additive/fixative
   */
  createAdditiveFixative: async (item: Partial<AdditiveFixativeModel>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/additive-fixatives`, item)
      .then(r => r.data);
  },

  /**
   * Update additive/fixative
   */
  updateAdditiveFixative: async (id: string, item: Partial<AdditiveFixativeModel>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/additive-fixatives/${id}`, item)
      .then(r => r.data);
  },

  /**
   * Get staining methods
   */
  getStainingMethods: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/staining-methods`)
      .then(r => r.data?.data || []);
  },

  /**
   * Create staining method
   */
  createStainingMethod: async (method: Partial<StainingMethodModel>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/staining-methods`, method)
      .then(r => r.data);
  },

  /**
   * Update staining method
   */
  updateStainingMethod: async (id: string, method: Partial<StainingMethodModel>) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/masters/staining-methods/${id}`, method)
      .then(r => r.data);
  },

  // ─── Lab Requisition Management ─────────────────────────────────────────────

  /**
   * Create lab requisition
   * Similar to web-softclinic-app's createRequisition method
   */
  createRequisition: async (requisition: Partial<LabRequisition>) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions`, requisition)
      .then(r => r.data);
  },

  /**
   * Get requisitions with filtering
   */
  getRequisitions: async (filter: RequisitionFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions`, { params })
      .then(r => r.data);
  },

  /**
   * Get requisition by ID
   */
  getRequisitionById: async (id: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${id}`)
      .then(r => r.data);
  },

  /**
   * Get requisitions by patient ID
   */
  getRequisitionsByPatientId: async (patientId: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/patient/${patientId}`)
      .then(r => r.data);
  },

  /**
   * Update requisition status
   */
  updateRequisitionStatus: async (id: string, status: string, notes?: string) => {
    return api.patch(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${id}/status`, { status, notes })
      .then(r => r.data);
  },

  /**
   * Cancel requisition
   */
  cancelRequisition: async (id: string, reason: string) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${id}/cancel`, { reason })
      .then(r => r.data);
  },

  // ─── Sample Collection ──────────────────────────────────────────────────────

  /**
   * Collect sample
   * Similar to web-softclinic-app's collectSample method
   */
  collectSample: async (requisitionId: string, itemId: string, data: {
    sampleBarcode?: string;
    collectionDate?: string;
    collectionTime?: string;
    collectedBy?: string;
    notes?: string;
  }) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/collect`, data)
      .then(r => r.data);
  },

  /**
   * Receive sample in lab
   */
  receiveSample: async (requisitionId: string, itemId: string, data: {
    receivedDate?: string;
    receivedTime?: string;
    receivedBy?: string;
    sampleCondition?: string;
    notes?: string;
  }) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/receive`, data)
      .then(r => r.data);
  },

  // ─── Result Entry ───────────────────────────────────────────────────────────

  /**
   * Save lab results
   * Similar to web-softclinic-app's enterResults method
   */
  saveResults: async (requisitionId: string, itemId: string, results: LabResultEntry[]) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/results`, { results })
      .then(r => r.data);
  },

  /**
   * Update lab results
   */
  updateResults: async (requisitionId: string, itemId: string, results: LabResultEntry[]) => {
    return api.put(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/results`, { results })
      .then(r => r.data);
  },

  /**
   * Enter lab results
   * Similar to web-softclinic-app's enterResults method
   */
  enterResults: async (requisitionId: string, itemId: string, results: LabResultEntry[]) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/results`, { results })
      .then(r => r.data);
  },

  /**
   * Verify results
   */
  verifyResults: async (requisitionId: string, itemId: string, verifiedBy: string, comments?: string) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/items/${itemId}/verify`, { verifiedBy, comments })
      .then(r => r.data);
  },

  /**
   * Auto-verify results (if within reference range)
   */
  autoVerifyResults: async (requisitionId: string) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/auto-verify`)
      .then(r => r.data);
  },

  // ─── Lab Reports ────────────────────────────────────────────────────────────

  /**
   * Generate lab report
   * Similar to web-softclinic-app's generateReport method
   */
  generateReport: async (requisitionId: string, format: 'PDF' | 'HTML' | 'XML' = 'PDF') => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/report`, {
      params: { format },
      responseType: format === 'PDF' ? 'blob' : 'text'
    })
      .then(r => r.data);
  },

  /**
   * Reprint lab report
   */
  reprintReport: async (requisitionId: string, reason: string) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/reprint`, { reason })
      .then(r => r.data);
  },

  /**
   * Get report history
   */
  getReportHistory: async (requisitionId: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/requisitions/${requisitionId}/report-history`)
      .then(r => r.data);
  },

  // ─── Lab Statistics & Dashboard ─────────────────────────────────────────────

  /**
   * Get lab statistics
   */
  getLabStats: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/statistics`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get lab dashboard summary
   */
  getDashboardSummary: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/dashboard`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get turnaround time statistics
   */
  getTurnaroundTimeStats: async (dateFrom: string, dateTo: string, investigationId?: string) => {
    const params: any = { dateFrom, dateTo };
    if (investigationId) params.investigationId = investigationId;

    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/statistics/turnaround-time`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get workload statistics
   */
  getWorkloadStats: async (dateFrom: string, dateTo: string, groupBy?: 'day' | 'week' | 'month') => {
    const params: any = { dateFrom, dateTo };
    if (groupBy) params.groupBy = groupBy;

    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/statistics/workload`, { params })
      .then(r => r.data?.data || []);
  },

  // ─── Quality Control ────────────────────────────────────────────────────────

  /**
   * Record quality control data
   */
  recordQC: async (data: {
    investigationId: string;
    controlId: string;
    value: number;
    runDate: string;
    runTime: string;
    technicianId: string;
    notes?: string;
  }) => {
    return api.post(`${apiConfig.laboratoryService.baseUrl}/api/lab/quality-control`, data)
      .then(r => r.data);
  },

  /**
   * Get quality control history
   */
  getQCHistory: async (investigationId: string, dateFrom: string, dateTo: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/quality-control`, {
      params: { investigationId, dateFrom, dateTo }
    })
      .then(r => r.data?.data || []);
  },

  // ─── Enumerations ───────────────────────────────────────────────────────────

  /**
   * Get lab enums by type
   * Similar to web-softclinic-app's fetch_Enum method
   */
  getEnumByType: async (enumType: string) => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/enums/${enumType}`)
      .then(r => r.data?.data || []);
  },

  /**
   * Get all lab enums
   */
  getAllEnums: async () => {
    return api.get(`${apiConfig.laboratoryService.baseUrl}/api/lab/enums`)
      .then(r => r.data?.data || {});
  }
};

export default enhancedLabService;