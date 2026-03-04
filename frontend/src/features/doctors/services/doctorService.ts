import api from '@/lib/api';

const DOCTOR_SERVICE = import.meta.env.VITE_DOCTOR_SERVICE_URL;

export const doctorService = {
  getDoctors: async (search?: string) => {
    const response = await api.get(`${DOCTOR_SERVICE}/api/doctor/v1/doctors`, {
      params: { search },
    });
    return response.data;
  },

  createDoctor: async (data: any) => {
    const response = await api.post(`${DOCTOR_SERVICE}/api/doctor/v1/doctors`, data);
    return response.data;
  },

  getDoctorById: async (id: string) => {
    const response = await api.get(`${DOCTOR_SERVICE}/api/doctor/v1/doctors/${id}`);
    return response.data;
  },

  updateDoctor: async (id: string, data: any) => {
    const response = await api.put(`${DOCTOR_SERVICE}/api/doctor/v1/doctors/${id}`, data);
    return response.data;
  },
};
