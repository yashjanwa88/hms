import api from '@/lib/api';

export interface Visit {
  id: string;
  visitNumber: string;
  patientId: string;
  patientUHID: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  visitType: 'OPD' | 'Emergency' | 'IPD';
  priority: 'Normal' | 'Urgent' | 'Emergency';
  status: 'Waiting' | 'InProgress' | 'Completed' | 'Cancelled';
  visitDateTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  chiefComplaint?: string;
  symptoms?: string;
  vitalSigns?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  instructions?: string;
  followUpDate?: string;
  isEmergency: boolean;
  isIPDConverted: boolean;
  ipdAdmissionId?: string;
  consultationFee?: number;
  paymentStatus?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateVisitRequest {
  patientId: string;
  patientUHID: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  visitType: 'OPD' | 'Emergency' | 'IPD';
  priority?: 'Normal' | 'Urgent' | 'Emergency';
  chiefComplaint?: string;
  symptoms?: string;
  isEmergency: boolean;
  consultationFee?: number;
}

export interface EmergencyVisitRequest {
  patientId: string;
  patientUHID: string;
  doctorId: string;
  doctorName: string;
  chiefComplaint: string;
  symptoms: string;
  priority?: 'Emergency';
  vitalSigns?: string;
}

export interface UpdateVisitRequest {
  chiefComplaint?: string;
  symptoms?: string;
  vitalSigns?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  instructions?: string;
  followUpDate?: string;
  notes?: string;
}

export interface VisitSearchRequest {
  visitNumber?: string;
  patientUHID?: string;
  patientId?: string;
  doctorId?: string;
  department?: string;
  visitType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  isEmergency?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface VisitTimeline {
  id: string;
  eventType: string;
  eventDescription: string;
  eventDateTime: string;
  performedByName?: string;
  eventData?: string;
}

export interface VisitStats {
  totalVisits: number;
  todayVisits: number;
  activeVisits: number;
  emergencyVisits: number;
  ipdConversions: number;
  completedVisits: number;
}

const VISIT_SERVICE = import.meta.env.VITE_VISIT_SERVICE_URL || '/api/visit/v1';

export const visitService = {
  createVisit: async (data: CreateVisitRequest) => {
    const response = await api.post(`${VISIT_SERVICE}/api/visits`, data);
    return response.data;
  },

  createEmergencyVisit: async (data: EmergencyVisitRequest) => {
    const response = await api.post(`${VISIT_SERVICE}/api/visits/emergency`, data);
    return response.data;
  },

  getVisit: async (id: string) => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/${id}`);
    return response.data;
  },

  getVisitByNumber: async (visitNumber: string) => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/number/${visitNumber}`);
    return response.data;
  },

  updateVisit: async (id: string, data: UpdateVisitRequest) => {
    const response = await api.put(`${VISIT_SERVICE}/api/visits/${id}`, data);
    return response.data;
  },

  checkInVisit: async (id: string) => {
    const response = await api.post(`${VISIT_SERVICE}/api/visits/${id}/checkin`);
    return response.data;
  },

  checkOutVisit: async (id: string) => {
    const response = await api.post(`${VISIT_SERVICE}/api/visits/${id}/checkout`);
    return response.data;
  },

  searchVisits: async (params: VisitSearchRequest) => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/search`, { params });
    return response.data;
  },

  getPatientVisitHistory: async (patientId: string) => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/patient/${patientId}/history`);
    return response.data;
  },

  getActiveVisits: async () => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/active`);
    return response.data;
  },

  getVisitTimeline: async (visitId: string) => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/${visitId}/timeline`);
    return response.data;
  },

  getVisitStats: async () => {
    const response = await api.get(`${VISIT_SERVICE}/api/visits/stats`);
    return response.data;
  },

  convertToIPD: async (visitId: string, reason: string, wardType?: string, roomNumber?: string) => {
    const response = await api.post(`${VISIT_SERVICE}/api/visits/convert-to-ipd`, {
      visitId,
      reason,
      wardType,
      roomNumber,
      admissionDateTime: new Date().toISOString()
    });
    return response.data;
  }
};