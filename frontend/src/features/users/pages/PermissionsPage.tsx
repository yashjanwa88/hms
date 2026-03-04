import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/identity/v1/permissions');
      return res.data;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/identity/v1/roles');
      return res.data;
    },
  });

  const permissions = permissionsData?.data || [];
  const roles = rolesData?.data || [];

  const toggleMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, hasPermission }: { roleId: string; permissionId: string; hasPermission: boolean }) => {
      if (hasPermission) {
        await api.delete(`/identity/v1/roles/${roleId}/permissions/${permissionId}`);
      } else {
        await api.post(`/identity/v1/roles/${roleId}/permissions`, { permissionId });
      }
    },
    onSuccess: () => {
      toast.success('Permission updated');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });

  const togglePermission = (roleId: string, permissionId: string, hasPermission: boolean) => {
    toggleMutation.mutate({ roleId, permissionId, hasPermission });
  };

  const groupedPermissions: Record<string, Permission[]> = permissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Permission Management</h1>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
          <CardContent>
            {roles.map((role: Role) => (
              <div
                key={role.id}
                className={`p-3 border rounded mb-2 cursor-pointer ${selectedRole?.id === role.id ? 'bg-primary text-white' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                {role.name}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permissions {selectedRole && `for ${selectedRole.name}`}</CardTitle></CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-muted-foreground">Select a role to manage permissions</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([module, perms]: [string, Permission[]]) => (
                  <div key={module}>
                    <h3 className="font-semibold mb-2">{module}</h3>
                    {perms.map((perm: Permission) => {
                      const hasPermission = selectedRole.permissions.includes(perm.id);
                      return (
                        <label key={perm.id} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() => togglePermission(selectedRole.id, perm.id, hasPermission)}
                          />
                          <span>{perm.name}</span>
                        </label>
                      );
                    })}
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
