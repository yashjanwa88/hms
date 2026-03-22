import rawAxios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { store } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { getIdentityServiceUrl } from '@/lib/identityUrl';
import type { LoginResponse } from '@/types';

const api = rawAxios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getRequestUrl(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return null;
  try {
    const url = `${getIdentityServiceUrl()}/api/identity/v1/auth/refresh`;
    const { data: body } = await rawAxios.post<LoginResponse>(url, { refreshToken: rt }, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!body.success || !body.data?.accessToken) return null;
    const d = body.data;
    const force = d.forcePasswordChange === true;
    store.dispatch(
      setCredentials({
        user: {
          userId: d.userId,
          tenantId: d.tenantId,
          email: d.email,
          role: d.role,
          permissions: d.permissions ?? [],
          forcePasswordChangeRequired: force,
        },
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
        forcePasswordChangeRequired: force,
      })
    );
    return d.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    const tenantId = localStorage.getItem('tenantId');
    const userId = localStorage.getItem('userId');
    const tenantCode = localStorage.getItem('tenantCode');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message: string; errors?: string[] }>) => {
    if (!error.response) {
      toast.error('Network error. Please try again.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean; skipAuthRefresh?: boolean })
      | undefined;

    if (status === 429) {
      const hdr = error.response.headers;
      const rawRa =
        typeof hdr.get === 'function' ? hdr.get('retry-after') : (hdr as Record<string, string>)['retry-after'];
      const retrySecs = rawRa != null ? parseInt(String(rawRa), 10) : NaN;
      const hasSecs = Number.isFinite(retrySecs) && retrySecs > 0;
      const serverMsg = error.response.data?.message;
      if (serverMsg) {
        toast.error(hasSecs ? `${serverMsg} Retry after ~${retrySecs}s.` : serverMsg);
      } else if (hasSecs) {
        toast.error(`Too many requests. Please try again in about ${retrySecs} seconds.`);
      } else {
        toast.error('Too many requests. Please wait a moment and try again.');
      }
      return Promise.reject(error);
    }

    if (status !== 401) {
      const msg = error.response.data?.message;
      if (msg) toast.error(msg);
      else toast.error('An error occurred. Please try again.');
      return Promise.reject(error);
    }

    if (!config) {
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    const url = getRequestUrl(config);

    if (url.includes('/auth/login') || url.includes('/auth/mfa/verify')) {
      const msg = error.response.data?.message;
      if (msg) toast.error(msg);
      else toast.error('Authentication failed');
      return Promise.reject(error);
    }

    if (url.includes('/auth/refresh')) {
      localStorage.clear();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    if (config.skipAuthRefresh || config._retry) {
      localStorage.clear();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    config._retry = true;
    const token = await refreshAccessToken();
    if (!token) {
      localStorage.clear();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    return api(config);
  }
);

export default api;
