import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Medicine } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function PharmacyPage() {
  const { data: medicines, isLoading } = useQuery<Medicine[]>({
    queryKey: ['medicines'],
    queryFn: async () => {
      return [];
    },
  });

  const columns: ColumnDef<Medicine>[] = [
    {
      accessorKey: 'medicineName',
      header: 'Medicine Name',
    },
    {
      accessorKey: 'genericName',
      header: 'Generic Name',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => formatCurrency(row.original.unitPrice),
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => (
        <span
          className={
            row.original.stockQuantity < 10
              ? 'text-red-600 font-semibold'
              : ''
          }
        >
          {row.original.stockQuantity}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pharmacy</h1>

      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={medicines || []}
              searchKey="medicineName"
              searchPlaceholder="Search medicines..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
