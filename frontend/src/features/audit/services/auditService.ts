import api from '@/lib/api';

const AUDIT_BASE = `${import.meta.env.VITE_AUDIT_SERVICE_URL ?? 'http://localhost:5011'}/api/audit`;

export const auditService = {
  searchLogs: async (params: any) => {
    const response = await api.get(`${AUDIT_BASE}/search`, { params });
    return response.data;
  },

  getLogById: async (id: string) => {
    const response = await api.get(`${AUDIT_BASE}/${id}`);
    return response.data;
  },
};
