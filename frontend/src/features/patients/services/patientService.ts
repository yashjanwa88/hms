import api from '@/lib/api';

const PATIENT_SERVICE = import.meta.env.VITE_PATIENT_SERVICE_URL;

export const patientService = {
  getPatients: async (page: number, pageSize: number) => {
    const response = await api.get(
      `${PATIENT_SERVICE}/api/patients/search?pageNumber=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getPatientById: async (id: string) => {
    const response = await api.get(`${PATIENT_SERVICE}/api/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: any) => {
    const response = await api.post(
      `${PATIENT_SERVICE}/api/patients`,
      data,
      { headers: { 'X-Tenant-Code': 'HOSP' } }
    );
    return response.data;
  },
  updatePatient: async (id: string, data: any) => {
    const response = await api.put(
      `${PATIENT_SERVICE}/api/patients/${id}`,
      data
    );
    return response.data;
  },
};
