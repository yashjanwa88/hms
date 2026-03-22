import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Plus, Edit, Trash2, Save, X, Search, Settings, DollarSign, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { RegistrationTypeModel, RegistrationParamInfoDetailModel, PatientRegistrationFeeDetailModel } from '../types';
import api from '@/lib/api';

const BASE = import.meta.env.VITE_PATIENT_SERVICE_URL;

export function RegistrationTypesMaster() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<Partial<RegistrationTypeModel>>({
    code: '',
    name: '',
    displayName: '',
    description: '',
    regCategory: 'GEENRALCATEGORY',
    color: '#10B981',
    icon: 'clipboard',
    sortOrder: 0,
    isActive: true,
    isDefault: false,
    validityDays: 365,
    registrationFee: 0,
    renewalFee: 0,
    registrationParamInfoDetail: [
      { patientRegistrationFeature: 'PERSONALIDENTIFICATION', enable: true, expand: false, required: false, sortOrder: 1 },
      { patientRegistrationFeature: 'FERTILITYINFORMATION', enable: false, expand: false, required: false, sortOrder: 2 },
      { patientRegistrationFeature: 'CONTACTDETAIL', enable: true, expand: true, required: true, sortOrder: 3 },
      { patientRegistrationFeature: 'EMERGENCYCONTACTDETAIL', enable: true, expand: false, required: false, sortOrder: 4 },
      { patientRegistrationFeature: 'REFFERALDETAIL', enable: true, expand: false, required: false, sortOrder: 5 },
      { patientRegistrationFeature: 'BIOMETRIXDETAIL', enable: true, expand: false, required: false, sortOrder: 6 },
      { patientRegistrationFeature: 'INSURANCEDETAIL', enable: true, expand: false, required: false, sortOrder: 7 },
      { patientRegistrationFeature: 'PATIENTDEATHDETAIL', enable: false, expand: false, required: false, sortOrder: 8 },
    ],
    registrationFeeDetail: [],
    patientTypeDetail: [],
  });

  const { data: registrationTypesData, isLoading } = useQuery({
    queryKey: ['registration-types'],
    queryFn: () => api.get(`${BASE}/api/patients/registration-types`).then(r => r.data?.data ?? []),
  });

  const { data: patientTypesData } = useQuery({
    queryKey: ['patient-types'],
    queryFn: () => api.get(`${BASE}/api/patients/types`).then(r => r.data?.data ?? []),
  });

  const registrationTypes = registrationTypesData || [];
  const patientTypes = patientTypesData || [];
  
  const filteredTypes = registrationTypes.filter((type: RegistrationTypeModel) =>
    type.name.toLowerCase().includes(searchText.toLowerCase()) ||
    type.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: Partial<RegistrationTypeModel>) =>
      api.post(`${BASE}/api/patients/registration-types`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Registration type created successfully');
      queryClient.invalidateQueries({ queryKey: ['registration-types'] });
      handleCancel();
    },
    onError: () => {
      toast.error('Failed to create registration type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<RegistrationTypeModel>) =>
      api.put(`${BASE}/api/patients/registration-types/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Registration type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['registration-types'] });
      handleCancel();
    },
    onError: () => {
      toast.error('Failed to update registration type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`${BASE}/api/patients/registration-types/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Registration type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['registration-types'] });
    },
    onError: () => {
      toast.error('Failed to delete registration type');
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

  const handleEdit = (type: RegistrationTypeModel) => {
    setFormData(type);
    setEditingId(type.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this registration type?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      displayName: '',
      description: '',
      regCategory: 'GEENRALCATEGORY',
      color: '#10B981',
      icon: 'clipboard',
      sortOrder: 0,
      isActive: true,
      isDefault: false,
      validityDays: 365,
      registrationFee: 0,
      renewalFee: 0,
      registrationParamInfoDetail: [
        { patientRegistrationFeature: 'PERSONALIDENTIFICATION', enable: true, expand: false, required: false, sortOrder: 1 },
        { patientRegistrationFeature: 'FERTILITYINFORMATION', enable: false, expand: false, required: false, sortOrder: 2 },
        { patientRegistrationFeature: 'CONTACTDETAIL', enable: true, expand: true, required: true, sortOrder: 3 },
        { patientRegistrationFeature: 'EMERGENCYCONTACTDETAIL', enable: true, expand: false, required: false, sortOrder: 4 },
        { patientRegistrationFeature: 'REFFERALDETAIL', enable: true, expand: false, required: false, sortOrder: 5 },
        { patientRegistrationFeature: 'BIOMETRIXDETAIL', enable: true, expand: false, required: false, sortOrder: 6 },
        { patientRegistrationFeature: 'INSURANCEDETAIL', enable: true, expand: false, required: false, sortOrder: 7 },
        { patientRegistrationFeature: 'PATIENTDEATHDETAIL', enable: false, expand: false, required: false, sortOrder: 8 },
      ],
      registrationFeeDetail: [],
      patientTypeDetail: [],
    });
    setEditingId(null);
    setShowForm(false);
    setActiveTab('basic');
  };

  const updateFeatureConfig = (index: number, field: keyof RegistrationParamInfoDetailModel, value: any) => {
    const updated = [...(formData.registrationParamInfoDetail || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, registrationParamInfoDetail: updated });
  };

  const addFeeDetail = () => {
    const newFee: PatientRegistrationFeeDetailModel = {
      registrationTypeId: editingId || '',
      patientTypeId: '',
      patientTypeName: '',
      registrationFee: 0,
      renewalFee: 0,
      validityDays: 365,
      isActive: true,
    };
    setFormData({
      ...formData,
      registrationFeeDetail: [...(formData.registrationFeeDetail || []), newFee],
    });
  };

  const removeFeeDetail = (index: number) => {
    const updated = [...(formData.registrationFeeDetail || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, registrationFeeDetail: updated });
  };

  const updateFeeDetail = (index: number, field: keyof PatientRegistrationFeeDetailModel, value: any) => {
    const updated = [...(formData.registrationFeeDetail || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, registrationFeeDetail: updated });
  };

  const getFeatureLabel = (feature: string) => {
    const labels: Record<string, string> = {
      'PERSONALIDENTIFICATION': 'Personal Identification',
      'FERTILITYINFORMATION': 'Fertility Information',
      'CONTACTDETAIL': 'Contact Details',
      'EMERGENCYCONTACTDETAIL': 'Emergency Contact',
      'REFFERALDETAIL': 'Referral Details',
      'BIOMETRIXDETAIL': 'Biometric Details',
      'INSURANCEDETAIL': 'Insurance Details',
      'PATIENTDEATHDETAIL': 'Death Details',
    };
    return labels[feature] || feature;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Registration Types Master</h1>
          <p className="text-gray-600 mt-1">Configure registration types with fees and features</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Registration Type
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Registration Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="features">Features Config</TabsTrigger>
                  <TabsTrigger value="fees">Fee Structure</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
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
                        placeholder="e.g., General Registration"
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
                      <Label>Category *</Label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={formData.regCategory}
                        onChange={(e) => setFormData({ ...formData, regCategory: e.target.value as any })}
                        required
                      >
                        <option value="GEENRALCATEGORY">General Category</option>
                        <option value="ACCIDENTANDEMERGENCYCATEGORY">Accident & Emergency</option>
                        <option value="STAFFCATEGORY">Staff Category</option>
                      </select>
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
                        />
                      </div>
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
                      <Label>Validity (Days)</Label>
                      <Input
                        type="number"
                        value={formData.validityDays}
                        onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Registration Fee (₹)</Label>
                      <Input
                        type="number"
                        value={formData.registrationFee}
                        onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Renewal Fee (₹)</Label>
                      <Input
                        type="number"
                        value={formData.renewalFee}
                        onChange={(e) => setFormData({ ...formData, renewalFee: Number(e.target.value) })}
                        min="0"
                        step="0.01"
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
                </TabsContent>

                {/* Features Config Tab */}
                <TabsContent value="features" className="space-y-4 mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      Configure which features are enabled, expanded by default, and required for this registration type.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4 font-semibold text-sm bg-gray-50 p-3 rounded">
                      <div>Feature</div>
                      <div className="text-center">Enable</div>
                      <div className="text-center">Expand</div>
                      <div className="text-center">Required</div>
                      <div className="text-center">Sort Order</div>
                    </div>
                    {formData.registrationParamInfoDetail?.map((feature, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 items-center p-3 border rounded hover:bg-gray-50">
                        <div className="font-medium">{getFeatureLabel(feature.patientRegistrationFeature)}</div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={feature.enable}
                            onChange={(e) => updateFeatureConfig(index, 'enable', e.target.checked)}
                            className="rounded"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={feature.expand}
                            onChange={(e) => updateFeatureConfig(index, 'expand', e.target.checked)}
                            disabled={!feature.enable}
                            className="rounded"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={feature.required}
                            onChange={(e) => updateFeatureConfig(index, 'required', e.target.checked)}
                            disabled={!feature.enable}
                            className="rounded"
                          />
                        </div>
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            value={feature.sortOrder}
                            onChange={(e) => updateFeatureConfig(index, 'sortOrder', Number(e.target.value))}
                            className="w-20 text-center"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Fee Structure Tab */}
                <TabsContent value="fees" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Configure different fees for different patient types</p>
                    <Button type="button" size="sm" onClick={addFeeDetail}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee
                    </Button>
                  </div>
                  {formData.registrationFeeDetail && formData.registrationFeeDetail.length > 0 ? (
                    <div className="space-y-3">
                      {formData.registrationFeeDetail.map((fee, index) => (
                        <div key={index} className="grid grid-cols-6 gap-3 items-end p-3 border rounded">
                          <div>
                            <Label>Patient Type</Label>
                            <select
                              className="w-full border rounded px-2 py-2 text-sm"
                              value={fee.patientTypeId}
                              onChange={(e) => {
                                const selectedType = patientTypes.find((pt: any) => pt.id === e.target.value);
                                updateFeeDetail(index, 'patientTypeId', e.target.value);
                                updateFeeDetail(index, 'patientTypeName', selectedType?.name || '');
                              }}
                            >
                              <option value="">Select</option>
                              {patientTypes.map((pt: any) => (
                                <option key={pt.id} value={pt.id}>{pt.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Registration Fee</Label>
                            <Input
                              type="number"
                              value={fee.registrationFee}
                              onChange={(e) => updateFeeDetail(index, 'registrationFee', Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label>Renewal Fee</Label>
                            <Input
                              type="number"
                              value={fee.renewalFee}
                              onChange={(e) => updateFeeDetail(index, 'renewalFee', Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label>Validity Days</Label>
                            <Input
                              type="number"
                              value={fee.validityDays}
                              onChange={(e) => updateFeeDetail(index, 'validityDays', Number(e.target.value))}
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={fee.isActive}
                                onChange={(e) => updateFeeDetail(index, 'isActive', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                          </div>
                          <div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFeeDetail(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded">
                      No fee structure configured. Click "Add Fee" to configure.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
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
          <CardTitle>Registration Types ({filteredTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No registration types found</div>
          ) : (
            <div className="space-y-4">
              {filteredTypes.map((type: RegistrationTypeModel) => (
                <div key={type.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <h3 className="font-semibold text-lg">{type.displayName}</h3>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{type.code}</span>
                        {type.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Default</span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 font-medium">{type.regCategory.replace('CATEGORY', '')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Validity:</span>
                          <span className="ml-2 font-medium">{type.validityDays} days</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reg Fee:</span>
                          <span className="ml-2 font-medium">₹{type.registrationFee}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Renewal Fee:</span>
                          <span className="ml-2 font-medium">₹{type.renewalFee}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
