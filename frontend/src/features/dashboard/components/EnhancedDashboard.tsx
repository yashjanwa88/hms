import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, Activity, DollarSign, FileText, TrendingUp, AlertCircle, 
  RefreshCw, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  Pill, TestTube, Bed, Stethoscope
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CircularProgress, Progress } from '@/components/ui/Progress';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Alert } from '@/components/ui/Alert';
import { Tooltip } from '@/components/ui/Tooltip';
import api from '@/lib/api';
import { auditService } from '@/features/audit/services/auditService';
import { formatDateTime, formatDate } from '@/lib/utils';
import { useState } from 'react';

const getDashboardSummary = async () => {
  const response = await api.get(
    `${import.meta.env.VITE_PATIENT_SERVICE_URL ?? 'http://localhost:5003'}/api/dashboard/summary`
  );
  return response.data;
};

// Mock data for charts (replace with real API calls)
const weeklyData = [
  { day: 'Mon', patients: 45, revenue: 12500 },
  { day: 'Tue', patients: 52, revenue: 15200 },
  { day: 'Wed', patients: 38, revenue: 9800 },
  { day: 'Thu', patients: 61, revenue: 18500 },
  { day: 'Fri', patients: 55, revenue: 16200 },
  { day: 'Sat', patients: 32, revenue: 8500 },
  { day: 'Sun', patients: 28, revenue: 7200 },
];

const departmentStats = [
  { name: 'OPD', patients: 245, icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'IPD', patients: 48, icon: Bed, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Lab', tests: 156, icon: TestTube, color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'Pharmacy', prescriptions: 189, icon: Pill, color: 'text-rose-500', bg: 'bg-rose-50' },
];

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
  subtitle?: string;
}

function StatCard({ title, value, trend, trendLabel, icon: Icon, color, subtitle }: StatCardProps) {
  const colorConfig = {
    blue: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600',
      trend: trend && trend > 0 ? 'text-green-600' : 'text-rose-600',
    },
    emerald: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600',
      trend: trend && trend > 0 ? 'text-green-600' : 'text-rose-600',
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600',
      trend: trend && trend > 0 ? 'text-green-600' : 'text-rose-600',
    },
    rose: {
      border: 'border-l-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      icon: 'text-rose-600',
      trend: trend && trend > 0 ? 'text-green-600' : 'text-rose-600',
    },
  };

  const config = colorConfig[color];

  return (
    <Card className={`border-l-4 ${config.border} hover:shadow-lg transition-shadow duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">
          {title}
        </CardTitle>
        <div className={`h-9 w-9 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${config.icon}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900 dark:text-white">
          {typeof value === 'string' ? value : value.toLocaleString()}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-rose-500" />
            )}
            <span className={`text-xs font-bold ${config.trend}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && (
              <span className="text-xs text-slate-400 ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: typeof weeklyData }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  
  return (
    <div className="flex items-end justify-between h-40 gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1 group">
          <Tooltip content={`₹${item.revenue.toLocaleString()}`} position="top">
            <div 
              className="w-full bg-primary/80 rounded-t-md transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg"
              style={{ 
                height: `${(item.revenue / maxRevenue) * 120}px`,
                minHeight: '8px'
              }}
            />
          </Tooltip>
          <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase">
            {item.day}
          </span>
        </div>
      ))}
    </div>
  );
}

// Activity Timeline Component
function ActivityTimeline({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-4">
      {logs.slice(0, 6).map((log, index) => (
        <div key={log.id || index} className="flex gap-3 items-start">
          <div className="relative mt-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            {index < logs.length - 1 && (
              <div className="absolute top-3 left-1 w-px h-8 bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {log.action}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {log.entityName} • {log.serviceName}
            </p>
            <p className="text-[10px] font-bold text-primary uppercase mt-0.5">
              {formatDateTime(log.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EnhancedDashboard() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: auditData } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => auditService.searchLogs({ pageNumber: 1, pageSize: 10 }),
    refetchInterval: 30000,
  });

  const recentLogs = auditData?.data?.items || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch()]);
    setIsRefreshing(false);
  };

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  const summary = data?.data || {};
  const collectionRate = summary.totalRevenue > 0 
    ? ((summary.totalCollected / summary.totalRevenue) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(new Date())}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('common.dashboard')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Real-time hospital operations and financial overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={summary.totalPatients || 0}
          trend={12}
          trendLabel="this month"
          icon={Users}
          color="blue"
          subtitle={`${summary.todayRegistrations || 0} registered today`}
        />
        <StatCard
          title="Active Visits"
          value={summary.activeEncounters || 0}
          icon={Activity}
          color="emerald"
          subtitle={`${summary.todayVisits || 0} visits today`}
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(summary.todayRevenue || 0).toLocaleString()}`}
          trend={8}
          trendLabel="vs yesterday"
          icon={DollarSign}
          color="amber"
          subtitle={`${summary.totalInvoices || 0} invoices`}
        />
        <StatCard
          title="Pending Amount"
          value={`₹${(summary.pendingAmount || 0).toLocaleString()}`}
          trend={-5}
          trendLabel="decreasing"
          icon={AlertCircle}
          color="rose"
          subtitle={`${summary.pendingInvoices || 0} unpaid invoices`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Weekly Revenue Overview
              </CardTitle>
              <Badge variant="success">
                {collectionRate.toFixed(1)}% Collection Rate
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart data={weeklyData} />
            
            {/* Revenue Details */}
            <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Gross Revenue</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₹{(summary.totalRevenue || 0).toLocaleString()}
                </div>
                <Progress 
                  value={summary.totalRevenue || 0} 
                  max={summary.totalRevenue || 1} 
                  size="sm" 
                  color="primary"
                  className="mt-2"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Net Collection</span>
                <div className="text-xl font-black text-emerald-600 mt-1">
                  ₹{(summary.totalCollected || 0).toLocaleString()}
                </div>
                <Progress 
                  value={summary.totalCollected || 0} 
                  max={summary.totalRevenue || 1} 
                  size="sm" 
                  color="success"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Activity */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {recentLogs.length > 0 ? (
              <ActivityTimeline logs={recentLogs} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm font-medium">No recent activity</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departmentStats.map((dept) => (
          <Card key={dept.name} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${dept.bg} flex items-center justify-center`}>
                  <dept.icon className={`h-6 w-6 ${dept.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {(dept as any).patients || (dept as any).tests || (dept as any).prescriptions}
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    {dept.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {(summary.lowStockItems?.length > 0 || summary.pendingCritical > 0) && (
        <div className="space-y-4">
          {summary.lowStockItems?.length > 0 && (
            <Alert
              variant="warning"
              title="Low Stock Alert"
              message={`${summary.lowStockItems.length} items are running low on stock in pharmacy inventory.`}
              actions={
                <Button size="sm" variant="outline">
                  View Inventory
                </Button>
              }
            />
          )}
          {summary.pendingCritical > 0 && (
            <Alert
              variant="error"
              title="Critical Pending Items"
              message={`${summary.pendingCritical} critical items require immediate attention.`}
              actions={
                <Button size="sm" variant="destructive">
                  Take Action
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}