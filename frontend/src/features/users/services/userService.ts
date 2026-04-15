import api from '@/lib/api';
import { getIdentityServiceUrl } from '@/lib/identityUrl';

function identityBase(): string {
  return `${getIdentityServiceUrl()}/api/identity/v1`;
}

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
    const response = await api.post(`${identityBase()}/auth/register`, data);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get(`${identityBase()}/users`);
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get(`${identityBase()}/roles`);
    return response.data;
  },

  createRole: async (name: string, description = '') => {
    const response = await api.post(`${identityBase()}/roles`, { name, description });
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get(`${identityBase()}/permissions`);
    return response.data;
  },

  getPermissionById: async (permissionId: string) => {
    const response = await api.get(`${identityBase()}/permissions/${permissionId}`);
    return response.data;
  },

  getPermissionsByModule: async (module: string) => {
    const response = await api.get(`${identityBase()}/permissions/module/${module}`);
    return response.data;
  },

  getUserPermissions: async (userId: string) => {
    const response = await api.get(`${identityBase()}/permissions/user/${userId}`);
    return response.data;
  },

  getRolePermissions: async (roleId: string) => {
    const response = await api.get(`${identityBase()}/permissions/role/${roleId}`);
    return response.data;
  },

  createPermission: async (data: { code: string; name: string; description: string; module: string }) => {
    const response = await api.post(`${identityBase()}/permissions`, data);
    return response.data;
  },

  updatePermission: async (permissionId: string, data: { name: string; description: string; module: string }) => {
    const response = await api.put(`${identityBase()}/permissions/${permissionId}`, data);
    return response.data;
  },

  deletePermission: async (permissionId: string) => {
    const response = await api.delete(`${identityBase()}/permissions/${permissionId}`);
    return response.data;
  },

  assignPermissionToRole: async (roleId: string, permissionId: string) => {
    const response = await api.post(`${identityBase()}/permissions/role/${roleId}`, { permissionId });
    return response.data;
  },

  removePermissionFromRole: async (roleId: string, permissionId: string) => {
    const response = await api.delete(`${identityBase()}/permissions/role/${roleId}/${permissionId}`);
    return response.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await api.put(`${identityBase()}/permissions/role/${roleId}/bulk`, { permissionIds });
    return response.data;
  },

  getLoginHistory: async (take = 50) => {
    const response = await api.get(`${identityBase()}/auth/login-history`, { params: { take } });
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get<{ data: UserSession[] }>(`${identityBase()}/auth/sessions`);
    return response.data;
  },

  revokeSession: async (sessionId: string) => {
    const response = await api.post(`${identityBase()}/auth/sessions/revoke`, { sessionId });
    return response.data;
  },

  getUserLoginHistoryAdmin: async (userId: string, take = 40) => {
    const response = await api.get(`${identityBase()}/users/${userId}/login-history`, { params: { take } });
    return response.data;
  },

  getUserSessionsAdmin: async (userId: string) => {
    const response = await api.get<{ data: UserSession[] }>(`${identityBase()}/users/${userId}/sessions`);
    return response.data;
  },

  revokeUserSessionAdmin: async (userId: string, sessionId: string) => {
    const response = await api.post(`${identityBase()}/users/${userId}/sessions/revoke`, { sessionId });
    return response.data;
  },

  adminResetPassword: async (userId: string, newPassword: string, requirePasswordChangeOnNextLogin: boolean) => {
    const response = await api.post(`${identityBase()}/users/${userId}/password`, { newPassword, requirePasswordChangeOnNextLogin });
    return response.data;
  },

  startMfaEnrollment: async () => {
    const response = await api.post<{ data: MfaEnrollmentResult }>(`${identityBase()}/mfa/enroll`, {});
    return response.data;
  },

  confirmMfaEnrollment: async (code: string) => {
    const response = await api.post(`${identityBase()}/mfa/confirm`, { code });
    return response.data;
  },
};
