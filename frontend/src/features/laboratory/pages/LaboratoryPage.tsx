import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Beaker, FlaskConical, TestTube, 
  Dna, ClipboardList, Activity, Clock, CheckCircle,
  AlertCircle, Filter, Download, MoreVertical, 
  ChevronRight, ArrowUpRight, ArrowDownRight,
  ShieldCheck, History, User, Calendar, Microscope
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';
import { labService } from '../services/labService';

export function LaboratoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: () => labService.getLabOrders(),
  });

  const orders = ordersRes?.data || [];

  const stats = [
    { label: 'Active Tests', value: '24', subValue: '8 Processing', icon: Microscope, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
    { label: 'Pending Samples', value: '12', subValue: 'Action Required', icon: FlaskConical, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'down' },
    { label: 'Critical Results', value: '02', subValue: 'Immediate Review', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'down' },
    { label: 'Completed Today', value: '38', subValue: '+15% vs Yesterday', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processing':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Processing</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Pending</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Completed</Badge>;
      case 'Critical':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Critical</Badge>;
      default:
        return <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-2 py-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laboratory & Diagnostics</h1>
          <p className="page-subtitle">Manage lab orders, sample processing, and diagnostic reports.</p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          New Lab Order
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tight",
                    stat.trend === 'up' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stat.subValue}
                  </p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Sample Intake', icon: FlaskConical, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Result Entry', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Reports', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Quality Control', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Lab Masters', icon: Beaker, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Settings', icon: TestTube, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((action, i) => (
          <button key={i} className="group quick-tile">
            <div className={cn('quick-tile-icon group-hover:scale-110 transition-transform', action.bg)}>
              <action.icon className={cn('h-5 w-5', action.color)} />
            </div>
            <span className="quick-tile-label group-hover:text-primary">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Lab Orders Table Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by order #, patient name, or test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary text-base shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary" />
                Active Diagnostic Matrix
              </CardTitle>
              <Badge variant="outline" className="bg-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                {orders.length} Active Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Order Identity</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Diagnostic Test</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Patient</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Timeline</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {orders.map((order: any) => (
                      <tr key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 dark:bg-slate-800 flex items-center justify-center border border-primary/10 dark:border-slate-700">
                              <TestTube className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.orderNumber}</span>
                              <span className="text-[10px] font-bold text-slate-400">ID: {order.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{order.testName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnostic Panel</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300">Patient ID: {order.patientId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{formatDate(order.orderedAt)}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <Clock className="h-3 w-3" />
                              Ordered at {new Date(order.orderedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                              <Microscope className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center gap-6">
                <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 shadow-xl flex items-center justify-center animate-pulse">
                  <Beaker className="h-12 w-12 text-slate-300" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Diagnostic Stream Empty</h3>
                  <p className="text-slate-500 font-bold max-w-xs mx-auto">
                    No laboratory orders detected. Start by creating a diagnostic request from the clinical dashboard.
                  </p>
                </div>
                <Button className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  Initiate First Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
