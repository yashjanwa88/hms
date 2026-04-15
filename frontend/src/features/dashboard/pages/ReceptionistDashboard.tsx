import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserPlus, Calendar, Receipt, Clock,
  Activity, ChevronRight, Users, ArrowUpRight, TrendingUp, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { patientService } from '../../patients/services/patientService';
import { cn } from '@/lib/utils';

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['quick-search', searchTerm],
    queryFn: () => patientService.searchPatients({ searchTerm, pageSize: 5 }),
    enabled: searchTerm.length > 2,
  });

  const patients = searchResults?.data?.items ?? [];

  const stats = [
    { label: 'Registrations Today', value: '24', icon: UserPlus,  color: 'stat-blue',  text: 'text-blue-600'    },
    { label: 'Pending Appointments',value: '12', icon: Calendar,  color: 'stat-green', text: 'text-emerald-600' },
    { label: 'Unpaid Invoices',      value: '08', icon: Receipt,   color: 'stat-amber', text: 'text-amber-600'   },
    { label: 'Avg Wait Time',        value: '15m',icon: Clock,     color: 'stat-rose',  text: 'text-rose-600'    },
  ];

  const waitingList = [
    { name: 'Sarah Jenkins', time: '10:15', doctor: 'Dr. Sarah Wilson', status: 'Waiting' },
    { name: 'Robert Fox',    time: '10:30', doctor: 'Dr. James Chen',   status: 'Called'  },
    { name: 'Alice Brown',   time: '10:45', doctor: 'Dr. Sarah Wilson', status: 'Waiting' },
  ];

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reception Desk</h1>
          <p className="page-subtitle">Streamlined patient registration and coordination workflow.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/appointments')}>
            <Calendar className="h-4 w-4" /> Book Appointment
          </Button>
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" onClick={() => navigate('/patients/register')}>
            <UserPlus className="h-4 w-4" /> New Registration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className={s.color}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.text}`} />
              </div>
              <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Patient Search */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Find Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search by UHID, name, or mobile…"
                  className="pl-9 h-9 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <Activity className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
                )}
              </div>

              <div className="mt-3 space-y-1.5">
                {patients.length > 0 ? patients.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="group flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {p.fullName ?? `${p.firstName} ${p.lastName}`}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{p.uhid} • {p.age}y • {p.gender}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button className="icon-btn" onClick={e => { e.stopPropagation(); navigate(`/appointments?patientId=${p.id}`); }}>
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      </button>
                      <button className="icon-btn" onClick={e => { e.stopPropagation(); navigate(`/billing?patientId=${p.id}`); }}>
                        <Receipt className="h-3.5 w-3.5 text-amber-500" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-300 ml-1" />
                    </div>
                  </div>
                )) : searchTerm.length > 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                    <Users className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No patient found for "{searchTerm}"</p>
                    <Button variant="link" size="sm" className="text-primary" onClick={() => navigate('/patients/register')}>
                      Register as new patient?
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6">Type at least 3 characters to search</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waiting list */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Live Waiting List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {waitingList.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', item.status === 'Called' ? 'bg-emerald-500' : 'bg-amber-500 blink')} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.doctor} · {item.time}</p>
                    </div>
                  </div>
                  <span className={item.status === 'Called' ? 'status-serving' : 'status-waiting'}>
                    {item.status}
                  </span>
                </div>
              ))}
              <div className="p-3">
                <Button variant="ghost" size="sm" className="w-full text-xs text-primary gap-1" onClick={() => navigate('/patients/queue')}>
                  View Full Queue <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Schedule card */}
          <div className="rounded-xl bg-primary p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-sm font-semibold text-primary-foreground/80 mb-1">Today's Schedule</p>
              <p className="text-3xl font-black">42</p>
              <p className="text-xs text-primary-foreground/70 mt-1">appointments scheduled</p>
              <Button size="sm" className="mt-4 bg-white text-primary hover:bg-white/90 font-semibold w-full">
                View Calendar
              </Button>
            </div>
          </div>

          {/* Recent collections */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                Recent Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { id: 'INV-8829', amount: 1250, status: 'Paid'    },
                { id: 'INV-8830', amount: 450,  status: 'Pending' },
                { id: 'INV-8831', amount: 2100, status: 'Paid'    },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{inv.id}</p>
                    <p className="text-xs text-slate-400">OPD Consultation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">₹{inv.amount.toLocaleString()}</p>
                    <span className={cn('text-[10px] font-semibold', inv.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600')}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
              <div className="p-3">
                <Button variant="ghost" size="sm" className="w-full text-xs text-amber-600 gap-1" onClick={() => navigate('/billing')}>
                  Go to Billing <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/reports')} className="quick-tile">
              <div className="quick-tile-icon bg-blue-50"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <span className="quick-tile-label">Reports</span>
            </button>
            <button onClick={() => navigate('/audit')} className="quick-tile">
              <div className="quick-tile-icon bg-rose-50"><AlertCircle className="h-5 w-5 text-rose-600" /></div>
              <span className="quick-tile-label">Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
