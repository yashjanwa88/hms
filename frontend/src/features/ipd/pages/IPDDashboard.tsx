import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ipdService, Admission } from '../services/ipdService';
import { Plus, Bed, Users, Clock, CheckCircle2, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:    'status-active',
    Admitted:  'status-active',
    Discharged:'status-done',
    Pending:   'status-waiting',
    Critical:  'status-emergency',
  };
  return <span className={map[status] ?? 'status-inactive'}>{status}</span>;
}

export default function IPDDashboard() {
  const navigate = useNavigate();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ipd-admissions'],
    queryFn: () => ipdService.getActiveAdmissions(),
  });

  const admissions: Admission[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const stats = [
    { label: 'Active Admissions', value: admissions.length,                                          icon: Bed,          color: 'stat-blue',   text: 'text-blue-600'    },
    { label: 'Critical Patients', value: admissions.filter(a => a.status === 'Critical').length,     icon: AlertCircle,  color: 'stat-rose',   text: 'text-rose-600'    },
    { label: 'Discharged Today',  value: 0,                                                           icon: CheckCircle2, color: 'stat-green',  text: 'text-emerald-600' },
    { label: 'Avg Stay (days)',   value: '3.2',                                                       icon: Clock,        color: 'stat-amber',  text: 'text-amber-600'   },
  ];

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IPD — In-Patient Department</h1>
          <p className="page-subtitle">Monitor active admissions, bed allocation, and patient status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/ipd/wards')}>
            <Bed className="h-4 w-4" /> Manage Wards
          </Button>
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> Admit Patient
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
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

      {/* Admissions table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active Admissions
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : admissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Bed className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No active admissions</p>
              <Button size="sm" onClick={() => {}}>Admit First Patient</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Ward / Bed</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map(adm => (
                    <tr key={adm.id}>
                      <td className="font-mono text-xs font-semibold text-primary">{adm.admissionNumber}</td>
                      <td>{new Date(adm.admissionDate).toLocaleDateString('en-IN')}</td>
                      <td className="max-w-[200px] truncate">{adm.reasonForAdmission}</td>
                      <td className="text-slate-500">—</td>
                      <td className="text-center"><StatusPill status={adm.status} /></td>
                      <td className="text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          Details <ChevronRight className="h-3 w-3" />
                        </Button>
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
