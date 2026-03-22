import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';

function readPermissionsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem('permissions');
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}

function readForcePasswordChange(): boolean {
  return localStorage.getItem('forcePasswordChangeRequired') === 'true';
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  permissions: readPermissionsFromStorage(),
  forcePasswordChangeRequired: readForcePasswordChange(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
        forcePasswordChangeRequired?: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.permissions = action.payload.user.permissions ?? [];
      const force =
        action.payload.forcePasswordChangeRequired ??
        action.payload.user.forcePasswordChangeRequired ??
        false;
      state.forcePasswordChangeRequired = force;

      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('userId', action.payload.user.userId);
      localStorage.setItem('tenantId', action.payload.user.tenantId);
      localStorage.setItem('tenantCode', action.payload.user.tenantCode || '');
      localStorage.setItem('role', action.payload.user.role);
      localStorage.setItem('permissions', JSON.stringify(state.permissions));
      if (force) {
        localStorage.setItem('forcePasswordChangeRequired', 'true');
      } else {
        localStorage.removeItem('forcePasswordChangeRequired');
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.forcePasswordChangeRequired = false;

      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
