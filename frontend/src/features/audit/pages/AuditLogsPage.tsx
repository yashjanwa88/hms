import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { auditService } from '../services/auditService';
import { formatDateTime } from '@/lib/utils';

export function AuditLogsPage() {
  const [filters, setFilters] = useState({
    entityName: '',
    action: '',
    serviceName: '',
    pageNumber: 1,
    pageSize: 20,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditService.searchLogs(filters),
  });

  const logs = response?.data?.items || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <select
              className="border rounded px-3 py-2"
              value={filters.serviceName}
              onChange={(e) => setFilters({ ...filters, serviceName: e.target.value, pageNumber: 1 })}
            >
              <option value="">All Services</option>
              <option value="PatientService">Patient Service</option>
              <option value="BillingService">Billing Service</option>
              <option value="DoctorService">Doctor Service</option>
              <option value="AppointmentService">Appointment Service</option>
              <option value="PharmacyService">Pharmacy Service</option>
              <option value="LaboratoryService">Laboratory Service</option>
              <option value="EncounterService">Encounter Service</option>
            </select>

            <select
              className="border rounded px-3 py-2"
              value={filters.entityName}
              onChange={(e) => setFilters({ ...filters, entityName: e.target.value, pageNumber: 1 })}
            >
              <option value="">All Entities</option>
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Appointment">Appointment</option>
              <option value="Invoice">Invoice</option>
              <option value="Payment">Payment</option>
              <option value="Refund">Refund</option>
              <option value="Medicine">Medicine</option>
              <option value="LabTest">Lab Test</option>
            </select>

            <select
              className="border rounded px-3 py-2"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, pageNumber: 1 })}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="MERGE">Merge</option>
              <option value="PAYMENT">Payment</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((log: any) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{log.action}</span>
                      <span className="mx-2">on</span>
                      <span className="font-semibold">{log.entityName}</span>
                      <span className="mx-2">in</span>
                      <span className="text-sm text-gray-600">{log.serviceName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDateTime(log.createdAt)}</span>
                  </div>
                  {log.newData && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
