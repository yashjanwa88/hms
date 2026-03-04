import axios from 'axios';

const API_BASE_URL = 'http://localhost:5009/api/encounters';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  const userId = localStorage.getItem('userId');
  
  console.log('Auth headers:', { token: token ? 'exists' : 'null', tenantId, userId });
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': tenantId || '',
    'X-User-Id': userId || '',
    'Content-Type': 'application/json',
  };
};

export const encounterService = {
  createEncounter: async (data: any) => {
    const response = await axios.post(API_BASE_URL, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getEncounterById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  searchEncounters: async (params: any) => {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getEncounterCount: async (patientId: string) => {
    const response = await axios.get(`${API_BASE_URL}/count`, {
      params: { patientId },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await axios.put(`${API_BASE_URL}/${id}/status`, 
      { status },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};
