import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Calendar, Clock, User, 
  Video, MapPin, MoreVertical, Filter, Download,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  ShieldCheck, History, CheckCircle, AlertCircle,
  Users, Building2, LayoutGrid, List, Bell,
  Phone, Mail, Settings, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';
import { appointmentService } from '../services/appointmentService';
import { BookAppointmentModalEnhanced } from '../components/BookAppointmentModalEnhanced';
import { toast } from 'sonner';

export function AppointmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewType, setViewType] = useState<'list' | 'schedule'>('list');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchParams, setSearchParams] = useState({
    patientId: '',
    doctorId: '',
    status: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: '',
    pageNumber: 1,
    pageSize: 10
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', searchParams],
    queryFn: () => appointmentService.getAppointments(searchParams),
  });

  const appointments = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  const stats = [
    { label: 'Today\'s Bookings', value: '32', subValue: '+4 vs Yesterday', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
    { label: 'Patient Queue', value: '08', subValue: 'Avg wait: 12 min', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'down' },
    { label: 'Virtual Visits', value: '14', subValue: 'Zoom/Teams active', icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'up' },
    { label: 'Room Occupancy', value: '85%', subValue: '12 Rooms Active', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'up' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Scheduled</Badge>;
      case 'CheckedIn':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">In-Clinic</Badge>;
      case 'Completed':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-black text-[9px] uppercase tracking-widest px-2 py-0">Completed</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-black text-[9px] uppercase tracking-widest px-2 py-0">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-2 py-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage clinician schedules and patient bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <Button variant={viewType === 'list' ? 'default' : 'ghost'} size="sm"
              className="h-7 rounded-md gap-1.5 text-xs" onClick={() => setViewType('list')}>
              <List className="h-3.5 w-3.5" /> List
            </Button>
            <Button variant={viewType === 'schedule' ? 'default' : 'ghost'} size="sm"
              className="h-7 rounded-md gap-1.5 text-xs" onClick={() => setViewType('schedule')}>
              <LayoutGrid className="h-3.5 w-3.5" /> Schedule
            </Button>
          </div>
          <Button size="sm" onClick={() => setShowBookingModal(true)} className="gap-1.5 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tight",
                    stat.trend === 'up' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stat.subValue}
                  </p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Scheduling Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Filters & Resources */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Scheduler Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Date</Label>
                  <Input 
                    type="date" 
                    value={searchParams.fromDate}
                    onChange={(e) => setSearchParams({...searchParams, fromDate: e.target.value})}
                    className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clinical Specialty</Label>
                  <select className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20">
                    <option>All Specialties</option>
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Pediatrics</option>
                    <option>Orthopedics</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visit Modality</Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary" defaultChecked />
                      <Video className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tele-health</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary" defaultChecked />
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">In-Person</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full h-11 font-black uppercase tracking-widest text-[10px] border-2"
                onClick={() => setSearchParams({
                  patientId: '', doctorId: '', status: '', fromDate: new Date().toISOString().split('T')[0], toDate: '', pageNumber: 1, pageSize: 10
                })}
              >
                Reset All Filters
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Resource Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { name: 'Room 101', status: 'Occupied', type: 'Consultation' },
                { name: 'Room 102', status: 'Available', type: 'Consultation' },
                { name: 'Imaging Bay A', status: 'Maintenance', type: 'Diagnostic' },
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      res.status === 'Available' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                      res.status === 'Occupied' ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    )} />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight">{res.name}</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{res.type}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "font-black text-[8px] uppercase tracking-widest bg-white/10",
                    res.status === 'Available' ? "text-emerald-400" : 
                    res.status === 'Occupied' ? "text-amber-400" : "text-rose-400"
                  )}>{res.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Schedule List Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search appointments by patient, doctor, or #..."
                value={searchParams.patientId}
                onChange={(e) => setSearchParams({ ...searchParams, patientId: e.target.value })}
                className="pl-12 h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary text-base shadow-lg"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="h-14 px-6 gap-2 font-bold border-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" className="h-14 px-6 gap-2 font-bold border-2">
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Live Scheduler Matrix
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timezone: Asia/Kolkata</span>
                  <Badge variant="outline" className="bg-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                    {totalCount} Slots Active
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
              ) : appointments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map((apt: any) => (
                    <div 
                      key={apt.id} 
                      className="group flex flex-col md:flex-row items-stretch md:items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-20 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                          <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{apt.startTime.substring(0, 5)}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Starts</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">
                              {apt.patientName}
                            </h3>
                            {apt.appointmentType === 'Virtual' ? (
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[8px] uppercase tracking-[0.2em] gap-1 px-1.5 py-0">
                                <Video className="h-2.5 w-2.5" /> Virtual
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[8px] uppercase tracking-[0.2em] gap-1 px-1.5 py-0">
                                <Building2 className="h-2.5 w-2.5" /> In-Clinic
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-primary" />
                              <span className="text-slate-700 dark:text-slate-300">{apt.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <History className="h-3.5 w-3.5 text-slate-400" />
                              <span>{apt.reason || 'General Follow-up'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                                #{apt.appointmentNumber}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Booking Status</span>
                          {getStatusBadge(apt.status)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-white border-2">
                            <Bell className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm">
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 shadow-xl flex items-center justify-center animate-bounce">
                    <Calendar className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Slot Matrix</h3>
                    <p className="text-slate-500 font-bold max-w-xs mx-auto">
                      No appointments found for the selected criteria. Book a new encounter to begin.
                    </p>
                  </div>
                  <Button onClick={() => setShowBookingModal(true)} className="h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Initiate Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showBookingModal && (
        <BookAppointmentModalEnhanced onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
}
