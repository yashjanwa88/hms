import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users, Clock, FileText, Stethoscope,
  RefreshCw, Search, ChevronRight, Calendar, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockAppointments = [
  { id: '1', patientName: 'Rajesh Kumar',   time: '09:00', type: 'Follow-up',        status: 'Confirmed'   },
  { id: '2', patientName: 'Priya Sharma',   time: '09:30', type: 'New Consultation', status: 'Confirmed'   },
  { id: '3', patientName: 'Amit Verma',     time: '10:00', type: 'Emergency',        status: 'In Progress' },
  { id: '4', patientName: 'Sunita Patel',   time: '10:30', type: 'Follow-up',        status: 'Waiting'     },
  { id: '5', patientName: 'Vikram Singh',   time: '11:00', type: 'New Consultation', status: 'Confirmed'   },
];

const mockQueue = [
  { id: '1', name: 'Rajesh Kumar', age: 45, complaint: 'Fever & Cold',  wait: '15 min', token: 'A001' },
  { id: '2', name: 'Priya Sharma', age: 32, complaint: 'Headache',      wait: '5 min',  token: 'A002' },
  { id: '3', name: 'Amit Verma',   age: 58, complaint: 'Chest Pain',    wait: '30 min', token: 'A003' },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'outline' | 'destructive'> = {
  'Confirmed':   'success',
  'In Progress': 'warning',
  'Waiting':     'outline',
  'Cancelled':   'destructive',
};

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const stats = {
    appointments: mockAppointments.length,
    queue:        mockQueue.length,
    completed:    8,
    avgTime:      '12 min',
  };

  const quickActions = [
    { label: 'New Patient',    icon: Users,       path: '/patients/register' },
    { label: 'Search Patient', icon: Search,      path: '/patients' },
    { label: 'Appointments',   icon: Calendar,    path: '/appointments' },
    { label: 'EMR',            icon: FileText,    path: '/emr' },
    { label: 'Lab Reports',    icon: Stethoscope, path: '/laboratory' },
    { label: 'Prescriptions',  icon: FileText,    path: '/pharmacy/prescriptions' },
  ];

  return (
    <div className="page-section">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Dashboard</h1>
          <p className="page-subtitle">Manage your appointments and patient consultations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/appointments')}>
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => navigate('/pharmacy/prescriptions')}>
            <Plus className="h-4 w-4" />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: stats.appointments, sub: `${stats.completed} completed`, icon: Calendar,    color: 'stat-blue',   text: 'text-blue-600'    },
          { label: 'Patients in Queue',    value: stats.queue,        sub: 'Waiting for consultation',    icon: Users,        color: 'stat-green',  text: 'text-emerald-600' },
          { label: 'Completed Today',      value: stats.completed,    sub: 'Consultations done',          icon: Stethoscope,  color: 'stat-amber',  text: 'text-amber-600'   },
          { label: 'Avg Consultation',     value: stats.avgTime,      sub: 'Per patient',                 icon: Clock,        color: 'stat-rose',   text: 'text-rose-600'    },
        ].map(s => (
          <Card key={s.label} className={s.color}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.text}`} />
              </div>
              <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments list */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7" onClick={() => navigate('/appointments')}>
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockAppointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {appt.patientName.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{appt.patientName}</span>
                      </div>
                    </td>
                    <td className="text-slate-500">{appt.type}</td>
                    <td className="font-semibold tabular-nums">{appt.time}</td>
                    <td>
                      <Badge variant={STATUS_VARIANT[appt.status] ?? 'outline'} className="text-xs">
                        {appt.status}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/patients/${appt.id}`)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Queue panel */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Queue
              </CardTitle>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {stats.queue}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {mockQueue.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-xl border p-3 transition-colors ${
                  i === 0
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${i === 0 ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                      {p.token}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{p.name}</span>
                  </div>
                  {i === 0 && <span className="status-active text-[10px]">Next</span>}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{p.age} yrs • {p.complaint}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{p.wait}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      Consult
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t border-slate-100 dark:border-slate-800 p-3">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Queue
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} className="group quick-tile">
                <div className="quick-tile-icon bg-primary/10 group-hover:scale-110">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="quick-tile-label group-hover:text-primary">{a.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
