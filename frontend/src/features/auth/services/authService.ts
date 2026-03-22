import api from '@/lib/api';
import { getIdentityServiceUrl } from '@/lib/identityUrl';
import { ApiResponse, LoginResponse } from '@/types';

type ChangePasswordApiResult = ApiResponse<null>;

export const authService = {
  login: async (credentials: { email: string; password: string; tenantId: string }) => {
    const response = await api.post<LoginResponse>(
      `${getIdentityServiceUrl()}/api/identity/v1/auth/login`,
      { email: credentials.email, password: credentials.password },
      { headers: { 'X-Tenant-Id': credentials.tenantId } }
    );
    return response.data;
  },

  verifyMfa: async (mfaChallengeToken: string, code: string) => {
    const response = await api.post<LoginResponse>(
      `${getIdentityServiceUrl()}/api/identity/v1/auth/mfa/verify`,
      { mfaChallengeToken, code }
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post<LoginResponse>(
      `${getIdentityServiceUrl()}/api/identity/v1/auth/refresh`,
      { refreshToken },
      { skipAuthRefresh: true }
    );
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const tenantId = localStorage.getItem('tenantId');
    const response = await api.post<ChangePasswordApiResult>(
      `${getIdentityServiceUrl()}/api/identity/v1/auth/change-password`,
      { currentPassword, newPassword },
      { headers: { 'X-Tenant-Id': tenantId ?? '' } }
    );
    return response.data;
  },

  logout: async (refreshToken: string) => {
    await api.post(`${getIdentityServiceUrl()}/api/identity/v1/auth/logout`, { refreshToken });
  },
};
