import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Activity, DollarSign, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
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

  if (isLoading) return <div>Loading...</div>;

  const summary = data?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Hospital Operations Overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPatients || 0}</div>
            <p className="text-xs text-green-600 mt-1">+{summary.todayRegistrations || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Visits</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEncounters || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.todayVisits || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(summary.todayRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Total: ₹{(summary.totalRevenue || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{(summary.pendingAmount || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{summary.pendingInvoices || 0} invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Refunds</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹0.00</div>
            <p className="text-xs text-gray-500 mt-1">0 refunds processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(summary.totalCollected || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">After refunds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalRevenue > 0 
                ? ((summary.totalCollected / summary.totalRevenue) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Payment efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Revenue</span>
              <span className="text-xl font-bold">₹{(summary.totalRevenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Collected</span>
              <span className="text-xl font-bold text-green-600">₹{(summary.totalCollected || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Refunded</span>
              <span className="text-xl font-bold text-orange-600">₹0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Pending Collection</span>
              <span className="text-xl font-bold text-red-600">₹{(summary.pendingAmount || 0).toFixed(2)}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Net Revenue (After Refunds)</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{(summary.totalCollected || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Operations Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Encounters</span>
              <span className="text-xl font-bold">{summary.totalEncounters || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Active Encounters</span>
              <span className="text-xl font-bold text-blue-600">{summary.activeEncounters || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Invoices</span>
              <span className="text-xl font-bold">{summary.totalInvoices || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Pending Invoices</span>
              <span className="text-xl font-bold text-yellow-600">{summary.pendingInvoices || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm border-l-2 border-blue-500 pl-3 py-1">
                    <div className="flex-1">
                      <div className="font-medium">
                        <span className="text-blue-600">{log.action}</span>
                        <span className="mx-1">on</span>
                        <span className="font-semibold">{log.entityName}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.serviceName} • {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
