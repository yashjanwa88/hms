import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { visitService, CreateVisitRequest, EmergencyVisitRequest } from '../services/visitService';
import {
  Plus, Search, Clock, AlertTriangle, Activity,
  Eye, CheckCircle, XCircle, Users, Bed, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_PILL: Record<string, string> = {
  Waiting:    'status-waiting',
  InProgress: 'status-serving',
  Completed:  'status-done',
  Cancelled:  'status-emergency',
};

const PRIORITY_PILL: Record<string, string> = {
  Emergency: 'status-emergency',
  Urgent:    'status-waiting',
  Normal:    'status-active',
};

const selectCls = 'h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

const EMPTY_CREATE: CreateVisitRequest = {
  patientId: '00000000-0000-0000-0000-000000000000',
  patientUHID: '', doctorId: '00000000-0000-0000-0000-000000000000',
  doctorName: '', department: '', visitType: 'OPD',
  priority: 'Normal', chiefComplaint: '', symptoms: '',
  isEmergency: false, consultationFee: 0,
};

const EMPTY_EMERGENCY: EmergencyVisitRequest = {
  patientId: '00000000-0000-0000-0000-000000000000',
  patientUHID: '', doctorId: '00000000-0000-0000-0000-000000000000',
  doctorName: '', chiefComplaint: '', symptoms: '',
  priority: 'Emergency', vitalSigns: '',
};

export function VisitsPage() {
  const [tab, setTab]                   = useState<'list' | 'create' | 'emergency'>('list');
  const [searchParams, setSearchParams] = useState({ visitNumber: '', patientUHID: '', department: '', status: '', visitType: '', fromDate: '', toDate: '' });
  const [createForm, setCreateForm]     = useState(EMPTY_CREATE);
  const [emergencyForm, setEmergencyForm] = useState(EMPTY_EMERGENCY);
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data: visitsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['visits', searchParams],
    queryFn: () => visitService.searchVisits({ ...searchParams, pageNumber: 1, pageSize: 20 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['visitStats'],
    queryFn: visitService.getVisitStats,
    refetchInterval: 60_000,
  });

  const s = statsData?.data;
  const visits = visitsData?.data?.items ?? [];

  const createVisit    = useMutation({ mutationFn: visitService.createVisit,         onSuccess: () => { toast.success('Visit created'); setTab('list'); queryClient.invalidateQueries({ queryKey: ['visits', 'visitStats'] }); }, onError: () => toast.error('Failed') });
  const createEmergency= useMutation({ mutationFn: visitService.createEmergencyVisit,onSuccess: () => { toast.success('Emergency visit created'); setTab('list'); queryClient.invalidateQueries({ queryKey: ['visits', 'visitStats'] }); }, onError: () => toast.error('Failed') });
  const checkIn        = useMutation({ mutationFn: visitService.checkInVisit,        onSuccess: () => { toast.success('Checked in'); queryClient.invalidateQueries({ queryKey: ['visits'] }); }, onError: () => toast.error('Failed') });
  const checkOut       = useMutation({ mutationFn: visitService.checkOutVisit,       onSuccess: () => { toast.success('Checked out'); queryClient.invalidateQueries({ queryKey: ['visits'] }); }, onError: () => toast.error('Failed') });

  const statCards = [
    { label: 'Total',       value: s?.totalVisits    ?? 0, icon: Activity,      color: 'stat-blue',   text: 'text-blue-600'    },
    { label: 'Today',       value: s?.todayVisits    ?? 0, icon: Clock,         color: 'stat-green',  text: 'text-emerald-600' },
    { label: 'Active',      value: s?.activeVisits   ?? 0, icon: Users,         color: 'stat-amber',  text: 'text-amber-600'   },
    { label: 'Emergency',   value: s?.emergencyVisits?? 0, icon: AlertTriangle, color: 'stat-rose',   text: 'text-rose-600'    },
    { label: 'IPD Convert', value: s?.ipdConversions ?? 0, icon: Bed,           color: 'stat-violet', text: 'text-violet-600'  },
    { label: 'Completed',   value: s?.completedVisits?? 0, icon: CheckCircle,   color: 'stat-green',  text: 'text-emerald-600' },
  ];

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Visit Management</h1>
          <p className="page-subtitle">Track OPD visits, check-ins, and emergency encounters.</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm" variant="outline"
            className={cn('gap-1.5', tab === 'list' && 'border-primary text-primary')}
            onClick={() => setTab('list')}
          >
            <Search className="h-3.5 w-3.5" /> List
          </Button>
          <Button
            size="sm" variant="outline"
            className={cn('gap-1.5', tab === 'create' && 'border-primary text-primary')}
            onClick={() => setTab('create')}
          >
            <Plus className="h-3.5 w-3.5" /> New Visit
          </Button>
          <Button
            size="sm"
            className={cn('gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20')}
            onClick={() => setTab('emergency')}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Emergency
          </Button>
        </div>
      </div>

      {/* Stats */}
      {s && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(sc => (
            <Card key={sc.label} className={sc.color}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{sc.label}</p>
                  <sc.icon className={`h-3.5 w-3.5 ${sc.text}`} />
                </div>
                <p className={`text-2xl font-black ${sc.text}`}>{sc.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Visit form */}
      {tab === 'create' && (
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-sm font-semibold">New Visit</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={e => { e.preventDefault(); createVisit.mutate(createForm); }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Patient UHID *</Label>
                <Input className="h-9 text-sm" required value={createForm.patientUHID}
                  onChange={e => setCreateForm({ ...createForm, patientUHID: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Doctor Name *</Label>
                <Input className="h-9 text-sm" required value={createForm.doctorName}
                  onChange={e => setCreateForm({ ...createForm, doctorName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Department *</Label>
                <select className={selectCls} required value={createForm.department}
                  onChange={e => setCreateForm({ ...createForm, department: e.target.value })}>
                  <option value="">Select</option>
                  {['General Medicine','Cardiology','Orthopedics','Pediatrics'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs font-semibold text-slate-500">Chief Complaint</Label>
                <Input className="h-9 text-sm" value={createForm.chiefComplaint}
                  onChange={e => setCreateForm({ ...createForm, chiefComplaint: e.target.value })} />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <Button type="submit" size="sm" className="shadow-md shadow-primary/20" disabled={createVisit.isPending}>
                  {createVisit.isPending ? 'Creating…' : 'Create Visit'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setTab('list')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Emergency form */}
      {tab === 'emergency' && (
        <Card className="border-rose-200 dark:border-rose-800/40">
          <CardHeader className="border-b border-rose-100 dark:border-rose-800/30 pb-3 bg-rose-50/50 dark:bg-rose-950/20">
            <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Emergency Visit — Quick Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={e => { e.preventDefault(); createEmergency.mutate(emergencyForm); }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Patient UHID *</Label>
                <Input className="h-9 text-sm" required value={emergencyForm.patientUHID}
                  onChange={e => setEmergencyForm({ ...emergencyForm, patientUHID: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Doctor Name *</Label>
                <Input className="h-9 text-sm" required value={emergencyForm.doctorName}
                  onChange={e => setEmergencyForm({ ...emergencyForm, doctorName: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-500">Chief Complaint *</Label>
                <Input className="h-9 text-sm" required value={emergencyForm.chiefComplaint}
                  onChange={e => setEmergencyForm({ ...emergencyForm, chiefComplaint: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-500">Symptoms *</Label>
                <Input className="h-9 text-sm" required value={emergencyForm.symptoms}
                  onChange={e => setEmergencyForm({ ...emergencyForm, symptoms: e.target.value })} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20" disabled={createEmergency.isPending}>
                  {createEmergency.isPending ? 'Creating…' : 'Create Emergency Visit'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setTab('list')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List view */}
      {tab === 'list' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Visit #</Label>
                  <Input className="h-8 text-sm" value={searchParams.visitNumber}
                    onChange={e => setSearchParams({ ...searchParams, visitNumber: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Patient UHID</Label>
                  <Input className="h-8 text-sm" value={searchParams.patientUHID}
                    onChange={e => setSearchParams({ ...searchParams, patientUHID: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Department</Label>
                  <select className={cn(selectCls, 'h-8')} value={searchParams.department}
                    onChange={e => setSearchParams({ ...searchParams, department: e.target.value })}>
                    <option value="">All</option>
                    {['General Medicine','Cardiology','Orthopedics','Pediatrics'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500">Status</Label>
                  <select className={cn(selectCls, 'h-8')} value={searchParams.status}
                    onChange={e => setSearchParams({ ...searchParams, status: e.target.value })}>
                    <option value="">All</option>
                    {['Waiting','InProgress','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Visits
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
                </div>
              ) : visits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Activity className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">No visits found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Visit #</th>
                        <th>Patient UHID</th>
                        <th>Doctor</th>
                        <th>Priority</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v: any) => (
                        <tr key={v.id}>
                          <td>
                            <button onClick={() => navigate(`/visits/${v.id}`)}
                              className="font-mono text-xs font-semibold text-primary hover:underline">
                              {v.visitNumber}
                            </button>
                          </td>
                          <td className="font-mono text-xs text-slate-500">{v.patientUHID}</td>
                          <td className="text-sm text-slate-700 dark:text-slate-300">{v.doctorName}</td>
                          <td>
                            <span className={PRIORITY_PILL[v.priority] ?? 'status-inactive'}>{v.priority}</span>
                          </td>
                          <td className="text-center">
                            <span className={STATUS_PILL[v.status] ?? 'status-inactive'}>{v.status}</span>
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-0.5">
                              <button className="icon-btn" onClick={() => navigate(`/visits/${v.id}`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {v.status === 'Waiting' && (
                                <button className="icon-btn text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={() => checkIn.mutate(v.id)} title="Check In">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {v.status === 'InProgress' && (
                                <button className="icon-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  onClick={() => checkOut.mutate(v.id)} title="Check Out">
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
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
        </>
      )}
    </div>
  );
}
