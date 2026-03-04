import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { billingReportsService } from '../services/billingReportsService';

interface ARAgingData {
  invoiceNumber: string;
  grandTotal: number;
  outstandingAmount: number;
  daysOutstanding: number;
  agingBucket: string;
}

interface ARAgingSummary {
  total0To30: number;
  total31To60: number;
  total61To90: number;
  totalOver90: number;
  grandTotal: number;
}

export function ARAgingReportPage() {
  const [data, setData] = useState<ARAgingData[]>([]);
  const [summary, setSummary] = useState<ARAgingSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, summaryRes] = await Promise.all([
        billingReportsService.getARAgingReport(),
        billingReportsService.getARAgingSummary()
      ]);

      if (reportRes.success) setData(reportRes.data.items || []);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Failed to fetch AR aging report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AR Aging Report</h1>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-5 gap-4">
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">0-30 Days</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total0To30)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">31-60 Days</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.total31To60)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">61-90 Days</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total61To90)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">90+ Days</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOver90)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.grandTotal)}</div>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Outstanding Invoices</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Invoice #</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Outstanding</th>
                <th className="text-center p-2">Days</th>
                <th className="text-center p-2">Bucket</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.invoiceNumber} className="border-b">
                  <td className="p-2">{item.invoiceNumber}</td>
                  <td className="p-2 text-right">{formatCurrency(item.grandTotal)}</td>
                  <td className="p-2 text-right font-semibold">{formatCurrency(item.outstandingAmount)}</td>
                  <td className="p-2 text-center">{item.daysOutstanding}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.agingBucket === '0-30' ? 'bg-green-100 text-green-800' :
                      item.agingBucket === '31-60' ? 'bg-yellow-100 text-yellow-800' :
                      item.agingBucket === '61-90' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.agingBucket}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}