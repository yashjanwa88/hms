import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Encounter } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Plus } from 'lucide-react';

export function EMRPage() {
  const navigate = useNavigate();

  const { data: encounters, isLoading } = useQuery<Encounter[]>({
    queryKey: ['encounters'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [];
    },
  });

  const columns: ColumnDef<Encounter>[] = [
    {
      accessorKey: 'encounterNumber',
      header: 'Encounter #',
    },
    {
      accessorKey: 'patientId',
      header: 'Patient ID',
    },
    {
      accessorKey: 'encounterType',
      header: 'Type',
    },
    {
      accessorKey: 'encounterDate',
      header: 'Date',
      cell: ({ row }) => formatDateTime(row.original.encounterDate),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            row.original.status === 'Open'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() => navigate(`/emr/encounter/${row.original.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">EMR - Encounters</h1>
        <Button onClick={() => navigate('/emr/create')}>
          <Plus className="mr-2 h-4 w-4" />
          New Encounter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Encounters</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={encounters || []}
              searchKey="encounterNumber"
              searchPlaceholder="Search by encounter number..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
