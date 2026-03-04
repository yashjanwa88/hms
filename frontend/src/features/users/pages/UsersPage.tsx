import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { Shield, UserPlus, CheckCircle, XCircle, Settings } from 'lucide-react';

export function UsersPage() {
  const queryClient = useQueryClient();
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

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.getRoles(),
  });

  const { data: usersData, isLoading } = useQuery({
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
    mutationFn: (name: string) => userService.createRole(name),
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage users and their roles</p>
        </div>
        <Button onClick={() => setShowCreateUser(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user: any) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                        <div className="mt-2">
                          {user.isActive ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
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
              <CardTitle>Roles & Permissions</CardTitle>
              <Button size="sm" onClick={() => setShowCreateRole(true)}>
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles.map((role: any) => (
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRolePermissions(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
