import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/identity/v1';

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

export const userService = {
  registerUser: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getRoles: async () => {
    const response = await axios.get(`${API_BASE_URL}/roles`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createRole: async (name: string) => {
    const response = await axios.post(`${API_BASE_URL}/roles`, 
      { name }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getPermissions: async () => {
    const response = await axios.get(`${API_BASE_URL}/permissions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getRolePermissions: async (roleId: string) => {
    const response = await axios.get(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}/permissions`, 
      { permissionIds }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};
