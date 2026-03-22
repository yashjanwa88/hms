import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Search, History, User, Calendar, FileText, Edit, Trash2, Plus } from 'lucide-react';
import { patientService } from '../services/patientService';

interface AuditLog {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Merged' | 'Renewed' | 'Viewed';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedByRole: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
}

export function PatientAuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['patient-audit-logs', searchTerm, actionFilter, dateFrom, dateTo],
    queryFn: () => patientService.getAuditLogs({
      search: searchTerm || undefined,
      action: actionFilter !== 'All' ? actionFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }).then(r => r.data?.items ?? []),
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Created': return <Plus className="h-4 w-4 text-green-600" />;
      case 'Updated': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'Deleted': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'Merged': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'Renewed': return <History className="h-4 w-4 text-orange-600" />;
      case 'Viewed': return <FileText className="h-4 w-4 text-gray-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created': return 'bg-green-100 text-green-800';
      case 'Updated': return 'bg-blue-100 text-blue-800';
      case 'Deleted': return 'bg-red-100 text-red-800';
      case 'Merged': return 'bg-purple-100 text-purple-800';
      case 'Renewed': return 'bg-orange-100 text-orange-800';
      case 'Viewed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all patient record changes and activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Search (UHID/Name)</Label>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Action</Label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="All">All Actions</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
                <option value="Deleted">Deleted</option>
                <option value="Merged">Merged</option>
                <option value="Renewed">Renewed</option>
                <option value="Viewed">Viewed</option>
              </select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({auditLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found</div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getActionIcon(log.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="font-semibold">{log.patientName}</span>
                          <span className="text-sm text-gray-600">({log.patientUHID})</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                        {log.fieldChanged && (
                          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                            <strong>Field Changed:</strong> {log.fieldChanged}
                            <br />
                            <strong>Old Value:</strong> {log.oldValue || 'N/A'} → <strong>New Value:</strong> {log.newValue}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{log.changedBy} ({log.changedByRole})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(log.changedAt).toLocaleString()}</span>
                          </div>
                          {log.ipAddress && (
                            <div>IP: {log.ipAddress}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Audit Log Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Action</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-semibold">{selectedLog.patientName} ({selectedLog.patientUHID})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Changed By</p>
                    <p className="font-semibold">{selectedLog.changedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-semibold">{selectedLog.changedByRole}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-semibold">{new Date(selectedLog.changedAt).toLocaleString()}</p>
                  </div>
                  {selectedLog.ipAddress && (
                    <div>
                      <p className="text-sm text-gray-600">IP Address</p>
                      <p className="font-semibold font-mono">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>

                {selectedLog.fieldChanged && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Change Details</h4>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm mb-1"><strong>Field:</strong> {selectedLog.fieldChanged}</p>
                      <p className="text-sm mb-1"><strong>Old Value:</strong> {selectedLog.oldValue || 'N/A'}</p>
                      <p className="text-sm"><strong>New Value:</strong> {selectedLog.newValue}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedLog.description}</p>
                </div>

                <Button onClick={() => setSelectedLog(null)} className="w-full">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-2">Audit Log Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All patient record changes are automatically tracked</li>
              <li>Includes who made the change, when, and from which IP</li>
              <li>Field-level tracking shows old and new values</li>
              <li>Audit logs cannot be deleted or modified</li>
              <li>Useful for compliance and security audits</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
