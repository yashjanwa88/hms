import axios from 'axios';
import type { QueueToken, QueueDisplay, QueueStatistics, CreateQueueTokenRequest } from '@/types';

const getServiceUrl = () => {
  const url = import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 
              process.env.REACT_APP_APPOINTMENT_SERVICE_URL || 
              'http://localhost:5004';
  return url;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  const userId = localStorage.getItem('userId');
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id': tenantId || '',
    'X-User-Id': userId || '',
    'Content-Type': 'application/json',
  };
};

export const queueService = {
  // Assign token to patient
  assignToken: async (request: CreateQueueTokenRequest) => {
    const response = await axios.post(
      `${getServiceUrl()}/api/appointment/v1/queue`,
      request,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get active queue
  getActiveQueue: async (doctorId?: string) => {
    const params = doctorId ? `?doctorId=${doctorId}` : '';
    const response = await axios.get(
      `${getServiceUrl()}/api/appointment/v1/queue/active${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get queue display data (public endpoint)
  getQueueDisplay: async (doctorId?: string, tenantId?: string) => {
    const params = new URLSearchParams();
    if (doctorId) params.append('doctorId', doctorId);
    if (tenantId) params.append('tenantId', tenantId);
    
    const response = await axios.get(
      `${getServiceUrl()}/api/appointment/v1/queue/display?${params.toString()}`
    );
    return response.data;
  },

  // Call next patient
  callNextPatient: async (doctorId: string) => {
    const response = await axios.post(
      `${getServiceUrl()}/api/appointment/v1/queue/call-next?doctorId=${doctorId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Call specific token
  callSpecificToken: async (tokenId: string) => {
    const response = await axios.post(
      `${getServiceUrl()}/api/appointment/v1/queue/${tokenId}/call`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Update token status
  updateTokenStatus: async (tokenId: string, status: string) => {
    const response = await axios.put(
      `${getServiceUrl()}/api/appointment/v1/queue/${tokenId}/status`,
      { status },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Mark token as complete
  completeToken: async (tokenId: string) => {
    const response = await axios.post(
      `${getServiceUrl()}/api/appointment/v1/queue/${tokenId}/complete`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get today's tokens
  getTodayTokens: async (doctorId?: string) => {
    const params = doctorId ? `?doctorId=${doctorId}` : '';
    const response = await axios.get(
      `${getServiceUrl()}/api/appointment/v1/queue/today${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get queue statistics
  getStatistics: async (date?: string, doctorId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (doctorId) params.append('doctorId', doctorId);
    
    const response = await axios.get(
      `${getServiceUrl()}/api/appointment/v1/queue/statistics?${params.toString()}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};
