import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { patientService } from '../services/patientService';

const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-green-500',
  Scheduled: 'bg-blue-500',
  Cancelled: 'bg-red-500',
  NoShow: 'bg-gray-500',
  InProgress: 'bg-yellow-500',
};

export const PatientAppointmentHistory: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patientAppointments', patientId],
    queryFn: () => patientService.getPatientAppointments(patientId),
    enabled: !!patientId,
  });

  const appointments: any[] = data?.data?.items ?? [];

  if (isLoading) return <div className="p-4 text-gray-500">Loading appointment history...</div>;
  if (isError) return <div className="p-4 text-red-500">Failed to load appointment history.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No appointments found</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt: any) => (
              <div key={apt.appointmentId} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {apt.appointmentDate
                          ? new Date(apt.appointmentDate).toLocaleDateString()
                          : '—'}
                      </span>
                      {apt.appointmentTime && (
                        <>
                          <Clock className="h-4 w-4 text-gray-500 ml-2" />
                          <span>{apt.appointmentTime}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>
                        {apt.doctorName || 'N/A'}
                        {apt.departmentName ? ` — ${apt.departmentName}` : ''}
                      </span>
                    </div>
                    {apt.chiefComplaint && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{apt.chiefComplaint}</span>
                      </div>
                    )}
                    {apt.appointmentNumber && (
                      <p className="text-xs text-gray-400 font-mono">{apt.appointmentNumber}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[apt.status] ?? 'bg-gray-500'}>
                      {apt.status}
                    </Badge>
                    {apt.visitType && (
                      <span className="text-xs text-gray-500">{apt.visitType}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
