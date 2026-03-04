import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LabOrder } from '@/types';
import { formatDateTime } from '@/lib/utils';

export function LaboratoryPage() {
  const { data: orders, isLoading } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders'],
    queryFn: async () => {
      return [];
    },
  });

  const columns: ColumnDef<LabOrder>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
    },
    {
      accessorKey: 'testName',
      header: 'Test Name',
    },
    {
      accessorKey: 'patientId',
      header: 'Patient ID',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            row.original.status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'orderedAt',
      header: 'Ordered At',
      cell: ({ row }) => formatDateTime(row.original.orderedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laboratory</h1>

      <Card>
        <CardHeader>
          <CardTitle>Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={orders || []}
              searchKey="orderNumber"
              searchPlaceholder="Search by order number..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
