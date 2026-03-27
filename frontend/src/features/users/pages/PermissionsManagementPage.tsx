import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '@/types';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

interface PermissionFormData {
  code: string;
  name: string;
  description: string;
  module: string;
}

export function PermissionsManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<PermissionFormData>({
    code: '',
    name: '',
    description: '',
    module: '',
  });
  const queryClient = useQueryClient();

  // Fetch all permissions
  const { data: permissionsRes, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => userService.getPermissions(),
  });

  const permissions: Permission[] = permissionsRes?.data ?? [];

  // Create permission mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePermissionRequest) => userService.createPermission(data),
    onSuccess: () => {
      toast.success('Permission created successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create permission');
    },
  });

  // Update permission mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionRequest }) =>
      userService.updatePermission(id, data),
    onSuccess: () => {
      toast.success('Permission updated successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setEditingPermission(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update permission');
    },
  });

  // Delete permission mutation
  const deleteMutation = useMutation({
    mutationFn: (permissionId: string) => userService.deletePermission(permissionId),
    onSuccess: () => {
      toast.success('Permission deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      module: '',
    });
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      name: permission.name,
      description: permission.description,
      module: permission.module,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPermission) {
      // Update existing permission (code is immutable)
      updateMutation.mutate({
        id: editingPermission.id,
        data: {
          name: formData.name,
          description: formData.description,
          module: formData.module,
        },
      });
    } else {
      // Create new permission
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (permissionId: string, permissionName: string) => {
    if (confirm(`Are you sure you want to delete permission "${permissionName}"?`)) {
      deleteMutation.mutate(permissionId);
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setEditingPermission(null);
    resetForm();
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const module = perm.module || 'Other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  const modules = Object.keys(groupedPermissions).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Permission Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage system permissions
          </p>
        </div>
        <PermissionGuard permission="role.manage">
          <Button onClick={handleCreate} data-testid="create-permission-btn">
            <Plus className="mr-2 h-4 w-4" />
            Create Permission
          </Button>
        </PermissionGuard>
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingPermission) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingPermission ? 'Edit Permission' : 'Create New Permission'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Permission Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPermission}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., patient.view, invoice.create"
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  data-testid="permission-code-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use dot notation: module.action (e.g., patient.create)
                  {editingPermission && ' - Code cannot be changed'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Permission Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., View Patients, Create Invoice"
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="permission-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this permission allows..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="permission-description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Module <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  placeholder="e.g., Patient, Billing, User"
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="permission-module-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Module name for grouping permissions
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="cancel-permission-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="save-permission-btn"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingPermission
                    ? 'Update Permission'
                    : 'Create Permission'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Permissions List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading permissions...</p>
          </CardContent>
        </Card>
      ) : permissions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No permissions found. Create your first permission to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="text-lg">{module} Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groupedPermissions[module].map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`permission-item-${permission.code}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{permission.name}</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {permission.code}
                          </code>
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(permission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <PermissionGuard permission="role.manage">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(permission)}
                            data-testid={`edit-permission-${permission.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(permission.id, permission.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-permission-${permission.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </PermissionGuard>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
