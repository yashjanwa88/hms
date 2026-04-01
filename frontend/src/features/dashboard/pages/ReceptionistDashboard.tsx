import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Calendar, Receipt, Clock, Activity, 
  ChevronRight, Users, AlertCircle, CheckCircle2, TrendingUp,
  ArrowUpRight, DollarSign, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { patientService } from '../../patients/services/patientService';
import { appointmentService } from '../../appointments/services/appointmentService';
import { billingService } from '../../billing/services/billingService';
import { cn } from '@/lib/utils';

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const stats = [
    { label: 'Today Registrations', value: '24', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Appointments', value: '12', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Unpaid Invoices', value: '08', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg Wait Time', value: '15m', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Quick Patient Search (Debounced would be better, but let's use immediate for now)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['quick-search', searchTerm],
    queryFn: () => patientService.searchPatients({ searchTerm, pageSize: 5 }),
    enabled: searchTerm.length > 2
  });

  const patients = searchResults?.data?.items || [];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Reception Desk</h1>
          <p className="text-slate-500 font-medium">Streamlined workflow for patient registration and coordination.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/patients/register')} className="gap-2 shadow-lg shadow-primary/20">
            <UserPlus className="h-4 w-4" />
            New Registration
          </Button>
          <Button variant="outline" onClick={() => navigate('/appointments')} className="gap-2 bg-white">
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Search Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find Patient Fast
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search by UHID, Name, or Mobile Number..."
                  className="pl-12 h-14 text-lg border-2 focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Activity className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {patients.length > 0 ? (
                  patients.map((patient: any) => (
                    <div 
                      key={patient.id}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{patient.fullName || `${patient.firstName} ${patient.lastName}`}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono">{patient.uhid}</Badge>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {patient.age}y • {patient.gender}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl" onClick={(e) => { e.stopPropagation(); navigate(`/appointments?patientId=${patient.id}`); }}>
                          <Calendar className="h-5 w-5 text-indigo-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl" onClick={(e) => { e.stopPropagation(); navigate(`/billing?patientId=${patient.id}`); }}>
                          <Receipt className="h-5 w-5 text-amber-600" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-slate-400 ml-2" />
                      </div>
                    </div>
                  ))
                ) : searchTerm.length > 2 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No patient found with "{searchTerm}"</p>
                    <Button variant="link" onClick={() => navigate('/patients/register')} className="mt-2 text-primary font-bold">
                      Register as New Patient?
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm font-medium">Enter at least 3 characters to search</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Queue / Waiting List */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Live Waiting List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Sarah Jenkins', time: '10:15 AM', doctor: 'Dr. Sarah Wilson', status: 'Waiting' },
                  { name: 'Robert Fox', time: '10:30 AM', doctor: 'Dr. James Chen', status: 'Called' },
                  { name: 'Alice Brown', time: '10:45 AM', doctor: 'Dr. Sarah Wilson', status: 'Waiting' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.doctor} • {item.time}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      item.status === 'Called' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-primary font-bold text-sm" onClick={() => navigate('/patients/queue')}>
                View Full Queue <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-3xl overflow-hidden relative group">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-700" />
            <CardContent className="p-6 relative z-10">
              <h3 className="text-xl font-black mb-2">Today's Schedule</h3>
              <p className="text-indigo-100 text-sm mb-6">You have 42 appointments scheduled for today.</p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-12 shadow-xl shadow-black/10">
                View Calendar
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-600" />
                Recent Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'INV-8829', amount: 1250, status: 'Paid' },
                { id: 'INV-8830', amount: 450, status: 'Pending' },
                { id: 'INV-8831', amount: 2100, status: 'Paid' },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-bold text-slate-900">{inv.id}</p>
                    <p className="text-xs text-slate-500">OPD Consultation</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">${inv.amount}</p>
                    <span className={cn("text-[10px] font-bold uppercase", inv.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600')}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-amber-600 font-bold text-sm" onClick={() => navigate('/billing')}>
                Go to Billing Hub <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl bg-white border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Reports</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl bg-white border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all">
              <AlertCircle className="h-6 w-6 text-rose-600" />
              <span className="text-xs font-bold text-slate-700">Alerts</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
