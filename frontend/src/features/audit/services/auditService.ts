import axios from 'axios';

const API_BASE_URL = 'http://localhost:5011/api/audit';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  const userId = localStorage.getItem('userId');
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': tenantId || '',
    'X-User-Id': userId || '',
    'Content-Type': 'application/json',
  };
};

export const auditService = {
  searchLogs: async (params: any) => {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getLogById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
