import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, Users, Play, ChevronDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { queueService } from '@/services/queueService';
import { toast } from 'sonner';
import type { QueueToken } from '@/types';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const cfg = {
    blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600' },
    emerald:{ border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
    amber:  { border: 'border-l-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
    rose:   { border: 'border-l-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20',   text: 'text-rose-600' },
  }[color];

  return (
    <Card className={`border-l-4 ${cfg.border}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${cfg.text}`} />
          </div>
        </div>
        <p className={`text-3xl font-black ${cfg.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 2) return <span className="status-emergency">Emergency</span>;
  if (priority === 1) return <span className="status-pill bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Senior</span>;
  return null;
}

export function QueueManagementDashboard() {
  const [doctorId, setDoctorId] = useState('');
  const qc = useQueryClient();

  const { data: activeData, refetch, isFetching } = useQuery({
    queryKey: ['active-queue', doctorId],
    queryFn: () => queueService.getActiveQueue(doctorId || undefined),
    refetchInterval: 10_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['queue-stats', doctorId],
    queryFn: () => queueService.getStatistics(undefined, doctorId || undefined),
    refetchInterval: 30_000,
  });

  const activeQueue: QueueToken[] = activeData?.data ?? [];
  const stats = statsData?.data;

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['queue-stats'] });
  };

  const callNext = useMutation({
    mutationFn: (id: string) => queueService.callNextPatient(id),
    onSuccess: (r) => { toast.success(r.data ? r.message ?? 'Patient called' : 'No patients waiting'); invalidate(); },
    onError: () => toast.error('Failed to call next patient'),
  });

  const callToken = useMutation({
    mutationFn: (id: string) => queueService.callSpecificToken(id),
    onSuccess: () => { toast.success('Token called'); invalidate(); },
    onError: () => toast.error('Failed to call token'),
  });

  const complete = useMutation({
    mutationFn: (id: string) => queueService.completeToken(id),
    onSuccess: () => { toast.success('Consultation completed'); invalidate(); },
    onError: () => toast.error('Failed to complete'),
  });

  const waiting    = activeQueue.filter(t => t.status === 'Waiting');
  const serving    = activeQueue.filter(t => t.status === 'Called' || t.status === 'InProgress');

  return (
    <div className="page-section">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Queue Management</h1>
          <p className="page-subtitle">Monitor and manage patient consultation queue in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Doctor filter */}
          <div className="relative">
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-8 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Doctors</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => { if (!doctorId) { toast.error('Select a doctor first'); return; } callNext.mutate(doctorId); }}
            disabled={callNext.isPending || !doctorId}
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Bell className="h-4 w-4" />
            Call Next
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Waiting"     value={waiting.length}          sub="In queue"           icon={Users}        color="blue"    />
        <StatCard label="In Progress" value={serving.length}          sub="Being consulted"    icon={Play}         color="emerald" />
        <StatCard label="Completed"   value={stats?.completedTokens ?? 0} sub="Today"          icon={CheckCircle}  color="amber"   />
        <StatCard label="Avg Wait"    value={`${stats?.avgWaitTimeMinutes ?? 0}m`} sub="Per patient" icon={Clock} color="rose"    />
      </div>

      {/* Queue board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Now Serving */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 blink" />
              Now Serving
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {serving.length > 0 ? serving.map(token => (
              <div key={token.id} className="rounded-xl border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="token-md text-primary">{token.tokenNumber}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{token.patientName}</p>
                    <p className="text-xs text-slate-500">{token.doctorName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={token.status === 'InProgress' ? 'status-serving' : 'status-waiting'}>
                      {token.status}
                    </span>
                    <PriorityBadge priority={token.priority} />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => complete.mutate(token.id)}
                  disabled={complete.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Mark Complete
                </Button>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Users className="h-10 w-10 opacity-20" />
                <p className="text-sm">No active consultation</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waiting queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Waiting Queue
              </CardTitle>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {waiting.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {waiting.length > 0 ? (
              <div className="space-y-2">
                {waiting.map((token, i) => (
                  <div
                    key={token.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
                      token.priority === 2
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40'
                        : i === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-2xl font-black shrink-0 ${
                        token.priority === 2 ? 'text-red-600' :
                        i === 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {token.tokenNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{token.patientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{token.doctorName}</p>
                          {i === 0 && <span className="status-active text-[10px]">Next</span>}
                          <PriorityBadge priority={token.priority} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">
                        {token.waitTimeMinutes ? `${Math.round(token.waitTimeMinutes)}m` : '—'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => callToken.mutate(token.id)}
                        disabled={callToken.isPending}
                        className="h-7 text-xs gap-1"
                      >
                        <Bell className="h-3 w-3" />
                        Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Users className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">Queue is empty</p>
                <p className="text-xs">Patients will appear here when tokens are assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
