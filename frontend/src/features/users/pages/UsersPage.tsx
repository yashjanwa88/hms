import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { Shield, UserPlus, CheckCircle, XCircle, Settings, Users as UsersIcon, Lock, Mail, Phone, MoreVertical } from 'lucide-react';
import { UserSecurityPanel } from '../components/UserSecurityPanel';
import { UserSecurityOversightModal } from '../components/UserSecurityOversightModal';
import { AdminResetPasswordModal } from '../components/AdminResetPasswordModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissionCodes = useSelector((s: RootState) => s.auth.permissions);
  const canOversight = permissionCodes.includes('role.manage');
  const canResetPassword = permissionCodes.includes('user.update');
  const [oversightUser, setOversightUser] = useState<{ id: string; label: string } | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; label: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'directory' | 'security'>('directory');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showRolePermissions, setShowRolePermissions] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    roleId: '',
  });

  const { data: rolesData, isPending: rolesPending } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
  });

  const { data: usersData, isPending: usersPending } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => userService.getPermissions(),
  });

  const { data: rolePermissionsData } = useQuery({
    queryKey: ['rolePermissions', selectedRole?.id],
    queryFn: () => userService.getRolePermissions(selectedRole.id),
    enabled: !!selectedRole?.id,
  });

  const roles = rolesData?.data || [];
  const users = usersData?.data || [];
  const permissions = permissionsData?.data || [];
  const rolePermissions = rolePermissionsData?.data || [];

  const createRoleMutation = useMutation({
    mutationFn: (name: string) => userService.createRole(name, ''),
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateRole(false);
      setNewRoleName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      userService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success('Role permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      setShowRolePermissions(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => userService.registerUser(data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateUser(false);
      setUserData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        roleId: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const handleRolePermissionsUpdate = (permissionIds: string[]) => {
    if (selectedRole) {
      updateRolePermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissionIds,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeSection === 'directory' ? 'default' : 'outline'}
            onClick={() => setActiveSection('directory')}
          >
            <UsersIcon className="mr-2 h-4 w-4" />
            {t('users.directory')}
          </Button>
          <Button
            variant={activeSection === 'security' ? 'default' : 'outline'}
            onClick={() => setActiveSection('security')}
          >
            <Lock className="mr-2 h-4 w-4" />
            {t('users.my_security')}
          </Button>
          {activeSection === 'directory' && (
            <Button onClick={() => setShowCreateUser(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('users.create_user')}
            </Button>
          )}
        </div>
      </div>

      {activeSection === 'security' ? (
        <UserSecurityPanel />
      ) : null}

      {activeSection === 'directory' ? (
        <>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('users.users_list')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersPending ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-4">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user: any) => (
                  <div key={user.id} className="group border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          <UsersIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex flex-col gap-1 mt-1.5">
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              {user.email}
                            </div>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                              <Phone className="h-3.5 w-3.5" />
                              {user.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="info" className="mb-2">
                          {user.role}
                        </Badge>
                        <div className="flex items-center justify-end">
                          {user.isActive ? (
                            <Badge variant="success" className="gap-1 px-1.5 h-5">
                              <CheckCircle className="h-3 w-3" />
                              {t('common.active')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 px-1.5 h-5">
                              <XCircle className="h-3 w-3" />
                              {t('common.inactive')}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-4 flex flex-col gap-2 items-end">
                          {canOversight ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary"
                              onClick={() =>
                                setOversightUser({
                                  id: user.id,
                                  label: `${user.firstName} ${user.lastName} (${user.email})`,
                                })
                              }
                            >
                              Sessions &amp; Logins
                            </Button>
                          ) : null}
                          {canResetPassword ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary"
                              onClick={() =>
                                setResetPasswordUser({
                                  id: user.id,
                                  label: `${user.firstName} ${user.lastName} (${user.email})`,
                                })
                              }
                            >
                              {t('auth.change_password')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No users found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('users.roles_permissions')}</CardTitle>
              <Button size="sm" onClick={() => setShowCreateRole(true)}>
                {t('users.add_role')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rolesPending ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 max-w-[220px]" />
                    </div>
                    <Skeleton className="h-8 w-[5.5rem] shrink-0" />
                  </div>
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No roles yet. Click <span className="font-medium text-foreground">{t('users.add_role')}</span> to create one, then attach
                permissions (or use <span className="font-medium text-foreground">Users → Permissions</span> for the full
                matrix).
              </p>
            ) : (
              <div className="space-y-3">
                {roles.map((role: any) => (
                  <div key={role.id} className="group border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
                          <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                            {role.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {role.description || 'System role with custom permissions'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 gap-2 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowRolePermissions(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                        {t('users.manage')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create Role</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate(newRoleName);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Role Name</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Manager, Supervisor"
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit">Create Role</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateRole(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create User</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(userData);
              }}
              className="space-y-4"
            >
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input
                  value={userData.firstName}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={userData.lastName}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={userData.phoneNumber}
                  onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={userData.roleId}
                  onChange={(e) => setUserData({ ...userData, roleId: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <Button type="submit">Create User</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRolePermissions && selectedRole && (
        <RolePermissionsModal
          role={selectedRole}
          permissions={permissions}
          rolePermissions={rolePermissions}
          onSave={handleRolePermissionsUpdate}
          onClose={() => setShowRolePermissions(false)}
        />
      )}

      {oversightUser ? (
        <UserSecurityOversightModal
          open
          userId={oversightUser.id}
          displayName={oversightUser.label}
          onClose={() => setOversightUser(null)}
        />
      ) : null}

      {resetPasswordUser ? (
        <AdminResetPasswordModal
          open
          userId={resetPasswordUser.id}
          displayName={resetPasswordUser.label}
          onClose={() => setResetPasswordUser(null)}
        />
      ) : null}
        </>
      ) : null}
    </div>
  );
}

function RolePermissionsModal({
  role,
  permissions,
  rolePermissions,
  onSave,
  onClose,
}: {
  role: any;
  permissions: any[];
  rolePermissions: string[];
  onSave: (permissionIds: string[]) => void;
  onClose: () => void;
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPermissions(rolePermissions);
  }, [rolePermissions]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module || 'Other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Permissions - {role.name}</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (selectedPermissions.length === permissions.length) {
                setSelectedPermissions([]);
              } else {
                setSelectedPermissions(permissions.map(p => p.id));
              }
            }}
          >
            {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <div key={module} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">{module}</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const modulePermissionIds = (modulePermissions as any[]).map(p => p.id);
                    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
                    if (allSelected) {
                      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
                    } else {
                      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])]);
                    }
                  }}
                >
                  {(modulePermissions as any[]).every(p => selectedPermissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(modulePermissions as any[]).map((permission: any) => (
                  <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">{permission.name}</span>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <Button onClick={() => onSave(selectedPermissions)}>Save Changes</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
