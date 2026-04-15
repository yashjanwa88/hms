import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { auditService } from '../services/auditService';
import { formatDateTime } from '@/lib/utils';
import { FileSearch, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_PILL: Record<string, string> = {
  CREATE: 'status-active',
  UPDATE: 'status-serving',
  DELETE: 'status-emergency',
  MERGE:  'status-pill bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PAYMENT:'status-done',
  REFUND: 'status-waiting',
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState({
    entityName: '', action: '', serviceName: '',
    pageNumber: 1, pageSize: 20,
  });

  const { data: response, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditService.searchLogs(filters),
  });

  const logs = response?.data?.items ?? [];
  const totalCount: number = response?.data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / filters.pageSize);

  const set = (patch: Partial<typeof filters>) =>
    setFilters(f => ({ ...f, ...patch, pageNumber: 1 }));

  const selectCls = 'h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track all system actions across services for compliance and security.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select className={selectCls} value={filters.serviceName} onChange={e => set({ serviceName: e.target.value })}>
              <option value="">All Services</option>
              {['PatientService','BillingService','DoctorService','AppointmentService','PharmacyService','LaboratoryService','EncounterService'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select className={selectCls} value={filters.entityName} onChange={e => set({ entityName: e.target.value })}>
              <option value="">All Entities</option>
              {['Patient','Doctor','Appointment','Invoice','Payment','Refund','Medicine','LabTest'].map(e => (
                <option key={e}>{e}</option>
              ))}
            </select>

            <select className={selectCls} value={filters.action} onChange={e => set({ action: e.target.value })}>
              <option value="">All Actions</option>
              {['CREATE','UPDATE','DELETE','MERGE','PAYMENT','REFUND'].map(a => (
                <option key={a}>{a}</option>
              ))}
            </select>

            <Button variant="ghost" size="sm" className="text-xs text-slate-500"
              onClick={() => setFilters({ entityName: '', action: '', serviceName: '', pageNumber: 1, pageSize: 20 })}>
              Clear
            </Button>

            <span className="ml-auto text-xs text-slate-400">
              {totalCount > 0 ? `${totalCount} records` : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <FileSearch className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Service</th>
                    <th>User</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td>
                        <span className={ACTION_PILL[log.action] ?? 'status-inactive'}>
                          {log.action}
                        </span>
                      </td>
                      <td className="font-medium text-slate-900 dark:text-white">{log.entityName}</td>
                      <td className="text-slate-500 text-xs">{log.serviceName}</td>
                      <td className="text-slate-500 text-xs font-mono">{log.userId?.slice(0, 8) ?? '—'}</td>
                      <td className="text-xs text-slate-500 tabular-nums">{formatDateTime(log.createdAt)}</td>
                      <td>
                        {log.newData && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary hover:underline">View</summary>
                            <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-slate-50 dark:bg-slate-800 p-2 text-[10px] text-slate-600 dark:text-slate-400">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={filters.pageNumber === 1} className="gap-1"
            onClick={() => setFilters(f => ({ ...f, pageNumber: f.pageNumber - 1 }))}>
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <span className="text-xs text-slate-500">Page {filters.pageNumber} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={filters.pageNumber === totalPages} className="gap-1"
            onClick={() => setFilters(f => ({ ...f, pageNumber: f.pageNumber + 1 }))}>
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
