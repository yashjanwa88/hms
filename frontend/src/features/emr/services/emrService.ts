import api from '@/lib/api';
import { ApiResponse, Encounter, Vital, Diagnosis, ClinicalNote } from '@/types';

const EMR_SERVICE = import.meta.env.VITE_EMR_SERVICE_URL;

export const emrService = {
  createEncounter: async (data: any) => {
    const response = await api.post<ApiResponse<Encounter>>(
      `${EMR_SERVICE}/api/emr/encounters`,
      data
    );
    return response.data;
  },

  getEncounter: async (id: string) => {
    const response = await api.get<ApiResponse<Encounter>>(
      `${EMR_SERVICE}/api/emr/encounters/${id}`
    );
    return response.data;
  },

  getPatientEncounters: async (patientId: string) => {
    const response = await api.get<ApiResponse<Encounter[]>>(
      `${EMR_SERVICE}/api/emr/encounters/by-patient/${patientId}`
    );
    return response.data;
  },

  closeEncounter: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(
      `${EMR_SERVICE}/api/emr/encounters/${id}/close`
    );
    return response.data;
  },

  addVital: async (encounterId: string, data: any) => {
    const response = await api.post<ApiResponse<Vital>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/vitals`,
      data
    );
    return response.data;
  },

  getVitals: async (encounterId: string) => {
    const response = await api.get<ApiResponse<Vital[]>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/vitals`
    );
    return response.data;
  },

  addDiagnosis: async (encounterId: string, data: any) => {
    const response = await api.post<ApiResponse<Diagnosis>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/diagnosis`,
      data
    );
    return response.data;
  },

  getDiagnoses: async (encounterId: string) => {
    const response = await api.get<ApiResponse<Diagnosis[]>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/diagnosis`
    );
    return response.data;
  },

  addClinicalNote: async (encounterId: string, data: any) => {
    const response = await api.post<ApiResponse<ClinicalNote>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/notes`,
      data
    );
    return response.data;
  },

  getClinicalNotes: async (encounterId: string) => {
    const response = await api.get<ApiResponse<ClinicalNote[]>>(
      `${EMR_SERVICE}/api/emr/encounters/${encounterId}/notes`
    );
    return response.data;
  },
};
