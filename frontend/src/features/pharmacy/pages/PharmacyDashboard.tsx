import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Pill, AlertTriangle, TrendingUp, Package, Plus, Search,
  ChevronRight, ArrowUpRight, ArrowDownRight, Filter, Download,
  MoreVertical, Eye, RefreshCw, ShieldCheck, FlaskConical,
  ClipboardList, BarChart3, History, Beaker, CheckCircle,
  XCircle, Clock, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';
import { pharmacyService } from '../services/pharmacyService';
import { toast } from 'sonner';

export function PharmacyDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: drugsRes, isLoading: drugsLoading } = useQuery({
    queryKey: ['drugs'],
    queryFn: () => pharmacyService.getDrugs(),
  });

  const { data: lowStockRes, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => pharmacyService.getLowStockReport(),
  });

  const { data: salesRes } = useQuery({
    queryKey: ['daily-sales', selectedDate],
    queryFn: () => pharmacyService.getDailySalesReport(selectedDate),
  });

  const { data: prescriptionsRes, isLoading: prescLoading } = useQuery({
    queryKey: ['prescriptions-recent'],
    queryFn: () => pharmacyService.getPrescriptionsByPatientId(''),
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.dispensePrescription(id),
    onSuccess: () => {
      toast.success('Prescription dispensed successfully');
      queryClient.invalidateQueries({ queryKey: ['prescriptions-recent'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    },
    onError: () => toast.error('Failed to dispense prescription'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.verifyPrescription(id),
    onSuccess: () => {
      toast.success('Prescription verified');
      queryClient.invalidateQueries({ queryKey: ['prescriptions-recent'] });
    },
    onError: () => toast.error('Failed to verify prescription'),
  });

  const drugs = drugsRes?.data || [];
  const lowStockItems = lowStockRes?.data?.items || [];
  const sales = salesRes?.data || {};
  const prescriptions = prescriptionsRes?.data || [];

  const totalDrugs = drugs.length;
  const activeDrugs = drugs.filter((d: any) => d.isActive).length;
  const controlledDrugs = drugs.filter((d: any) => d.isControlled).length;

  const filteredDrugs = drugs.filter((d: any) =>
    d.drugName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.drugCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      label: 'Total Drugs', value: totalDrugs, subValue: `${activeDrugs} active`,
      icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up',
    },
    {
      label: 'Low Stock Alerts', value: lowStockItems.length, subValue: 'Needs reorder',
      icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'down',
    },
    {
      label: "Today's Prescriptions", value: sales.totalPrescriptions || 0, subValue: 'Dispensed today',
      icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'up',
    },
    {
      label: "Today's Revenue", value: `₹${(sales.totalRevenue || 0).toFixed(0)}`, subValue: '+8% vs yesterday',
      icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up',
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-100',
      Verified: 'bg-blue-50 text-blue-700 border-blue-100',
      Dispensed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      Cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return (
      <Badge className={cn('font-black text-[9px] uppercase tracking-widest px-2 py-0', map[status] || 'bg-slate-50 text-slate-600')}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy & Dispensary</h1>
          <p className="page-subtitle">Manage drug inventory, prescriptions, and dispensing.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/pharmacy/prescriptions')} className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Prescriptions
          </Button>
          <Button size="sm" onClick={() => navigate('/pharmacy/drugs')} className="gap-1.5 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />
            Add Drug
          </Button>
        </div>
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
                    {stat.trend === 'up'
                      ? <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      : <ArrowDownRight className="h-4 w-4 text-rose-500" />}
                  </div>
                  <p className={cn('text-[10px] font-bold uppercase tracking-tight',
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
                    {stat.subValue}
                  </p>
                </div>
                <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', stat.bg)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Drug Master', icon: Pill, path: '/pharmacy/drugs', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Prescriptions', icon: ClipboardList, path: '/pharmacy/prescriptions', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Inventory', icon: Package, path: '/pharmacy/inventory', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock', icon: AlertTriangle, path: '/pharmacy/inventory', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Sales Report', icon: BarChart3, path: '/pharmacy/reports', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Batch Mgmt', icon: Beaker, path: '/pharmacy/batches', color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((action, i) => (
          <button key={i} onClick={() => navigate(action.path)} className="group quick-tile">
            <div className={cn('quick-tile-icon group-hover:scale-110 transition-transform', action.bg)}>
              <action.icon className={cn('h-5 w-5', action.color)} />
            </div>
            <span className="quick-tile-label group-hover:text-primary">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Drug Inventory Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by drug name, code, or generic name..."
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
                  <Pill className="h-4 w-4 text-primary" />
                  Drug Formulary
                </CardTitle>
                <Badge variant="outline" className="bg-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                  {filteredDrugs.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {drugsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                </div>
              ) : filteredDrugs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Drug</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Stock</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Price</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDrugs.slice(0, 8).map((drug: any) => (
                        <tr key={drug.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                <Pill className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{drug.drugName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{drug.drugCode} • {drug.strength}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{drug.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={cn('text-sm font-black',
                                drug.availableStock <= drug.reorderLevel ? 'text-rose-600' : 'text-slate-900 dark:text-white')}>
                                {drug.availableStock}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all',
                                    drug.availableStock <= drug.reorderLevel ? 'bg-rose-500' : 'bg-emerald-500')}
                                  style={{ width: `${Math.min((drug.availableStock / (drug.reorderLevel * 3)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-slate-900 dark:text-white">₹{drug.unitPrice}</span>
                          </td>
                          <td className="px-6 py-4">
                            {drug.isActive
                              ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Active</Badge>
                              : <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-black text-[9px] uppercase tracking-widest px-2 py-0">Inactive</Badge>}
                            {drug.isControlled && (
                              <Badge className="ml-1 bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Controlled</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                              onClick={() => navigate(`/pharmacy/drugs`)}>
                              <Eye className="h-4 w-4 text-slate-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 shadow-xl flex items-center justify-center animate-pulse">
                    <Pill className="h-10 w-10 text-slate-300" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Drugs Found</h3>
                    <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">
                      Start by adding drugs to the formulary.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/pharmacy/drugs')} className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Drug
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-800/30 p-5">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Alerts
                {lowStockItems.length > 0 && (
                  <Badge className="ml-auto bg-rose-600 text-white font-black text-[10px] px-2 py-0">
                    {lowStockItems.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {lowStockLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStockItems.slice(0, 5).map((item: any) => (
                    <div key={item.drugId} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.drugName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.drugCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-rose-600">{item.availableStock}</p>
                        <p className="text-[10px] font-bold text-slate-400">Min: {item.reorderLevel}</p>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <button
                      onClick={() => navigate('/pharmacy/inventory')}
                      className="w-full p-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors"
                    >
                      View All {lowStockItems.length} Alerts →
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-600">All stock levels healthy</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Top Drugs */}
          {sales.topDrugs && sales.topDrugs.length > 0 && (
            <Card className="border-none shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Top Selling Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sales.topDrugs.slice(0, 5).map((drug: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 w-5">#{idx + 1}</span>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{drug.drugName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{drug.quantitySold} units sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-600">₹{drug.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date Selector for Sales */}
          <Card className="border-none shadow-xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Sales Report Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prescriptions</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{sales.totalPrescriptions || 0}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Revenue</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">₹{(sales.totalRevenue || 0).toFixed(0)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
