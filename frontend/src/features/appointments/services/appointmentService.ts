import api from '@/lib/api';

const APPOINTMENT_SERVICE = import.meta.env.VITE_APPOINTMENT_SERVICE_URL;

export const appointmentService = {
  getAppointments: async (params?: any) => {
    const response = await api.get(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments/search`, { params });
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await api.post(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments`, data);
    return response.data;
  },

  // New booking endpoints
  getDoctorsForBooking: async (specialization?: string) => {
    const params = specialization ? { specialization } : {};
    const response = await api.get(`${APPOINTMENT_SERVICE}/api/appointment/v1/booking/doctors`, { params });
    return response.data;
  },

  validateDate: async (doctorId: string, date: string) => {
    const response = await api.get(`${APPOINTMENT_SERVICE}/api/appointment/v1/booking/validate-date/${doctorId}/${date}`);
    return response.data;
  },

  getAvailableSlots: async (doctorId: string, date: string) => {
    const response = await api.get(`${APPOINTMENT_SERVICE}/api/appointment/v1/booking/available-slots/${doctorId}/${date}`);
    return response.data;
  },

  bookAppointment: async (data: any) => {
    const response = await api.post(`${APPOINTMENT_SERVICE}/api/appointment/v1/booking/book`, data);
    return response.data;
  },

  cancelAppointment: async (id: string, reason: string = '') => {
    const response = await api.put(`${APPOINTMENT_SERVICE}/api/appointment/v1/appointments/${id}/cancel`, {
      cancellationReason: reason
    });
    return response.data;
  },
};
