import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Activity, DollarSign, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import axios from 'axios';
import { auditService } from '@/features/audit/services/auditService';
import { formatDateTime } from '@/lib/utils';

const getDashboardSummary = async () => {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId');
  const userId = localStorage.getItem('userId');
  
  const response = await axios.get('http://localhost:5003/api/dashboard/summary', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': tenantId || '',
      'X-User-Id': userId || '',
    },
  });
  return response.data;
};

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30000,
  });

  const { data: auditData } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => auditService.searchLogs({ pageNumber: 1, pageSize: 10 }),
    refetchInterval: 30000,
  });

  const recentLogs = auditData?.data?.items || [];

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const summary = data?.data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('common.dashboard')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Real-time hospital operations and financial overview.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-10 gap-2">
          <RefreshCw className="h-4 w-4" />
          Live Update
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Total Patients
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalPatients?.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs font-bold text-green-600">
                +{summary.todayRegistrations || 0} today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Active Visits
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.activeEncounters || 0}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              {summary.todayVisits || 0} total visits today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Revenue (Today)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              ₹{(summary.todayRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              Across {summary.totalInvoices || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Pending
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">
              ₹{(summary.pendingAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              {summary.pendingInvoices || 0} unpaid invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Financial Performance
              </CardTitle>
              <Badge variant="success">
                {summary.totalRevenue > 0 
                  ? ((summary.totalCollected / summary.totalRevenue) * 100).toFixed(1) 
                  : 0}% Collection Rate
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <span className="text-sm font-bold text-slate-500 uppercase">Gross Revenue</span>
                  <div className="text-2xl font-black">₹{(summary.totalRevenue || 0).toLocaleString()}</div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-bold text-slate-500 uppercase">Net Collection</span>
                  <div className="text-2xl font-black text-emerald-600">₹{(summary.totalCollected || 0).toLocaleString()}</div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(summary.totalCollected / summary.totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Invoices</div>
                  <div className="text-lg font-black">{summary.totalInvoices || 0}</div>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Pending</div>
                  <div className="text-lg font-black text-rose-500">{summary.pendingInvoices || 0}</div>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Avg Ticket</div>
                  <div className="text-lg font-black">
                    ₹{summary.totalInvoices > 0 ? Math.round(summary.totalRevenue / summary.totalInvoices).toLocaleString() : 0}
                  </div>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Refunds</div>
                  <div className="text-lg font-black text-orange-500">₹0</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any, i: number) => (
                  <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                    {i !== recentLogs.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white dark:bg-slate-900 z-10" />
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {log.action}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {log.entityName} • {log.serviceName}
                      </div>
                      <div className="text-[10px] font-bold text-primary uppercase mt-1">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No recent activity found</p>
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5">
              View All Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
