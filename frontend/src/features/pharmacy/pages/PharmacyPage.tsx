import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Pill, Package, AlertTriangle, 
  TrendingUp, Activity, ShoppingCart, Truck,
  History, Settings, Filter, Download, 
  MoreVertical, ChevronRight, ArrowUpRight, ArrowDownRight,
  ShieldCheck, BarChart3, Layers, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { pharmacyService } from '../services/pharmacyService';

export function PharmacyPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: medicinesRes, isLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => pharmacyService.getMedicines(),
  });

  const medicines = medicinesRes?.data || [];

  const stats = [
    { label: 'Total Inventory', value: '1,245', subValue: '+12% from last month', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
    { label: 'Low Stock Items', value: '18', subValue: 'Action Required', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'down' },
    { label: 'Expiring Soon', value: '04', subValue: 'Within 30 days', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'down' },
    { label: 'Daily Revenue', value: '$4,250', subValue: '+8% vs Yesterday', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Pharmacy Management</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pharmacy Inventory Hub
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Oversee medical stock, manage procurement, and track pharmaceutical revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            className="h-12 px-6 shadow-xl shadow-primary/20 gap-2 text-base font-bold"
          >
            <Plus className="h-5 w-5" />
            Add New Stock
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
          { label: 'Prescriptions', icon: Pill, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Procurement', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sales Report', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Audit Stock', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Returns', icon: History, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((action, i) => (
          <button
            key={i}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
          >
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", action.bg)}>
              <action.icon className={cn("h-6 w-6", action.color)} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Inventory Table Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by medicine name, generic name, or category..."
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
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Live Inventory Matrix
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Stock</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : medicines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Medicine Identity</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Price</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Live Stock</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {medicines.map((medicine: any) => (
                      <tr key={medicine.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center border border-blue-100 dark:border-slate-700">
                              <Pill className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{medicine.medicineName}</span>
                              <span className="text-[10px] font-bold text-slate-400">{medicine.genericName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-slate-200">
                            {medicine.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{formatCurrency(medicine.unitPrice)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "text-sm font-black",
                              medicine.stockQuantity < 10 ? "text-rose-600" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {medicine.stockQuantity} Units
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all", medicine.stockQuantity < 10 ? "bg-rose-500" : "bg-emerald-500")}
                                style={{ width: `${Math.min(medicine.stockQuantity, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {medicine.stockQuantity < 10 ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[9px] font-black uppercase tracking-widest gap-1 px-1.5 py-0">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black uppercase tracking-widest gap-1 px-1.5 py-0">
                              <CheckCircle className="h-3 w-3" />
                              Optimal
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center gap-6">
                <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 shadow-xl flex items-center justify-center animate-pulse">
                  <Package className="h-12 w-12 text-slate-300" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Inventory</h3>
                  <p className="text-slate-500 font-bold max-w-xs mx-auto">
                    No medical stock detected in the system. Start by adding your first medicine.
                  </p>
                </div>
                <Button className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Medicine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
