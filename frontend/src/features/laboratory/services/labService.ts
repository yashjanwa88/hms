import api from '@/lib/api';
import { ApiResponse, LabOrder } from '@/types';

const LAB_SERVICE = import.meta.env.VITE_LABORATORY_SERVICE_URL;

export const labService = {
  getLabOrders: async () => {
    const response = await api.get<ApiResponse<LabOrder[]>>(
      `${LAB_SERVICE}/api/laboratory/v1/orders`
    );
    return response.data;
  },

  getLabOrder: async (id: string) => {
    const response = await api.get<ApiResponse<LabOrder>>(
      `${LAB_SERVICE}/api/laboratory/v1/orders/${id}`
    );
    return response.data;
  },

  collectSample: async (orderId: string, sampleData: any) => {
    const response = await api.post<ApiResponse<any>>(
      `${LAB_SERVICE}/api/laboratory/v1/orders/${orderId}/collect-sample`,
      sampleData
    );
    return response.data;
  },

  enterResults: async (orderId: string, results: any) => {
    const response = await api.post<ApiResponse<any>>(
      `${LAB_SERVICE}/api/laboratory/v1/orders/${orderId}/results`,
      results
    );
    return response.data;
  },
};
