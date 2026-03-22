/** Base URL for IdentityService (no trailing slash). */
export function getIdentityServiceUrl(): string {
  return (import.meta.env.VITE_IDENTITY_SERVICE_URL ?? 'http://localhost:5001').replace(/\/$/, '');
}
