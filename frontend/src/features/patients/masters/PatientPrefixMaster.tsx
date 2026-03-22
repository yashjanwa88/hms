import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PatientPrefixModel } from '../types';
import api from '@/lib/api';

const BASE = import.meta.env.VITE_PATIENT_SERVICE_URL;
const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'X-Tenant-Id': localStorage.getItem('tenantId') ?? '',
  'X-User-Id': localStorage.getItem('userId') ?? '',
});

export function PatientPrefixMaster() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<PatientPrefixModel>>({
    code: '',
    displayName: '',
    description: '',
    gender: 'All',
    sortOrder: 0,
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: prefixes = [], isLoading } = useQuery({
    queryKey: ['patient-prefixes'],
    queryFn: () => api.get(`${BASE}/api/patients/prefixes`, { headers: headers() }).then(r => r.data?.data ?? []),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<PatientPrefixModel>) => {
      const payload = { prefixName: data.displayName, genderApplicable: data.gender === 'All' ? null : data.gender, sortOrder: data.sortOrder };
      if (editingId) {
        return api.put(`${BASE}/api/patients/prefixes/${editingId}`, payload, { headers: headers() });
      }
      return api.post(`${BASE}/api/patients/prefixes`, payload, { headers: headers() });
    },
    onSuccess: () => {
      toast.success(editingId ? 'Prefix updated' : 'Prefix created');
      queryClient.invalidateQueries({ queryKey: ['patient-prefixes'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${BASE}/api/patients/prefixes/${id}`, { headers: headers() }),
    onSuccess: () => {
      toast.success('Prefix deleted');
      queryClient.invalidateQueries({ queryKey: ['patient-prefixes'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleEdit = (prefix: PatientPrefixModel) => {
    setFormData(prefix);
    setEditingId(prefix.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this prefix?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      displayName: '',
      description: '',
      gender: 'All',
      sortOrder: 0,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredPrefixes = prefixes.filter((p: PatientPrefixModel) =>
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Prefix Master</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prefix
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Prefix</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Display Name *</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Prefix List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Display Name</th>
                <th className="p-3 text-left">Gender</th>
                <th className="p-3 text-left">Sort Order</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPrefixes.map((prefix: PatientPrefixModel) => (
                <tr key={prefix.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{prefix.code}</td>
                  <td className="p-3 font-semibold">{prefix.displayName}</td>
                  <td className="p-3">{prefix.gender}</td>
                  <td className="p-3">{prefix.sortOrder}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${prefix.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {prefix.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(prefix)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(prefix.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
