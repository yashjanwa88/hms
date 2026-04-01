import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  Shield, UserPlus, CheckCircle, XCircle, Settings, 
  Users as UsersIcon, Lock, Mail, Phone, MoreVertical,
  ShieldCheck, ShieldAlert, Key, Search, Filter, 
  ChevronRight, ArrowRight, UserCheck, UserX, Activity,
  Database, Fingerprint, History, LayoutDashboard, X, Plus
} from 'lucide-react';
import { UserSecurityPanel } from '../components/UserSecurityPanel';
import { UserSecurityOversightModal } from '../components/UserSecurityOversightModal';
import { AdminResetPasswordModal } from '../components/AdminResetPasswordModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissionCodes = useSelector((s: RootState) => s.auth.permissions);
  const canOversight = permissionCodes.includes('role.manage');
  const canResetPassword = permissionCodes.includes('user.update');
  
  const [oversightUser, setOversightUser] = useState<{ id: string; label: string } | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Queries
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

  const roles = rolesData?.data || [];
  const users = usersData?.data || [];
  const permissions = permissionsData?.data || [];

  // Mutations
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

  const filteredUsers = users.filter((u: any) => 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Identity & Access</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            IAM Command Center
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Securely manage global user identities, roles, and granular permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowCreateUser(true)}
            className="h-12 px-6 shadow-xl shadow-primary/20 gap-2 text-base font-bold"
          >
            <UserPlus className="h-5 w-5" />
            Create Identity
          </Button>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-1">
          <TabsList className="h-12 bg-transparent gap-8 p-0">
            {[
              { value: 'directory', label: 'User Directory', icon: UsersIcon },
              { value: 'roles', label: 'Role Management', icon: Shield },
              { value: 'security', label: 'Security Oversight', icon: Lock },
              { value: 'audit', label: 'Access Logs', icon: History },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value}
                className="h-12 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all gap-2"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* User Directory Tab */}
        <TabsContent value="directory" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary text-base shadow-sm"
              />
            </div>
            <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
              <Filter className="h-4 w-4" />
              Filter Status
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {usersPending ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <Card key={user.id} className="group border-none shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0 group-hover:scale-110 transition-transform">
                              <span className="text-xl font-black text-primary">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">
                                {user.firstName} {user.lastName}
                              </h3>
                              <div className="flex flex-col gap-1.5 mt-2">
                                <div className="flex items-center text-sm font-bold text-slate-500 gap-2">
                                  <Mail className="h-3.5 w-3.5" />
                                  {user.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="h-5 px-1.5 rounded uppercase font-black text-[9px] tracking-widest bg-primary/5 text-primary border-primary/20">
                                    {user.role}
                                  </Badge>
                                  {user.isActive ? (
                                    <Badge variant="success" className="h-5 px-1.5 rounded uppercase font-black text-[9px] tracking-widest gap-1">
                                      <CheckCircle className="h-2.5 w-2.5" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="h-5 px-1.5 rounded uppercase font-black text-[9px] tracking-widest gap-1">
                                      <XCircle className="h-2.5 w-2.5" />
                                      Suspended
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security MFA</span>
                              <span className="text-xs font-bold text-emerald-600">Enrolled</span>
                            </div>
                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Sessions</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2 Devices</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {canOversight && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-2"
                                onClick={() => setOversightUser({ id: user.id, label: `${user.firstName} ${user.lastName}` })}
                              >
                                Security Oversight
                              </Button>
                            )}
                            {canResetPassword && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary"
                                onClick={() => setResetPasswordUser({ id: user.id, label: `${user.firstName} ${user.lastName}` })}
                              >
                                Reset Pass
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4">
                  <UserX className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No identities found</h3>
                <p className="text-slate-500 mt-1">Refine your search or create a new system identity.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Roles Management Tab */}
        <TabsContent value="roles" className="space-y-6 outline-none">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Roles</h3>
              <p className="text-sm text-slate-500">Define access tiers and map them to functional permissions.</p>
            </div>
            <Button onClick={() => setShowCreateRole(true)} variant="outline" className="border-2 font-bold gap-2">
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesPending ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
            ) : roles.map((role: any) => (
              <Card key={role.id} className="group border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                      {role.name === 'Admin' ? 'Core System' : 'Custom'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-black mt-4">{role.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                    {role.description || 'Defines permissions for users within this functional tier.'}
                  </p>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">24 Permissions</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 gap-1.5 font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRolePermissions(true);
                      }}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Security Tab */}
        <TabsContent value="security" className="outline-none">
          <UserSecurityPanel />
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="audit" className="outline-none">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Global Access Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Database className="h-12 w-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Advanced Audit Logs Loading...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals & Overlays */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-black tracking-tight">Create New Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createRoleMutation.mutate(newRoleName);
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Role Identity Name</Label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Clinical Director"
                    className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-12 font-black shadow-lg shadow-primary/20" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? 'Deploying...' : 'Deploy Role'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCreateRole(false)} className="h-12 font-bold">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreateUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="w-full max-w-xl border-none shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
              <CardTitle className="text-2xl font-black tracking-tight">Provision New Identity</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Configure credentials and initial access tier.</p>
            </CardHeader>
            <CardContent className="pt-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createUserMutation.mutate(userData);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">First Name</Label>
                  <Input
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Last Name</Label>
                  <Input
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Corporate Email</Label>
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Initial Password</Label>
                  <Input
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Phone Number</Label>
                  <Input
                    value={userData.phoneNumber}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    className="h-11 bg-slate-50 dark:bg-slate-900"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Access Tier (Role)</Label>
                  <select
                    className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20"
                    value={userData.roleId}
                    onChange={(e) => setUserData({ ...userData, roleId: e.target.value })}
                    required
                  >
                    <option value="">Select Tier</option>
                    {roles.map((role: any) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4 col-span-full pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <Button type="submit" className="flex-1 h-12 font-black shadow-xl shadow-primary/20" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Provisioning...' : 'Provision Identity'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCreateUser(false)} className="h-12 font-bold px-8">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showRolePermissions && selectedRole && (
        <RolePermissionsModal
          role={selectedRole}
          permissions={permissions}
          onSave={handleRolePermissionsUpdate}
          onClose={() => setShowRolePermissions(false)}
        />
      )}

      {oversightUser && (
        <UserSecurityOversightModal
          open
          userId={oversightUser.id}
          displayName={oversightUser.label}
          onClose={() => setOversightUser(null)}
        />
      )}

      {resetPasswordUser && (
        <AdminResetPasswordModal
          open
          userId={resetPasswordUser.id}
          displayName={resetPasswordUser.label}
          onClose={() => setResetPasswordUser(null)}
        />
      )}
    </div>
  );
}

function RolePermissionsModal({
  role,
  permissions,
  onSave,
  onClose,
}: {
  role: any;
  permissions: any[];
  onSave: (permissionIds: string[]) => void;
  onClose: () => void;
}) {
  const { data: rolePermissionsData, isPending } = useQuery({
    queryKey: ['rolePermissions', role.id],
    queryFn: () => userService.getRolePermissions(role.id),
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (rolePermissionsData?.data) {
      setSelectedPermissions(rolePermissionsData.data);
    }
  }, [rolePermissionsData]);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col border-none shadow-2xl animate-in zoom-in-95 duration-300">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Access Control Matrix</CardTitle>
              <p className="text-sm font-bold text-primary mt-1 uppercase tracking-widest">
                Tier: {role.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-2"
                onClick={() => {
                  if (selectedPermissions.length === permissions.length) {
                    setSelectedPermissions([]);
                  } else {
                    setSelectedPermissions(permissions.map(p => p.id));
                  }
                }}
              >
                {selectedPermissions.length === permissions.length ? 'Revoke All' : 'Grant All'}
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose} className="h-9 w-9 rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-8 space-y-8">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Activity className="h-10 w-10 animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Matrix...</p>
            </div>
          ) : (
            Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <div key={module} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{module} Module</h3>
                  </div>
                  <button
                    className="text-[10px] font-bold text-primary hover:underline"
                    onClick={() => {
                      const moduleIds = (modulePermissions as any[]).map(p => p.id);
                      const allIn = moduleIds.every(id => selectedPermissions.includes(id));
                      if (allIn) {
                        setSelectedPermissions(prev => prev.filter(id => !moduleIds.includes(id)));
                      } else {
                        setSelectedPermissions(prev => [...new Set([...prev, ...moduleIds])]);
                      }
                    }}
                  >
                    Toggle Module
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(modulePermissions as any[]).map((permission: any) => (
                    <label 
                      key={permission.id} 
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer group",
                        selectedPermissions.includes(permission.id) 
                          ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" 
                          : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                        selectedPermissions.includes(permission.id) 
                          ? "bg-primary border-primary" 
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 group-hover:border-primary/50"
                      )}>
                        {selectedPermissions.includes(permission.id) && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                      />
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-black transition-colors",
                          selectedPermissions.includes(permission.id) ? "text-primary" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {permission.name}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-relaxed">
                          {permission.description || `Grants access to ${permission.name.toLowerCase()} functions.`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>

        <CardHeader className="border-t border-slate-100 dark:border-slate-800 p-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedPermissions.length} Permissions Active</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="h-11 px-8 font-bold border-2">
                Discard Changes
              </Button>
              <Button onClick={() => onSave(selectedPermissions)} className="h-11 px-10 font-black shadow-xl shadow-primary/20">
                Commit Matrix
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
