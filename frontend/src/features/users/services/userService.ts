import axios from 'axios';
import { getIdentityServiceUrl } from '@/lib/identityUrl';

function identityBase(): string {
  return `${getIdentityServiceUrl()}/api/identity/v1`;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  const userId = localStorage.getItem('userId');

  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenantId || '',
    'X-User-Id': userId || '',
    'Content-Type': 'application/json',
  };
};

export interface LoginHistoryEntry {
  createdAt: string;
  isSuccessful: boolean;
  ipAddress: string;
  userAgent: string;
  failureReason?: string | null;
}

export interface MfaEnrollmentResult {
  manualEntryKeyBase32: string;
  otpAuthUri: string;
}

export interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const userService = {
  registerUser: async (data: Record<string, unknown>) => {
    const response = await axios.post(`${identityBase()}/auth/register`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${identityBase()}/users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getRoles: async () => {
    const response = await axios.get(`${identityBase()}/roles`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createRole: async (name: string, description = '') => {
    const response = await axios.post(
      `${identityBase()}/roles`,
      { name, description },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Permission Management APIs
  getPermissions: async () => {
    const response = await axios.get(`${identityBase()}/permissions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getPermissionById: async (permissionId: string) => {
    const response = await axios.get(`${identityBase()}/permissions/${permissionId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getPermissionsByModule: async (module: string) => {
    const response = await axios.get(`${identityBase()}/permissions/module/${module}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUserPermissions: async (userId: string) => {
    const response = await axios.get(`${identityBase()}/permissions/user/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getRolePermissions: async (roleId: string) => {
    const response = await axios.get(`${identityBase()}/permissions/role/${roleId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createPermission: async (data: { code: string; name: string; description: string; module: string }) => {
    const response = await axios.post(`${identityBase()}/permissions`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updatePermission: async (permissionId: string, data: { name: string; description: string; module: string }) => {
    const response = await axios.put(`${identityBase()}/permissions/${permissionId}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  deletePermission: async (permissionId: string) => {
    const response = await axios.delete(`${identityBase()}/permissions/${permissionId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  assignPermissionToRole: async (roleId: string, permissionId: string) => {
    const response = await axios.post(
      `${identityBase()}/permissions/role/${roleId}`,
      { permissionId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  removePermissionFromRole: async (roleId: string, permissionId: string) => {
    const response = await axios.delete(
      `${identityBase()}/permissions/role/${roleId}/${permissionId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await axios.put(
      `${identityBase()}/permissions/role/${roleId}/bulk`,
      { permissionIds },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /** Current user — requires JWT with matching tenant header. */
  getLoginHistory: async (take = 50) => {
    const response = await axios.get(`${identityBase()}/auth/login-history`, {
      headers: getAuthHeaders(),
      params: { take },
    });
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axios.get<{ data: UserSession[] }>(`${identityBase()}/auth/sessions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  revokeSession: async (sessionId: string) => {
    const response = await axios.post(`${identityBase()}/auth/sessions/revoke`, { sessionId }, { headers: getAuthHeaders() });
    return response.data;
  },

  /** Requires role.manage — same tenant as X-Tenant-Id. */
  getUserLoginHistoryAdmin: async (userId: string, take = 40) => {
    const response = await axios.get(`${identityBase()}/users/${userId}/login-history`, {
      headers: getAuthHeaders(),
      params: { take },
    });
    return response.data;
  },

  getUserSessionsAdmin: async (userId: string) => {
    const response = await axios.get<{ data: UserSession[] }>(`${identityBase()}/users/${userId}/sessions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  revokeUserSessionAdmin: async (userId: string, sessionId: string) => {
    const response = await axios.post(
      `${identityBase()}/users/${userId}/sessions/revoke`,
      { sessionId },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /** Requires user.update — revokes all sessions for the user. */
  adminResetPassword: async (
    userId: string,
    newPassword: string,
    requirePasswordChangeOnNextLogin: boolean
  ) => {
    const response = await axios.post(
      `${identityBase()}/users/${userId}/password`,
      { newPassword, requirePasswordChangeOnNextLogin },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  startMfaEnrollment: async () => {
    const response = await axios.post<{ data: MfaEnrollmentResult }>(
      `${identityBase()}/mfa/enroll`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  confirmMfaEnrollment: async (code: string) => {
    const response = await axios.post(`${identityBase()}/mfa/confirm`, { code }, { headers: getAuthHeaders() });
    return response.data;
  },
};
