import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import pharmacyService, { Prescription, CreatePrescriptionRequest, Drug } from '../services/pharmacyService';
import {
  Plus, CheckCircle, XCircle, FileText, Search,
  RefreshCw, X, Trash2, Clock, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_PILL: Record<string, string> = {
  Pending:   'status-waiting',
  Verified:  'status-serving',
  Dispensed: 'status-done',
  Cancelled: 'status-emergency',
};

const selectCls = 'h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

const EMPTY_FORM: CreatePrescriptionRequest = {
  patientId: '', encounterId: '', doctorId: '', notes: '', items: [],
};

const EMPTY_ITEM = { drugId: '', quantity: 1, dosage: '', frequency: '', duration: 7, instructions: '' };

export function PrescriptionManagementPage() {
  const [showCreate, setShowCreate]           = useState(false);
  const [showDetails, setShowDetails]         = useState(false);
  const [selected, setSelected]               = useState<Prescription | null>(null);
  const [form, setForm]                       = useState(EMPTY_FORM);
  const [itemForm, setItemForm]               = useState(EMPTY_ITEM);
  const [patientSearch, setPatientSearch]     = useState('');
  const qc = useQueryClient();

  const { data: drugsData } = useQuery({
    queryKey: ['drugs'],
    queryFn: pharmacyService.getDrugs,
  });
  const drugs: Drug[] = drugsData?.data ?? [];

  // Fetch prescriptions by patient search (when patientId entered)
  const { data: prescData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['prescriptions', patientSearch],
    queryFn: () => patientSearch
      ? pharmacyService.getPrescriptionsByPatientId(patientSearch)
      : Promise.resolve({ data: [] }),
    enabled: !!patientSearch,
  });
  const prescriptions: Prescription[] = prescData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (d: CreatePrescriptionRequest) => pharmacyService.createPrescription(d),
    onSuccess: () => { toast.success('Prescription created'); setShowCreate(false); setForm(EMPTY_FORM); qc.invalidateQueries({ queryKey: ['prescriptions'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create prescription'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.verifyPrescription(id),
    onSuccess: (res) => { toast.success('Prescription verified'); setSelected(res.data); qc.invalidateQueries({ queryKey: ['prescriptions'] }); },
    onError: () => toast.error('Failed to verify'),
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.dispensePrescription(id),
    onSuccess: (res) => { toast.success('Prescription dispensed'); setSelected(res.data); qc.invalidateQueries({ queryKey: ['prescriptions'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to dispense'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => pharmacyService.cancelPrescription(id, reason),
    onSuccess: (res) => { toast.success('Prescription cancelled'); setSelected(res.data); qc.invalidateQueries({ queryKey: ['prescriptions'] }); },
    onError: () => toast.error('Failed to cancel'),
  });

  const addItem = () => {
    if (!itemForm.drugId || !itemForm.dosage || !itemForm.frequency) {
      toast.error('Drug, dosage and frequency are required');
      return;
    }
    setForm(f => ({ ...f, items: [...f.items, { ...itemForm }] }));
    setItemForm(EMPTY_ITEM);
  };

  const removeItem = (i: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const openDetails = async (id: string) => {
    try {
      const res = await pharmacyService.getPrescriptionById(id);
      setSelected(res.data);
      setShowDetails(true);
    } catch { toast.error('Failed to load prescription'); }
  };

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Prescription Management</h1>
          <p className="page-subtitle">Create, verify, and dispense patient prescriptions.</p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Prescription
        </Button>
      </div>

      {/* Patient search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-semibold text-slate-500">Search by Patient ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Enter patient UUID to load prescriptions…" className="pl-9 h-9 text-sm" />
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => refetch()} disabled={isFetching || !patientSearch}>
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Load
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Prescriptions
            <span className="ml-auto text-xs font-normal text-slate-400">{prescriptions.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <FileText className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">{patientSearch ? 'No prescriptions found for this patient' : 'Enter a patient ID to search prescriptions'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rx Number</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs font-semibold text-primary">{p.prescriptionNumber}</td>
                      <td className="text-sm text-slate-500 tabular-nums">
                        {new Date(p.prescriptionDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="text-sm text-slate-500">{p.items?.length ?? 0} drug(s)</td>
                      <td className="text-right font-semibold text-sm">₹{p.totalAmount.toFixed(2)}</td>
                      <td className="text-center">
                        <span className={STATUS_PILL[p.status] ?? 'status-inactive'}>{p.status}</span>
                      </td>
                      <td className="text-center">
                        <button className="icon-btn" onClick={() => openDetails(p.id)} title="View Details">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Prescription Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">New Prescription</CardTitle>
                <button className="icon-btn" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}><X className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Patient & Doctor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Patient ID *</Label>
                  <Input className="h-9 text-sm" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} placeholder="Patient UUID" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Doctor ID *</Label>
                  <Input className="h-9 text-sm" required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} placeholder="Doctor UUID" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold text-slate-500">Encounter ID (optional)</Label>
                  <Input className="h-9 text-sm" value={form.encounterId} onChange={e => setForm({ ...form, encounterId: e.target.value })} placeholder="Encounter UUID" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold text-slate-500">Notes</Label>
                  <Input className="h-9 text-sm" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinical notes…" />
                </div>
              </div>

              {/* Add medication */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add Medication</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Drug *</Label>
                    <select className={selectCls} value={itemForm.drugId} onChange={e => setItemForm({ ...itemForm, drugId: e.target.value })}>
                      <option value="">Select drug…</option>
                      {drugs.map(d => <option key={d.id} value={d.id}>{d.drugName} — {d.strength} (Stock: {d.availableStock})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Dosage *</Label>
                    <Input className="h-9 text-sm" value={itemForm.dosage} onChange={e => setItemForm({ ...itemForm, dosage: e.target.value })} placeholder="e.g. 1 tablet" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Frequency *</Label>
                    <Input className="h-9 text-sm" value={itemForm.frequency} onChange={e => setItemForm({ ...itemForm, frequency: e.target.value })} placeholder="e.g. Twice daily" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Duration (days)</Label>
                    <Input className="h-9 text-sm" type="number" min="1" value={itemForm.duration} onChange={e => setItemForm({ ...itemForm, duration: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Quantity *</Label>
                    <Input className="h-9 text-sm" type="number" min="1" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Instructions</Label>
                    <Input className="h-9 text-sm" value={itemForm.instructions} onChange={e => setItemForm({ ...itemForm, instructions: e.target.value })} placeholder="e.g. Take after meals" />
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" /> Add to Prescription
                </Button>
              </div>

              {/* Items list */}
              {form.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prescription Items ({form.items.length})</p>
                  {form.items.map((item, i) => {
                    const drug = drugs.find(d => d.id === item.drugId);
                    return (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/40">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{drug?.drugName ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration}d · Qty: {item.quantity}</p>
                        </div>
                        <button className="icon-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0 ml-2" onClick={() => removeItem(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button size="sm" className="flex-1 shadow-md shadow-primary/20"
                  disabled={createMutation.isPending || form.items.length === 0 || !form.patientId || !form.doctorId}
                  onClick={() => createMutation.mutate(form)}>
                  {createMutation.isPending ? 'Creating…' : 'Create Prescription'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prescription Details Modal */}
      {showDetails && selected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{selected.prescriptionNumber}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(selected.prescriptionDate).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={STATUS_PILL[selected.status] ?? 'status-inactive'}>{selected.status}</span>
                  <button className="icon-btn" onClick={() => setShowDetails(false)}><X className="h-4 w-4" /></button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-400">Total Amount</p><p className="font-bold text-lg text-slate-900 dark:text-white">₹{selected.totalAmount.toFixed(2)}</p></div>
                {selected.dispensedAt && <div><p className="text-xs text-slate-400">Dispensed</p><p className="font-semibold">{new Date(selected.dispensedAt).toLocaleDateString('en-IN')}</p></div>}
                {selected.notes && <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-700 dark:text-slate-300">{selected.notes}</p></div>}
              </div>

              {/* Items */}
              {selected.items?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medications</p>
                  {selected.items.map(item => (
                    <div key={item.id} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.drugName} {item.strength}</p>
                        <span className={item.isDispensed ? 'status-done text-[10px]' : 'status-waiting text-[10px]'}>
                          {item.isDispensed ? 'Dispensed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.dosage} · {item.frequency} · {item.duration}d · Qty: {item.quantity} · ₹{item.amount.toFixed(2)}</p>
                      {item.instructions && <p className="text-xs text-slate-400 mt-0.5 italic">{item.instructions}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {selected.status === 'Pending' && (
                  <Button size="sm" className="gap-1.5" onClick={() => verifyMutation.mutate(selected.id)} disabled={verifyMutation.isPending}>
                    <CheckCircle className="h-3.5 w-3.5" /> Verify
                  </Button>
                )}
                {(selected.status === 'Verified' || selected.status === 'Pending') && (
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                    onClick={() => dispenseMutation.mutate(selected.id)} disabled={dispenseMutation.isPending}>
                    <Clock className="h-3.5 w-3.5" /> Dispense
                  </Button>
                )}
                {selected.status !== 'Dispensed' && selected.status !== 'Cancelled' && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => { const r = prompt('Cancellation reason?'); if (r) cancelMutation.mutate({ id: selected.id, reason: r }); }}
                    disabled={cancelMutation.isPending}>
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowDetails(false)} className="ml-auto">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
