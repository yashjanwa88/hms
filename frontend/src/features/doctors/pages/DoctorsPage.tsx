import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Plus, Search, Stethoscope, Users, X,
  Phone, Mail, DollarSign, RefreshCw
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { cn } from '@/lib/utils';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  mobileNumber: string;
  email: string;
  consultationFee: number;
  isActive: boolean;
}

const EMPTY_FORM = {
  firstName: '', lastName: '', mobileNumber: '', email: '',
  department: '', gender: 'Male', consultationFee: 0,
  maxPatientsPerDay: 20, profilePicture: null as File | null,
};

const selectCls = 'w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

export function DoctorsPage() {
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => doctorService.getDoctors(search),
  });

  const doctors: Doctor[] = data?.data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => doctorService.createDoctor(d),
    onSuccess: () => {
      toast.success('Doctor added');
      setShowModal(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: () => toast.error('Failed to add doctor'),
  });

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Manage clinician profiles, departments, and schedules.</p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {/* Search toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Doctor Directory
            <span className="ml-auto text-xs font-normal text-slate-400">{doctors.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No doctors found</p>
              <Button size="sm" onClick={() => setShowModal(true)}>Add First Doctor</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Contact</th>
                    <th>Fee</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {d.firstName.charAt(0)}{d.lastName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">
                            Dr. {d.firstName} {d.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-500">{d.department || '—'}</td>
                      <td>
                        <div className="space-y-0.5">
                          {d.mobileNumber && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" />{d.mobileNumber}
                            </div>
                          )}
                          {d.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" />{d.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
                          <DollarSign className="h-3 w-3 text-slate-400" />₹{d.consultationFee}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={d.isActive ? 'status-active' : 'status-inactive'}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="icon-btn" onClick={() => navigate(`/doctors/${d.id}`)}>
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

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Add Doctor</CardTitle>
                <button className="icon-btn" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <form
                onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">First Name *</Label>
                    <Input className="h-9 text-sm" required value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Last Name *</Label>
                    <Input className="h-9 text-sm" required value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Department *</Label>
                    <Input className="h-9 text-sm" required value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Gender</Label>
                    <select className={selectCls} value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs font-semibold text-slate-500">Email *</Label>
                    <Input className="h-9 text-sm" type="email" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Mobile *</Label>
                    <Input className="h-9 text-sm" type="tel" required value={form.mobileNumber}
                      onChange={e => setForm({ ...form, mobileNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Consultation Fee (₹)</Label>
                    <Input className="h-9 text-sm" type="number" min="0" value={form.consultationFee}
                      onChange={e => setForm({ ...form, consultationFee: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Max Patients/Day</Label>
                    <Input className="h-9 text-sm" type="number" min="1" max="100" value={form.maxPatientsPerDay}
                      onChange={e => setForm({ ...form, maxPatientsPerDay: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Profile Picture</Label>
                    <Input className="h-9 text-sm" type="file" accept="image/*"
                      onChange={e => setForm({ ...form, profilePicture: e.target.files?.[0] ?? null })} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="submit" size="sm" className="flex-1 shadow-md shadow-primary/20" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding…' : 'Add Doctor'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
