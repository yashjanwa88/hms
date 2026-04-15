import api from '@/lib/api';

const LAB_SERVICE = import.meta.env.VITE_LABORATORY_SERVICE_URL || 'http://localhost:5007';
const BASE = `${LAB_SERVICE}/api/lab`;

export const labService = {
  // Tests Master
  createLabTest: (data: any) => api.post(`${BASE}/tests`, data).then(r => r.data),
  getLabTests: () => api.get(`${BASE}/tests`).then(r => r.data),
  getLabTestById: (id: string) => api.get(`${BASE}/tests/${id}`).then(r => r.data),

  // Orders
  createLabOrder: (data: any) => api.post(`${BASE}/orders`, data).then(r => r.data),
  getLabOrders: (params?: any) => api.get(`${BASE}/orders`, { params }).then(r => r.data),
  getLabOrderById: (id: string) => api.get(`${BASE}/orders/${id}`).then(r => r.data),
  getLabOrdersByPatientId: (patientId: string) => api.get(`${BASE}/orders/by-patient/${patientId}`).then(r => r.data),

  // Sample Collection
  collectSample: (orderId: string, data: any) =>
    api.post(`${BASE}/orders/${orderId}/collect-sample`, data).then(r => r.data),

  // Result Entry
  enterLabResults: (orderId: string, itemId: string, data: any) =>
    api.post(`${BASE}/orders/${orderId}/items/${itemId}/results`, data).then(r => r.data),

  // Complete / Cancel
  completeLabOrder: (orderId: string) =>
    api.post(`${BASE}/orders/${orderId}/complete`, {}).then(r => r.data),
  cancelLabOrder: (orderId: string, data: { cancellationReason: string }) =>
    api.post(`${BASE}/orders/${orderId}/cancel`, data).then(r => r.data),

  // Report
  getLabReport: (orderId: string) => api.get(`${BASE}/orders/${orderId}/report`).then(r => r.data),
};
