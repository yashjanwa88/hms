import api from '@/lib/api';
import { ApiResponse, Medicine } from '@/types';

const PHARMACY_SERVICE = import.meta.env.VITE_PHARMACY_SERVICE_URL;

export const pharmacyService = {
  getMedicines: async () => {
    const response = await api.get<ApiResponse<Medicine[]>>(
      `${PHARMACY_SERVICE}/api/pharmacy/v1/medicines`
    );
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get<ApiResponse<Medicine[]>>(
      `${PHARMACY_SERVICE}/api/pharmacy/v1/medicines/low-stock`
    );
    return response.data;
  },

  dispenseMedicine: async (data: any) => {
    const response = await api.post<ApiResponse<any>>(
      `${PHARMACY_SERVICE}/api/pharmacy/v1/sales`,
      data
    );
    return response.data;
  },
};
