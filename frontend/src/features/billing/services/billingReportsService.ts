import api from '@/lib/api';

const BILLING_SERVICE = import.meta.env.VITE_BILLING_SERVICE_URL;

export const billingReportsService = {
  getARAgingReport: async () => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/v1/reports/ar-aging`);
    return response.data;
  },

  getARAgingSummary: async () => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/v1/reports/ar-aging/summary`);
    return response.data;
  },

  getPendingRefunds: async () => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/v1/refunds/pending`);
    return response.data;
  },

  approveRefund: async (id: string, comments: string) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/v1/refunds/${id}/approve`, { comments });
    return response.data;
  },

  rejectRefund: async (id: string, comments: string) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/v1/refunds/${id}/reject`, { comments });
    return response.data;
  },
};
