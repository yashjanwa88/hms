import api from '@/lib/api';

const BILLING_SERVICE = import.meta.env.VITE_BILLING_SERVICE_URL;

export const billingService = {
  createInvoice: async (data: any) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/invoices`, data);
    return response.data;
  },

  getInvoiceById: async (id: string) => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/invoices/${id}`);
    return response.data;
  },

  getInvoiceByEncounter: async (encounterId: string) => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/invoices/by-encounter/${encounterId}`);
    return response.data;
  },

  addInvoiceItem: async (invoiceId: string, data: any) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/invoices/${invoiceId}/items`, data);
    return response.data;
  },

  recordPayment: async (invoiceId: string, data: any) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/invoices/${invoiceId}/payment`, data);
    return response.data;
  },

  processRefund: async (invoiceId: string, data: any) => {
    const response = await api.post(`${BILLING_SERVICE}/api/billing/invoices/${invoiceId}/refund`, data);
    return response.data;
  },

  searchInvoices: async (params: any) => {
    const response = await api.get(`${BILLING_SERVICE}/api/billing/invoices/search`, { params });
    return response.data;
  },
};
