import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/**
 * Hook to check if the current user has a specific permission
 * @param permissionCode - The permission code to check (e.g., 'patient.view', 'invoice.create')
 * @returns boolean indicating if user has the permission
 */
export function usePermission(permissionCode: string): boolean {
  const permissions = useSelector((state: RootState) => state.auth.permissions || []);
  return permissions.includes(permissionCode);
}

/**
 * Hook to check if the current user has any of the specified permissions
 * @param permissionCodes - Array of permission codes to check
 * @returns boolean indicating if user has at least one of the permissions
 */
export function useAnyPermission(permissionCodes: string[]): boolean {
  const permissions = useSelector((state: RootState) => state.auth.permissions || []);
  return permissionCodes.some(code => permissions.includes(code));
}

/**
 * Hook to check if the current user has all of the specified permissions
 * @param permissionCodes - Array of permission codes to check
 * @returns boolean indicating if user has all of the permissions
 */
export function useAllPermissions(permissionCodes: string[]): boolean {
  const permissions = useSelector((state: RootState) => state.auth.permissions || []);
  return permissionCodes.every(code => permissions.includes(code));
}

/**
 * Hook to get all current user permissions
 * @returns Array of permission codes
 */
export function usePermissions(): string[] {
  return useSelector((state: RootState) => state.auth.permissions || []);
}
