import api from '@/lib/api';

const ANALYTICS_SERVICE = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:5012';
const BASE = `${ANALYTICS_SERVICE}/api/analytics`;

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get(`${BASE}/dashboard`);
    return response.data;
  },
  getDailyRevenue: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/revenue/daily`, { params: { fromDate, toDate } });
    return response.data;
  },
  getMonthlyRevenue: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/revenue/monthly`, { params: { fromDate, toDate } });
    return response.data;
  },
  getYearlyRevenue: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/revenue/yearly`, { params: { fromDate, toDate } });
    return response.data;
  },
  getDoctorPerformance: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/doctors/performance`, { params: { fromDate, toDate } });
    return response.data;
  },
  getInsuranceSummary: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/insurance/summary`, { params: { fromDate, toDate } });
    return response.data;
  },
  getInsuranceApprovalRate: async () => {
    const response = await api.get(`${BASE}/insurance/approval-rate`);
    return response.data;
  },
  getPatientSummary: async (fromDate?: string, toDate?: string) => {
    const response = await api.get(`${BASE}/patients/summary`, { params: { fromDate, toDate } });
    return response.data;
  },
};
