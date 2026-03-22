import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Receipt, Download, Eye } from 'lucide-react';
import { patientService } from '../services/patientService';

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-green-500',
  Partial: 'bg-yellow-500',
  Pending: 'bg-red-500',
  Cancelled: 'bg-gray-500',
};

export const PatientBillingHistory: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patientBilling', patientId],
    queryFn: () => patientService.getPatientBilling(patientId),
    enabled: !!patientId,
  });

  const bills: any[] = data?.data?.items ?? [];
  const summary = data?.data?.summary ?? { totalAmount: 0, totalPaid: 0, totalBalance: 0 };

  if (isLoading) return <div className="p-4 text-gray-500">Loading billing history...</div>;
  if (isError) return <div className="p-4 text-red-500">Failed to load billing history.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold">₹{Number(summary.totalAmount).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-xl font-bold text-green-600">₹{Number(summary.totalPaid).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Balance</p>
            <p className="text-xl font-bold text-red-600">₹{Number(summary.totalBalance).toFixed(2)}</p>
          </div>
        </div>

        {bills.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No billing records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Invoice No</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Paid</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill: any) => (
                  <tr key={bill.billId} className="border-t">
                    <td className="px-4 py-2 font-mono text-sm">{bill.invoiceNo}</td>
                    <td className="px-4 py-2 text-sm">
                      {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">₹{Number(bill.amount).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₹{Number(bill.paid).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₹{Number(bill.balance).toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge className={STATUS_COLORS[bill.status] ?? 'bg-gray-500'}>
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
