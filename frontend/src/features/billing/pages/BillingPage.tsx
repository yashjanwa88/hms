import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, TrendingUp, CheckCircle, 
  Download, Eye, CreditCard, Filter, ChevronRight,
  MoreVertical, ArrowUpRight, ArrowDownRight,
  Wallet, ShieldCheck, History, Receipt, Banknote,
  AlertCircle, DollarSign, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { billingService } from '../services/billingService';

export function BillingPage() {
  const navigate = useNavigate();
  const [searchFilters, setSearchFilters] = useState({
    invoiceNumber: '',
    patientName: '',
    status: '',
    pageNumber: 1,
    pageSize: 10,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['invoices', searchFilters],
    queryFn: () => billingService.searchInvoices(searchFilters),
  });

  const invoices = response?.data?.items || [];
  const totalCount = response?.data?.totalCount || 0;

  // Mock summary stats for high-fidelity UI
  const stats = [
    { label: 'Total Revenue', value: '₹4,25,000', subValue: '+12% from last month', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
    { label: 'Outstanding', value: '₹85,400', subValue: 'Action Required', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'down' },
    { label: 'Collections', value: '₹3,12,000', subValue: '92% Collection Rate', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
    { label: 'Invoices', value: '142', subValue: '24 Pending Approval', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'up' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Paid</Badge>;
      case 'Partial':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Partial</Badge>;
      case 'Unpaid':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Unpaid</Badge>;
      default:
        return <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-2 py-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Revenue Cycle Hub</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Billing & Invoicing
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Manage hospital revenue, track patient invoices, and oversee insurance claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => navigate('/billing/create')} 
            className="h-12 px-6 shadow-xl shadow-primary/20 gap-2 text-base font-bold"
          >
            <Plus className="h-5 w-5" />
            Generate New Invoice
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
          { label: 'AR Aging', icon: BarChart3, path: '/billing/ar-aging', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Refunds', icon: Banknote, path: '/billing/refunds/approval', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Insurance', icon: ShieldCheck, path: '/billing/insurance', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Audit Log', icon: History, path: '/billing/audit', color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Reports', icon: FileText, path: '/billing/reports', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Payments', icon: DollarSign, path: '/billing/payments', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
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

      {/* Search & Invoices Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by invoice #, patient name, or MRN..."
              value={searchFilters.invoiceNumber}
              onChange={(e) => setSearchFilters({ ...searchFilters, invoiceNumber: e.target.value })}
              className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary text-base shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </Button>
            <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
              <Download className="h-4 w-4" />
              Export Financials
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Invoicing Matrix
              </CardTitle>
              <Badge variant="outline" className="bg-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                {totalCount} Active Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice Identity</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Revenue Metrics</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Collections</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((invoice: any) => (
                      <tr key={invoice.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 dark:bg-slate-800 flex items-center justify-center border border-primary/10 dark:border-slate-700">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{invoice.invoiceNumber}</span>
                              <span className="text-[10px] font-bold text-slate-400">Patient ID: {invoice.patientId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{formatDate(invoice.createdAt)}</span>
                            <span className="text-[10px] font-bold text-slate-400">Posted at {new Date(invoice.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(invoice.grandTotal)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${(invoice.paidAmount / invoice.grandTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                              onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
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
                  <Banknote className="h-12 w-12 text-slate-300" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Revenue Stream Empty</h3>
                  <p className="text-slate-500 font-bold max-w-xs mx-auto">
                    No invoicing activity detected. Start by generating an invoice for a clinical encounter.
                  </p>
                </div>
                <Button onClick={() => navigate('/billing/create')} className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  Generate First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
