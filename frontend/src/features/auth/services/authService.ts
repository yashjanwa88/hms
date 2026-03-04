import api from '@/lib/api';
import { LoginRequest, LoginResponse } from '@/types';

const IDENTITY_SERVICE = import.meta.env.VITE_IDENTITY_SERVICE_URL;

export const authService = {
  login: async (credentials: LoginRequest & { tenantId: string }) => {
    const response = await api.post<LoginResponse>(
      `${IDENTITY_SERVICE}/api/identity/v1/auth/login`,
      { email: credentials.email, password: credentials.password },
      { headers: { 'X-Tenant-Id': credentials.tenantId } }
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post(`${IDENTITY_SERVICE}/api/identity/v1/auth/refresh`, {
      refreshToken,
    });
    return response.data;
  },
};
