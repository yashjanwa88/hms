import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import type { RootState } from '@/store';

interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string;
}

interface RoleRow {
  id: string;
  name: string;
  description?: string;
}

function PermissionMatrixSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((block) => (
        <div key={block} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2 pl-1">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-start gap-2">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Matrix view: pick a role, toggle permissions (persists via full PUT to match Identity API).
 */
export function PermissionsPage() {
  const rbacCodes = useSelector((s: RootState) => s.auth.permissions);
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const queryClient = useQueryClient();

  const { data: permissionsRes, isPending: permissionsPending } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => userService.getPermissions(),
    enabled: rbacCodes.includes('role.manage'),
  });

  const { data: rolesRes, isPending: rolesPending } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
    enabled: rbacCodes.includes('role.manage'),
  });

  const { data: rolePermsRes, isPending: rolePermsPending } = useQuery({
    queryKey: ['rolePermissions', selectedRole?.id],
    queryFn: () => userService.getRolePermissions(selectedRole!.id),
    enabled: !!selectedRole?.id && rbacCodes.includes('role.manage'),
  });

  const rolePermissionIds: string[] = useMemo(() => rolePermsRes?.data ?? [], [rolePermsRes]);

  const updateMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      userService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success('Permissions saved');
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
    },
    onError: () => toast.error('Failed to save permissions'),
  });

  if (!rbacCodes.includes('role.manage')) {
    return <Navigate to="/dashboard" replace />;
  }

  const permissions: Permission[] = permissionsRes?.data ?? [];
  const roles: RoleRow[] = rolesRes?.data ?? [];

  const togglePermission = (permissionId: string, has: boolean) => {
    if (!selectedRole) return;
    const next = new Set(rolePermissionIds);
    if (has) next.delete(permissionId);
    else next.add(permissionId);
    updateMutation.mutate({ roleId: selectedRole.id, permissionIds: Array.from(next) });
  };

  const groupedPermissions = useMemo(() => {
    const acc = permissions.reduce<Record<string, Permission[]>>((map, perm) => {
      const m = perm.module || 'Other';
      if (!map[m]) map[m] = [];
      map[m].push(perm);
      return map;
    }, {});
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const selectedCount = rolePermissionIds.length;

  const matrixLoading =
    !!selectedRole &&
    (permissionsPending || (permissions.length > 0 && rolePermsPending));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Permission matrix</h1>
        <p className="text-sm text-muted-foreground">
          Select a role and toggle permissions. Changes save immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {rolesPending ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded border px-3 py-2">
                    <Skeleton className="mb-1 h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roles yet. Create a role from <span className="font-medium text-foreground">Users → Directory</span>, then
                assign permissions here.
              </p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                    selectedRole?.id === role.id ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  {role.description && <div className="text-xs text-muted-foreground">{role.description}</div>}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Permissions
              {selectedRole ? (
                <>
                  {' '}
                  — {selectedRole.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({selectedCount} granted{permissions.length ? ` / ${permissions.length} total` : ''})
                  </span>
                </>
              ) : (
                ''
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-muted-foreground">Select a role to manage permissions.</p>
            ) : permissionsPending && permissions.length === 0 ? (
              <PermissionMatrixSkeleton />
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No permission definitions returned from the server. Run Identity migrations or seed permissions.
              </p>
            ) : matrixLoading ? (
              <PermissionMatrixSkeleton />
            ) : updateMutation.isPending ? (
              <p className="text-sm text-muted-foreground">Saving…</p>
            ) : (
              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
                {groupedPermissions.map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="mb-2 font-semibold">{module}</h3>
                    <ul className="space-y-2">
                      {perms.map((perm) => {
                        const has = rolePermissionIds.includes(perm.id);
                        return (
                          <li key={perm.id}>
                            <label className="flex cursor-pointer items-start gap-2 rounded border border-transparent px-2 py-1 hover:bg-muted/50">
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={has}
                                onChange={() => togglePermission(perm.id, has)}
                              />
                              <span>
                                <span className="block text-sm font-medium">{perm.name}</span>
                                {perm.description && (
                                  <span className="text-xs text-muted-foreground">{perm.description}</span>
                                )}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
