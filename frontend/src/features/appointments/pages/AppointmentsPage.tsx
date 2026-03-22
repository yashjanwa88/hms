import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { appointmentService } from '../services/appointmentService';
import { BookAppointmentModal } from '../components/BookAppointmentModal';
import { BookAppointmentModalEnhanced } from '../components/BookAppointmentModalEnhanced';

interface Appointment {
  id: string;
  appointmentNumber: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  appointmentType: string;
  reason: string;
}

export function AppointmentsPage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchParams, setSearchParams] = useState({
    patientId: '',
    doctorId: '',
    status: '',
    fromDate: '',
    toDate: '',
    pageNumber: 1,
    pageSize: 10
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', searchParams],
    queryFn: () => appointmentService.getAppointments(searchParams),
  });

  const appointments = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'CheckedIn': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  const handleCancelAppointment = (id: string) => {
    const reason = prompt('Please provide cancellation reason:');
    if (reason) {
      cancelMutation.mutate({ id, reason });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={() => setShowBookingModal(true)}>Book New Appointment</Button>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader><CardTitle>Search Appointments</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Status</Label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={searchParams.status}
                onChange={(e) => setSearchParams({...searchParams, status: e.target.value, pageNumber: 1})}
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="CheckedIn">Checked In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input 
                type="date" 
                value={searchParams.fromDate}
                onChange={(e) => setSearchParams({...searchParams, fromDate: e.target.value, pageNumber: 1})}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input 
                type="date" 
                value={searchParams.toDate}
                onChange={(e) => setSearchParams({...searchParams, toDate: e.target.value, pageNumber: 1})}
              />
            </div>
            <div>
              <Label>Page Size</Label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={searchParams.pageSize}
                onChange={(e) => setSearchParams({...searchParams, pageSize: Number(e.target.value), pageNumber: 1})}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setSearchParams({
                  patientId: '', doctorId: '', status: '', fromDate: '', toDate: '', pageNumber: 1, pageSize: 10
                })}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Appointments ({totalCount} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading appointments...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Appointment #</th>
                      <th className="text-left p-3">Patient</th>
                      <th className="text-left p-3">Doctor</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Reason</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt: Appointment) => (
                      <tr key={apt.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{apt.appointmentNumber}</td>
                        <td className="p-3">{apt.patientName}</td>
                        <td className="p-3">{apt.doctorName}</td>
                        <td className="p-3">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                        <td className="p-3">{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</td>
                        <td className="p-3">{apt.appointmentType}</td>
                        <td className="p-3 max-w-xs truncate" title={apt.reason}>{apt.reason}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(apt.status)}`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {(apt.status === 'Scheduled' || apt.status === 'Rescheduled') && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleCancelAppointment(apt.id)}
                              disabled={cancelMutation.isPending}
                            >
                              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > searchParams.pageSize && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((searchParams.pageNumber - 1) * searchParams.pageSize) + 1} to {Math.min(searchParams.pageNumber * searchParams.pageSize, totalCount)} of {totalCount} appointments
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      disabled={searchParams.pageNumber === 1}
                      onClick={() => setSearchParams({...searchParams, pageNumber: searchParams.pageNumber - 1})}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      disabled={searchParams.pageNumber * searchParams.pageSize >= totalCount}
                      onClick={() => setSearchParams({...searchParams, pageNumber: searchParams.pageNumber + 1})}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showBookingModal && (
        <BookAppointmentModalEnhanced onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
}
