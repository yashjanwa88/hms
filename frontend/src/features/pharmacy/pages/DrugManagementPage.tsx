import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import pharmacyService, { Drug, CreateDrugRequest, CreateBatchRequest } from '../services/pharmacyService';
import {
  Plus, Search, Package, X, RefreshCw,
  AlertTriangle, CheckCircle2, Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';

const selectCls = 'h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Patch', 'Suppository'];

const EMPTY_DRUG: CreateDrugRequest = {
  drugCode: '', drugName: '', genericName: '', category: '',
  manufacturer: '', strength: '', dosageForm: 'Tablet',
  unitPrice: 0, reorderLevel: 10, isControlled: false, requiresPrescription: true,
};

const EMPTY_BATCH: CreateBatchRequest = {
  drugId: '', batchNumber: '', manufactureDate: '', expiryDate: '',
  quantity: 0, costPrice: 0, sellingPrice: 0, supplier: '',
};

export function DrugManagementPage() {
  const [search, setSearch]             = useState('');
  const [showDrugModal, setShowDrugModal]   = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [drugForm, setDrugForm]         = useState(EMPTY_DRUG);
  const [batchForm, setBatchForm]       = useState(EMPTY_BATCH);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['drugs'],
    queryFn: pharmacyService.getDrugs,
  });

  const drugs: Drug[] = data?.data ?? [];
  const filtered = drugs.filter(d =>
    d.drugName.toLowerCase().includes(search.toLowerCase()) ||
    d.genericName.toLowerCase().includes(search.toLowerCase()) ||
    d.drugCode.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  const createDrug = useMutation({
    mutationFn: (d: CreateDrugRequest) => pharmacyService.createDrug(d),
    onSuccess: () => { toast.success('Drug added'); setShowDrugModal(false); setDrugForm(EMPTY_DRUG); qc.invalidateQueries({ queryKey: ['drugs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to add drug'),
  });

  const createBatch = useMutation({
    mutationFn: (d: CreateBatchRequest) => pharmacyService.createBatch(d),
    onSuccess: () => { toast.success('Batch added'); setShowBatchModal(false); setBatchForm(EMPTY_BATCH); qc.invalidateQueries({ queryKey: ['drugs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to add batch'),
  });

  const openBatchModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setBatchForm({ ...EMPTY_BATCH, drugId: drug.id });
    setShowBatchModal(true);
  };

  const totalDrugs   = drugs.length;
  const activeDrugs  = drugs.filter(d => d.isActive).length;
  const lowStock     = drugs.filter(d => d.availableStock < d.reorderLevel).length;
  const outOfStock   = drugs.filter(d => d.availableStock === 0).length;

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Drug Management</h1>
          <p className="page-subtitle">Manage drug formulary, batches, and stock levels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => setShowDrugModal(true)}>
            <Plus className="h-4 w-4" /> Add Drug
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Drugs',  value: totalDrugs,  icon: Pill,          color: 'stat-blue',  text: 'text-blue-600'    },
          { label: 'Active',       value: activeDrugs, icon: CheckCircle2,  color: 'stat-green', text: 'text-emerald-600' },
          { label: 'Low Stock',    value: lowStock,    icon: AlertTriangle, color: 'stat-amber', text: 'text-amber-600'   },
          { label: 'Out of Stock', value: outOfStock,  icon: Package,       color: 'stat-rose',  text: 'text-rose-600'    },
        ].map(s => (
          <Card key={s.label} className={s.color}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.text}`} />
              </div>
              <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, code, category…" className="pl-9 h-9 text-sm" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Drug Formulary
            <span className="ml-auto text-xs font-normal text-slate-400">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Pill className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">{search ? 'No drugs match your search' : 'No drugs added yet'}</p>
              {!search && <Button size="sm" onClick={() => setShowDrugModal(true)}>Add First Drug</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Drug Name</th>
                    <th>Generic</th>
                    <th>Category</th>
                    <th>Strength / Form</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Stock</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const isLow = d.availableStock < d.reorderLevel;
                    const isOut = d.availableStock === 0;
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-xs font-semibold text-primary">{d.drugCode}</td>
                        <td>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{d.drugName}</p>
                            <div className="flex gap-1 mt-0.5">
                              {d.isControlled && <span className="status-pill bg-amber-50 text-amber-700 text-[9px]">Controlled</span>}
                              {d.requiresPrescription && <span className="status-pill bg-blue-50 text-blue-700 text-[9px]">Rx</span>}
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-500 text-sm">{d.genericName}</td>
                        <td className="text-slate-500 text-sm">{d.category}</td>
                        <td className="text-sm">{d.strength} · {d.dosageForm}</td>
                        <td className="text-right font-semibold text-sm">₹{d.unitPrice.toFixed(2)}</td>
                        <td className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn('text-sm font-bold', isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
                              {d.availableStock}
                            </span>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500')}
                                style={{ width: `${Math.min((d.availableStock / Math.max(d.reorderLevel * 2, 1)) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={d.isActive ? 'status-active' : 'status-inactive'}>{d.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="text-center">
                          <button className="icon-btn" title="Add Batch" onClick={() => openBatchModal(d)}>
                            <Package className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Drug Modal */}
      {showDrugModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Add New Drug</CardTitle>
                <button className="icon-btn" onClick={() => { setShowDrugModal(false); setDrugForm(EMPTY_DRUG); }}><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={e => { e.preventDefault(); createDrug.mutate(drugForm); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Drug Code *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.drugCode} onChange={e => setDrugForm({ ...drugForm, drugCode: e.target.value })} placeholder="e.g. PARA500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Category *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.category} onChange={e => setDrugForm({ ...drugForm, category: e.target.value })} placeholder="e.g. Antibiotic" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Drug Name *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.drugName} onChange={e => setDrugForm({ ...drugForm, drugName: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Generic Name *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.genericName} onChange={e => setDrugForm({ ...drugForm, genericName: e.target.value })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Manufacturer *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.manufacturer} onChange={e => setDrugForm({ ...drugForm, manufacturer: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Strength *</Label>
                    <Input className="h-9 text-sm" required value={drugForm.strength} onChange={e => setDrugForm({ ...drugForm, strength: e.target.value })} placeholder="e.g. 500mg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Dosage Form *</Label>
                    <select className={selectCls} value={drugForm.dosageForm} onChange={e => setDrugForm({ ...drugForm, dosageForm: e.target.value })}>
                      {DOSAGE_FORMS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Unit Price (₹) *</Label>
                    <Input className="h-9 text-sm" type="number" step="0.01" min="0" required value={drugForm.unitPrice} onChange={e => setDrugForm({ ...drugForm, unitPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Reorder Level *</Label>
                    <Input className="h-9 text-sm" type="number" min="0" required value={drugForm.reorderLevel} onChange={e => setDrugForm({ ...drugForm, reorderLevel: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary" checked={drugForm.isControlled} onChange={e => setDrugForm({ ...drugForm, isControlled: e.target.checked })} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Controlled Drug</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary" checked={drugForm.requiresPrescription} onChange={e => setDrugForm({ ...drugForm, requiresPrescription: e.target.checked })} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Requires Prescription</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="submit" size="sm" className="flex-1 shadow-md shadow-primary/20" disabled={createDrug.isPending}>
                    {createDrug.isPending ? 'Adding…' : 'Add Drug'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowDrugModal(false); setDrugForm(EMPTY_DRUG); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && selectedDrug && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Add Stock Batch</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDrug.drugName} · {selectedDrug.strength}</p>
                </div>
                <button className="icon-btn" onClick={() => { setShowBatchModal(false); setBatchForm(EMPTY_BATCH); }}><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={e => { e.preventDefault(); createBatch.mutate(batchForm); }} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Batch Number *</Label>
                  <Input className="h-9 text-sm" required value={batchForm.batchNumber} onChange={e => setBatchForm({ ...batchForm, batchNumber: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Manufacture Date *</Label>
                    <Input className="h-9 text-sm" type="date" required value={batchForm.manufactureDate} onChange={e => setBatchForm({ ...batchForm, manufactureDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Expiry Date *</Label>
                    <Input className="h-9 text-sm" type="date" required value={batchForm.expiryDate} onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Quantity *</Label>
                    <Input className="h-9 text-sm" type="number" min="1" required value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Supplier</Label>
                    <Input className="h-9 text-sm" value={batchForm.supplier} onChange={e => setBatchForm({ ...batchForm, supplier: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Cost Price (₹) *</Label>
                    <Input className="h-9 text-sm" type="number" step="0.01" min="0" required value={batchForm.costPrice} onChange={e => setBatchForm({ ...batchForm, costPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Selling Price (₹) *</Label>
                    <Input className="h-9 text-sm" type="number" step="0.01" min="0" required value={batchForm.sellingPrice} onChange={e => setBatchForm({ ...batchForm, sellingPrice: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="submit" size="sm" className="flex-1 shadow-md shadow-primary/20" disabled={createBatch.isPending}>
                    {createBatch.isPending ? 'Adding…' : 'Add Batch'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowBatchModal(false); setBatchForm(EMPTY_BATCH); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
