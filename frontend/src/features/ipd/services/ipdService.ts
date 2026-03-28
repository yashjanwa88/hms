import api from '@/lib/api';

const BASE = import.meta.env.VITE_IPD_SERVICE_URL || 'http://localhost:5013';
const API_URL = `${BASE}/api/ipd/v1`;

export interface Ward {
  id: string;
  name: string;
  type: string;
  floorNumber: number;
  basePricePerDay: number;
  createdAt: string;
}

export interface Bed {
  id: string;
  wardId: string;
  bedNumber: string;
  status: string;
}

export interface Admission {
  id: string;
  patientId: string;
  primaryDoctorId: string;
  wardId: string;
  bedId: string;
  admissionNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  reasonForAdmission: string;
  status: string;
}

export const ipdService = {
  getWards: async (): Promise<Ward[]> => {
    const response = await api.get(`${API_URL}/wards`);
    return response.data.data;
  },

  createWard: async (wardData: Partial<Ward>): Promise<Ward> => {
    const response = await api.post(`${API_URL}/wards`, wardData);
    return response.data.data;
  },

  getBedsByWard: async (wardId: string): Promise<Bed[]> => {
    const response = await api.get(`${API_URL}/wards/${wardId}/beds`);
    return response.data.data;
  },

  createBed: async (bedData: Partial<Bed>): Promise<Bed> => {
    const response = await api.post(`${API_URL}/beds`, bedData);
    return response.data.data;
  },

  getActiveAdmissions: async (): Promise<Admission[]> => {
    const response = await api.get(`${API_URL}/admissions/active`);
    return response.data.data;
  },

  admitPatient: async (admissionData: any): Promise<Admission> => {
    const response = await api.post(`${API_URL}/admissions`, admissionData);
    return response.data.data;
  },

  dischargePatient: async (id: string, data: any): Promise<Admission> => {
    const response = await api.post(`${API_URL}/admissions/${id}/discharge`, data);
    return response.data.data;
  }
};
