import { ReactNode } from 'react';
import { usePermission, useAnyPermission, useAllPermissions } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  /** Single permission code required */
  permission?: string;
  /** Array of permissions - user must have ANY of these */
  anyPermission?: string[];
  /** Array of permissions - user must have ALL of these */
  allPermissions?: string[];
  /** Component to render when permission is denied */
  fallback?: ReactNode;
  /** If true, hides the children instead of showing fallback */
  hide?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * // Show content only if user has 'patient.create' permission
 * <PermissionGuard permission="patient.create">
 *   <CreatePatientButton />
 * </PermissionGuard>
 * 
 * @example
 * // Show content if user has any of the specified permissions
 * <PermissionGuard anyPermission={['invoice.view', 'invoice.create']}>
 *   <InvoiceSection />
 * </PermissionGuard>
 * 
 * @example
 * // Show fallback when permission denied
 * <PermissionGuard permission="admin.panel" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  hide = false,
}: PermissionGuardProps) {
  const hasSinglePermission = usePermission(permission || '');
  const hasAnyPermission = useAnyPermission(anyPermission || []);
  const hasAllPermissions = useAllPermissions(allPermissions || []);

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasSinglePermission;
  }
  // Check any permission
  else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission;
  }
  // Check all permissions
  else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions;
  }

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component that disables a component based on permissions
 * Useful for disabling buttons while keeping them visible
 */
interface DisableWithoutPermissionProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  className?: string;
}

export function DisableWithoutPermission({
  children,
  permission,
  anyPermission,
  allPermissions,
  className = '',
}: DisableWithoutPermissionProps) {
  const hasSinglePermission = usePermission(permission || '');
  const hasAnyPermission = useAnyPermission(anyPermission || []);
  const hasAllPermissions = useAllPermissions(allPermissions || []);

  let hasAccess = true;

  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission;
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions;
  }

  return (
    <div
      className={`${!hasAccess ? 'pointer-events-none opacity-50' : ''} ${className}`}
      title={!hasAccess ? 'You do not have permission to perform this action' : ''}
    >
      {children}
    </div>
  );
}
