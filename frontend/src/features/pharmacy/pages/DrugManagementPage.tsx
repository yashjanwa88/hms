import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { pharmacyService } from '../services/pharmacyService';
import { Plus, Package, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Drug {
  id: string;
  drugCode: string;
  drugName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  strength: string;
  dosageForm: string;
  unitPrice: number;
  reorderLevel: number;
  availableStock: number;
  isControlled: boolean;
  requiresPrescription: boolean;
  isActive: boolean;
}

export function DrugManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDrugId, setSelectedDrugId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [drugForm, setDrugForm] = useState({
    drugCode: '',
    drugName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    strength: '',
    dosageForm: 'Tablet',
    unitPrice: 0,
    reorderLevel: 10,
    isControlled: false,
    requiresPrescription: true,
  });

  const [batchForm, setBatchForm] = useState({
    drugId: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['drugs'],
    queryFn: () => pharmacyService.getDrugs(),
  });

  const drugs = (data?.data || []) as Drug[];
  const filteredDrugs = drugs.filter(d => 
    d.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.drugCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createDrugMutation = useMutation({
    mutationFn: (data: typeof drugForm) => pharmacyService.createDrug(data),
    onSuccess: () => {
      toast.success('Drug added successfully');
      setShowModal(false);
      resetDrugForm();
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add drug');
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: typeof batchForm) => pharmacyService.createBatch(data),
    onSuccess: () => {
      toast.success('Batch added successfully');
      setShowBatchModal(false);
      resetBatchForm();
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add batch');
    },
  });

  const resetDrugForm = () => {
    setDrugForm({
      drugCode: '',
      drugName: '',
      genericName: '',
      category: '',
      manufacturer: '',
      strength: '',
      dosageForm: 'Tablet',
      unitPrice: 0,
      reorderLevel: 10,
      isControlled: false,
      requiresPrescription: true,
    });
  };

  const resetBatchForm = () => {
    setBatchForm({
      drugId: '',
      batchNumber: '',
      manufactureDate: '',
      expiryDate: '',
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      supplier: '',
    });
  };

  const openAddBatchModal = (drugId: string) => {
    setBatchForm({ ...batchForm, drugId });
    setShowBatchModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Drug Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Drug
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search drugs by name, code, or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Drug Name</th>
                    <th className="text-left p-2">Generic Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Strength</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Stock</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrugs.map((drug) => (
                    <tr key={drug.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{drug.drugCode}</td>
                      <td className="p-2 font-medium">{drug.drugName}</td>
                      <td className="p-2 text-sm text-gray-600">{drug.genericName}</td>
                      <td className="p-2 text-sm">{drug.category}</td>
                      <td className="p-2 text-sm">{drug.strength} {drug.dosageForm}</td>
                      <td className="p-2 text-right">₹{drug.unitPrice.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        <span className={drug.availableStock < drug.reorderLevel ? 'text-red-600 font-bold' : ''}>
                          {drug.availableStock}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          drug.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {drug.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openAddBatchModal(drug.id)}>
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDrugs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No drugs found matching your search' : 'No drugs available. Add your first drug!'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Drug Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-[600px] max-h-[90vh] overflow-y-auto my-8">
            <CardHeader>
              <CardTitle>Add New Drug</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); createDrugMutation.mutate(drugForm); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Drug Code *</Label>
                    <Input required value={drugForm.drugCode} onChange={(e) => setDrugForm({...drugForm, drugCode: e.target.value})} />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Input required value={drugForm.category} onChange={(e) => setDrugForm({...drugForm, category: e.target.value})} placeholder="e.g., Antibiotic" />
                  </div>
                </div>
                <div>
                  <Label>Drug Name *</Label>
                  <Input required value={drugForm.drugName} onChange={(e) => setDrugForm({...drugForm, drugName: e.target.value})} />
                </div>
                <div>
                  <Label>Generic Name *</Label>
                  <Input required value={drugForm.genericName} onChange={(e) => setDrugForm({...drugForm, genericName: e.target.value})} />
                </div>
                <div>
                  <Label>Manufacturer *</Label>
                  <Input required value={drugForm.manufacturer} onChange={(e) => setDrugForm({...drugForm, manufacturer: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Strength *</Label>
                    <Input required value={drugForm.strength} onChange={(e) => setDrugForm({...drugForm, strength: e.target.value})} placeholder="e.g., 500mg" />
                  </div>
                  <div>
                    <Label>Dosage Form *</Label>
                    <select className="w-full border rounded px-3 py-2" required value={drugForm.dosageForm} onChange={(e) => setDrugForm({...drugForm, dosageForm: e.target.value})}>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Drops">Drops</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unit Price (₹) *</Label>
                    <Input type="number" step="0.01" required value={drugForm.unitPrice} onChange={(e) => setDrugForm({...drugForm, unitPrice: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Reorder Level *</Label>
                    <Input type="number" required value={drugForm.reorderLevel} onChange={(e) => setDrugForm({...drugForm, reorderLevel: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={drugForm.isControlled} onChange={(e) => setDrugForm({...drugForm, isControlled: e.target.checked})} />
                    <span className="text-sm">Controlled Drug</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={drugForm.requiresPrescription} onChange={(e) => setDrugForm({...drugForm, requiresPrescription: e.target.checked})} />
                    <span className="text-sm">Requires Prescription</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createDrugMutation.isPending}>
                    {createDrugMutation.isPending ? 'Adding...' : 'Add Drug'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetDrugForm(); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>Add Stock Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); createBatchMutation.mutate(batchForm); }} className="space-y-4">
                <div>
                  <Label>Batch Number *</Label>
                  <Input required value={batchForm.batchNumber} onChange={(e) => setBatchForm({...batchForm, batchNumber: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Manufacture Date *</Label>
                    <Input type="date" required value={batchForm.manufactureDate} onChange={(e) => setBatchForm({...batchForm, manufactureDate: e.target.value})} />
                  </div>
                  <div>
                    <Label>Expiry Date *</Label>
                    <Input type="date" required value={batchForm.expiryDate} onChange={(e) => setBatchForm({...batchForm, expiryDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input type="number" required value={batchForm.quantity} onChange={(e) => setBatchForm({...batchForm, quantity: Number(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cost Price (₹) *</Label>
                    <Input type="number" step="0.01" required value={batchForm.costPrice} onChange={(e) => setBatchForm({...batchForm, costPrice: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Selling Price (₹) *</Label>
                    <Input type="number" step="0.01" required value={batchForm.sellingPrice} onChange={(e) => setBatchForm({...batchForm, sellingPrice: Number(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input value={batchForm.supplier} onChange={(e) => setBatchForm({...batchForm, supplier: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createBatchMutation.isPending}>
                    {createBatchMutation.isPending ? 'Adding...' : 'Add Batch'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowBatchModal(false); resetBatchForm(); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
