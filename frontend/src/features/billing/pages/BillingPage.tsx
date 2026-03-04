import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { billingService } from '../services/billingService';
import { TrendingUp, CheckCircle } from 'lucide-react';

export function BillingPage() {
  const navigate = useNavigate();
  const { data: response, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingService.searchInvoices({}),
  });

  const invoices = response?.data?.items || [];

  // Fetch patient names
  // make sure ids are treated as strings so they can index the object
  const patientIds = Array.from(
    new Set(invoices.map((inv: any) => String(inv.patientId)))
  );
  const { data: patientsData } = useQuery<Record<string, string>>({
    queryKey: ['patients', patientIds],
    queryFn: async (): Promise<Record<string, string>> => {
      const patients: Record<string, string> = {};
      for (const id of patientIds) {
        try {
          const res = await fetch(`http://localhost:5003/api/patients/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'X-Tenant-Id': localStorage.getItem('tenantId') || '',
              'X-User-Id': localStorage.getItem('userId') || '',
            },
          });
          const data = await res.json();
          if (data.success) {
            patients[id as string] = `${data.data.firstName} ${data.data.lastName}`;
          }
        } catch (e) {}
      }
      return patients;
    },
    enabled: patientIds.length > 0,
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
    },
    {
      accessorKey: 'patientId',
      header: 'Patient ID',
      cell: ({ row }) => (patientsData as Record<string, string>)?.[row.original.patientId] || row.original.patientId,
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total Amount',
      cell: ({ row }) => formatCurrency(row.original.grandTotal),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid Amount',
      cell: ({ row }) => formatCurrency(row.original.paidAmount),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            row.original.status === 'Paid'
              ? 'bg-green-100 text-green-800'
              : row.original.status === 'Partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/billing/ar-aging')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            AR Aging Report
          </Button>
          <Button variant="outline" onClick={() => navigate('/billing/refunds/approval')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Refund Approvals
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={invoices || []}
              searchKey="invoiceNumber"
              searchPlaceholder="Search by invoice number..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
