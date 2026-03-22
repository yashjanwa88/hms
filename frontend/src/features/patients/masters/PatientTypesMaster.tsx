import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Edit, Trash2, Save, X, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { PatientTypeModel } from '../types';
import api from '@/lib/api';

const BASE = import.meta.env.VITE_PATIENT_SERVICE_URL;

export function PatientTypesMaster() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  
  const [formData, setFormData] = useState<Partial<PatientTypeModel>>({
    code: '',
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    icon: 'user',
    sortOrder: 0,
    isActive: true,
    isDefault: false,
    discountPercentage: 0,
    specialInstructions: '',
  });

  const { data: patientTypesData, isLoading } = useQuery({
    queryKey: ['patient-types'],
    queryFn: () => api.get(`${BASE}/api/patients/types`).then(r => r.data?.data ?? []),
  });

  const patientTypes = patientTypesData || [];
  const filteredTypes = patientTypes.filter((type: PatientTypeModel) =>
    type.name.toLowerCase().includes(searchText.toLowerCase()) ||
    type.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: Partial<PatientTypeModel>) =>
      api.post(`${BASE}/api/patients/types`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Patient type created successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-types'] });
      handleCancel();
    },
    onError: () => {
      toast.error('Failed to create patient type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PatientTypeModel>) =>
      api.put(`${BASE}/api/patients/types/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Patient type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-types'] });
      handleCancel();
    },
    onError: () => {
      toast.error('Failed to update patient type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`${BASE}/api/patients/types/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Patient type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-types'] });
    },
    onError: () => {
      toast.error('Failed to delete patient type');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ ...formData, id: editingId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (type: PatientTypeModel) => {
    setFormData(type);
    setEditingId(type.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this patient type?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      displayName: '',
      description: '',
      color: '#3B82F6',
      icon: 'user',
      sortOrder: 0,
      isActive: true,
      isDefault: false,
      discountPercentage: 0,
      specialInstructions: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Types Master</h1>
          <p className="text-gray-600 mt-1">Manage patient type categories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient Type
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Patient Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., GEN"
                    required
                  />
                </div>
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., General"
                    required
                  />
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., General Patient"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <Label>Icon</Label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="users">Users</option>
                    <option value="heart">Heart</option>
                    <option value="star">Star</option>
                    <option value="shield">Shield</option>
                    <option value="crown">Crown</option>
                  </select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Special Instructions</Label>
                  <textarea
                    className="w-full border rounded px-3 py-2 min-h-[80px]"
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    placeholder="Any special instructions for this patient type..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <span>Default</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Types ({filteredTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No patient types found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Code</th>
                    <th className="p-3 text-left text-sm font-medium">Name</th>
                    <th className="p-3 text-left text-sm font-medium">Display Name</th>
                    <th className="p-3 text-left text-sm font-medium">Color</th>
                    <th className="p-3 text-center text-sm font-medium">Discount %</th>
                    <th className="p-3 text-center text-sm font-medium">Sort Order</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                    <th className="p-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTypes.map((type: PatientTypeModel) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-mono font-semibold">{type.code}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" style={{ color: type.color }} />
                          <span className="font-medium">{type.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{type.displayName}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm text-gray-600">{type.color}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {type.discountPercentage ? `${type.discountPercentage}%` : '-'}
                      </td>
                      <td className="p-3 text-center">{type.sortOrder}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              type.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {type.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {type.isDefault && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(type.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
