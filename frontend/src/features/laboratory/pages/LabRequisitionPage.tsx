import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, FlaskConical, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { labService } from '../services/labService';
import { patientService } from '@/features/patients/services/patientService';

export function LabRequisitionPage() {
  const navigate = useNavigate();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [form, setForm] = useState({ doctorId: '', doctorName: '', priority: 'Routine', notes: '' });

  const { data: testsRes } = useQuery({ queryKey: ['lab-tests'], queryFn: labService.getLabTests });
  const tests = testsRes?.data || [];

  const { data: searchRes } = useQuery({
    queryKey: ['patient-quick-search', patientSearch],
    queryFn: () => patientService.quickSearch(patientSearch, 8),
    enabled: patientSearch.length >= 2,
  });
  const patients = searchRes || [];

  const createMutation = useMutation({
    mutationFn: labService.createLabOrder,
    onSuccess: () => { toast.success('Lab order created'); navigate('/laboratory'); },
    onError: () => toast.error('Failed to create lab order'),
  });

  const addTest = (test: any) => {
    if (!selectedTests.find(t => t.id === test.id))
      setSelectedTests(prev => [...prev, { ...test, quantity: 1 }]);
  };

  const removeTest = (id: string) => setSelectedTests(prev => prev.filter(t => t.id !== id));

  const handleSubmit = () => {
    if (!selectedPatient) return toast.error('Select a patient');
    if (selectedTests.length === 0) return toast.error('Add at least one test');
    createMutation.mutate({
      patientId: selectedPatient.id,
      patientUHID: selectedPatient.uhid,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      ...form,
      items: selectedTests.map(t => ({ testId: t.id, testName: t.name, testCode: t.code })),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/laboratory')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">New Lab Requisition</h1>
          <p className="text-sm text-slate-500">Create a diagnostic order for a patient</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient + Doctor */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name / UHID / mobile..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {patients.length > 0 && !selectedPatient && (
                <div className="border rounded-xl overflow-hidden divide-y">
                  {patients.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <p className="font-bold text-sm">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-slate-500">{p.uhid} · {p.mobileNumber}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="font-black text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-xs text-slate-500">{selectedPatient.uhid}</p>
                  <button onClick={() => setSelectedPatient(null)} className="text-xs text-rose-500 mt-1">Remove</button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Doctor Name" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option>Routine</option>
                <option>Urgent</option>
                <option>STAT</option>
              </select>
              <textarea
                placeholder="Clinical notes..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none h-20"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Test Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Available Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {tests.map((test: any) => (
                  <button
                    key={test.id}
                    onClick={() => addTest(test)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <div>
                      <p className="font-bold text-sm">{test.name}</p>
                      <p className="text-xs text-slate-500">{test.code} · ₹{test.price}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Selected Tests ({selectedTests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTests.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No tests added yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedTests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{test.name}</p>
                        <p className="text-xs text-slate-500">{test.code}</p>
                      </div>
                      <button onClick={() => removeTest(test.id)}>
                        <Trash2 className="h-4 w-4 text-rose-400 hover:text-rose-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/laboratory')}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="px-8">
              {createMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
