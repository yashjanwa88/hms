import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, Clock, FileText, Stethoscope, 
  RefreshCw, Search, ChevronRight, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockAppointments = [
  { id: 1, patientName: 'John Doe', time: '09:00 AM', type: 'Follow-up', status: 'Confirmed' },
  { id: 2, patientName: 'Jane Smith', time: '09:30 AM', type: 'New Consultation', status: 'Confirmed' },
  { id: 3, patientName: 'Bob Johnson', time: '10:00 AM', type: 'Emergency', status: 'In Progress' },
  { id: 4, patientName: 'Alice Brown', time: '10:30 AM', type: 'Follow-up', status: 'Waiting' },
  { id: 5, patientName: 'Charlie Wilson', time: '11:00 AM', type: 'New Consultation', status: 'Confirmed' },
];

const mockPatientsInQueue = [
  { id: 1, name: 'John Doe', age: 45, complaint: 'Fever & Cold', waitTime: '15 min' },
  { id: 2, name: 'Jane Smith', age: 32, complaint: 'Headache', waitTime: '5 min' },
  { id: 3, name: 'Bob Johnson', age: 58, complaint: 'Chest Pain', waitTime: '30 min' },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    appointmentsToday: mockAppointments.length,
    patientsInQueue: mockPatientsInQueue.length,
    completedToday: 8,
    pendingReports: 3,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Doctor Dashboard</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Doctor Dashboard
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
            Manage your appointments and patient consultations.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button className="h-10 gap-2 shadow-lg shadow-primary/20">
            <FileText className="h-4 w-4" />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Today's Appointments
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.appointmentsToday}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Patients in Queue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {stats.patientsInQueue}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Waiting for consultation
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Pending Reports
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">
              {stats.pendingReports}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Avg Consultation Time
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">
              12 min
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Per patient
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold uppercase tracking-widest text-primary">
                View All
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {mockAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {appointment.patientName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {appointment.patientName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {appointment.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {appointment.time}
                      </div>
                      <Badge
                        variant={
                          appointment.status === 'Confirmed' ? 'success' :
                          appointment.status === 'In Progress' ? 'warning' : 'outline'
                        }
                        className="text-xs"
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/patients/${appointment.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patients in Queue */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Queue
              </CardTitle>
              <Badge variant="outline">{stats.patientsInQueue}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {mockPatientsInQueue.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {patient.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {patient.waitTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {patient.age} yrs • {patient.complaint}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      Consult
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
              <Button variant="outline" className="w-full gap-2" size="sm">
                <RefreshCw className="h-4 w-4" />
                Refresh Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'New Patient', icon: Users, path: '/patients/register' },
              { label: 'Search Patient', icon: Search, path: '/patients' },
              { label: 'Appointments', icon: Calendar, path: '/appointments' },
              { label: 'EMR Access', icon: FileText, path: '/emr' },
              { label: 'Lab Reports', icon: FileText, path: '/laboratory' },
              { label: 'Prescriptions', icon: FileText, path: '/pharmacy/prescriptions' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}