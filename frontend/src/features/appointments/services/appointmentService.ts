import api from '@/lib/api';

const APPOINTMENT_SERVICE = import.meta.env.VITE_APPOINTMENT_SERVICE_URL;

export const appointmentService = {
  getAppointments: async () => {
    const response = await api.get(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments`);
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await api.post(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments`, data);
    return response.data;
  },

  cancelAppointment: async (id: string) => {
    const response = await api.put(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments/${id}/cancel`, {});
    return response.data;
  },
};
