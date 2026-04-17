import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import pharmacyService, { Drug, LowStockItem } from '../services/pharmacyService';
import { AlertTriangle, Package, CheckCircle2, RefreshCw, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

function StockBar({ available, reorder }: { available: number; reorder: number }) {
  const max = Math.max(reorder * 2, available, 1);
  const pct = Math.min((available / max) * 100, 100);
  const isOut = available === 0;
  const isLow = available < reorder;
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-sm font-bold tabular-nums w-8 text-right', isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
        {available}
      </span>
      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function InventoryManagementPage() {
  const navigate = useNavigate();

  const { data: drugsData, isLoading: drugsLoading, refetch, isFetching } = useQuery({
    queryKey: ['drugs'],
    queryFn: pharmacyService.getDrugs,
  });

  const { data: lowStockData, isLoading: lowLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: pharmacyService.getLowStockReport,
  });

  const drugs: Drug[]         = drugsData?.data ?? [];
  const lowStockItems: LowStockItem[] = lowStockData?.data?.items ?? [];

  const outOfStock  = drugs.filter(d => d.availableStock === 0);
  const lowStock    = lowStockItems.filter(i => i.availableStock > 0);
  const goodStock   = drugs.filter(d => d.availableStock >= d.reorderLevel);

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor stock levels, low stock alerts, and batch expiry.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => navigate('/pharmacy/drugs')}>
            <Package className="h-4 w-4" /> Manage Drugs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Drugs',   value: drugs.length,       icon: Package,       color: 'stat-blue',  text: 'text-blue-600'    },
          { label: 'Good Stock',    value: goodStock.length,   icon: CheckCircle2,  color: 'stat-green', text: 'text-emerald-600' },
          { label: 'Low Stock',     value: lowStock.length,    icon: TrendingDown,  color: 'stat-amber', text: 'text-amber-600'   },
          { label: 'Out of Stock',  value: outOfStock.length,  icon: AlertTriangle, color: 'stat-rose',  text: 'text-rose-600'    },
        ].map(s => (
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

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardHeader className="border-b border-amber-100 dark:border-amber-800/30 pb-3 bg-amber-50/50 dark:bg-amber-950/20">
            <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-[10px] font-bold">
                {lowStockItems.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lowLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Drug Name</th>
                      <th className="text-right">Available</th>
                      <th className="text-right">Reorder Level</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => (
                      <tr key={item.drugId}>
                        <td className="font-mono text-xs font-semibold text-primary">{item.drugCode}</td>
                        <td className="font-semibold text-sm text-slate-900 dark:text-white">{item.drugName}</td>
                        <td className="text-right">
                          <StockBar available={item.availableStock} reorder={item.reorderLevel} />
                        </td>
                        <td className="text-right text-sm text-slate-500">{item.reorderLevel}</td>
                        <td className="text-center">
                          <span className={item.availableStock === 0 ? 'status-emergency' : 'status-waiting'}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complete Inventory */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Complete Inventory
            <span className="ml-auto text-xs font-normal text-slate-400">{drugs.length} drugs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {drugsLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
          ) : drugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Package className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No drugs in inventory</p>
              <Button size="sm" onClick={() => navigate('/pharmacy/drugs')}>Add Drugs</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Drug Name</th>
                    <th>Category</th>
                    <th>Strength</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Reorder</th>
                    <th className="text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map(d => {
                    const isOut = d.availableStock === 0;
                    const isLow = d.availableStock < d.reorderLevel;
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-xs font-semibold text-primary">{d.drugCode}</td>
                        <td className="font-semibold text-sm text-slate-900 dark:text-white">{d.drugName}</td>
                        <td className="text-slate-500 text-sm">{d.category}</td>
                        <td className="text-sm">{d.strength} · {d.dosageForm}</td>
                        <td className="text-right text-sm font-semibold">₹{d.unitPrice.toFixed(2)}</td>
                        <td className="text-right">
                          <StockBar available={d.availableStock} reorder={d.reorderLevel} />
                        </td>
                        <td className="text-right text-sm text-slate-500">{d.reorderLevel}</td>
                        <td className="text-center">
                          <span className={isOut ? 'status-emergency' : isLow ? 'status-waiting' : 'status-active'}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
