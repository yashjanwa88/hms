import api from '@/lib/api';

const PHARMACY_SERVICE = import.meta.env.VITE_PHARMACY_SERVICE_URL || 'http://localhost:5006';

export const pharmacyService = {
  // Drug Management
  createDrug: async (data: any) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/drugs`, data);
    return response.data;
  },

  getDrugs: async () => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/drugs`);
    return response.data;
  },

  getDrugById: async (id: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/drugs/${id}`);
    return response.data;
  },

  updateDrug: async (id: string, data: any) => {
    const response = await api.put(`${PHARMACY_SERVICE}/api/pharmacy/drugs/${id}`, data);
    return response.data;
  },

  // Batch Management
  createBatch: async (data: any) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/batches`, data);
    return response.data;
  },

  getBatchesByDrugId: async (drugId: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/batches/by-drug/${drugId}`);
    return response.data;
  },

  // Prescription Management
  createPrescription: async (data: any) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions`, data);
    return response.data;
  },

  getPrescriptionById: async (id: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  getPrescriptionsByPatientId: async (patientId: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/by-patient/${patientId}`);
    return response.data;
  },

  verifyPrescription: async (id: string) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/${id}/verify`, {});
    return response.data;
  },

  dispensePrescription: async (id: string) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/${id}/dispense`, {});
    return response.data;
  },

  cancelPrescription: async (id: string, reason: string) => {
    const response = await api.post(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/${id}/cancel`, {
      cancellationReason: reason
    });
    return response.data;
  },

  getPrescriptionReceipt: async (id: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/prescriptions/${id}/receipt`);
    return response.data;
  },

  // Reports
  getDailySalesReport: async (date: string) => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/reports/daily-sales`, {
      params: { date }
    });
    return response.data;
  },

  getLowStockReport: async () => {
    const response = await api.get(`${PHARMACY_SERVICE}/api/pharmacy/reports/low-stock`);
    return response.data;
  },
};
