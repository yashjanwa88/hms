import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { appointmentService } from '../services/appointmentService';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
}

export function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    reason: ''
  });
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
  });

  const appointments = data?.data?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => appointmentService.createAppointment(data),
    onSuccess: () => {
      toast.success('Appointment booked successfully');
      setShowModal(false);
      setFormData({ patientId: '', doctorId: '', appointmentDate: '', timeSlot: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast.error('Failed to book appointment');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentService.cancelAppointment(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      toast.error('Failed to cancel appointment');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={() => setShowModal(true)}>Book Appointment</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Appointments</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Patient</th>
                <th className="text-left p-2">Doctor</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Reason</th>
                <th className="text-center p-2">Status</th>
                <th className="text-center p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt: Appointment) => (
                <tr key={apt.id} className="border-b">
                  <td className="p-2">{apt.patientName}</td>
                  <td className="p-2">{apt.doctorName}</td>
                  <td className="p-2">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                  <td className="p-2">{apt.timeSlot}</td>
                  <td className="p-2">{apt.reason}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {apt.status === 'Scheduled' && (
                      <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(apt.id)} disabled={cancelMutation.isPending}>
                        {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardHeader><CardTitle>Book Appointment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div>
                  <Label>Patient ID</Label>
                  <Input type="text" required
                    value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} />
                </div>
                <div>
                  <Label>Doctor ID</Label>
                  <Input type="text" required
                    value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" required
                    value={formData.appointmentDate} onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})} />
                </div>
                <div>
                  <Label>Time Slot</Label>
                  <Input type="time" required
                    value={formData.timeSlot} onChange={(e) => setFormData({...formData, timeSlot: e.target.value})} />
                </div>
                <div>
                  <Label>Reason</Label>
                  <textarea className="w-full border rounded px-3 py-2" rows={3} required
                    value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Booking...' : 'Book'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
