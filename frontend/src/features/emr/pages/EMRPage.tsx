import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Search, Calendar, Clock, Activity, Heart, Thermometer, 
  Droplets, FileText, AlertCircle, CheckCircle, ChevronRight,
  MoreVertical, Filter, Download, Share2, Printer, 
  History, Pill, ClipboardList, User, ShieldCheck,
  ArrowRight, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { emrService } from '../services/emrService';

export function EMRPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // In a real scenario, we might want to show encounters for a specific patient
  // or a global list for the clinician. For now, let's assume a global list.
  const { data: encountersData, isLoading } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => emrService.getPatientEncounters('current'), // Mocking global/current
  });

  const encounters = encountersData?.data || [];

  const stats = [
    { label: 'Active Encounters', value: '12', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed Today', value: '45', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Reviews', value: '08', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Critical Alerts', value: '03', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Clinical EMR</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Clinical Command Center
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Manage electronic medical records, clinical encounters, and patient longitudinal history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => navigate('/emr/create')} 
            className="h-12 px-6 shadow-xl shadow-primary/20 gap-2 text-base font-bold"
          >
            <Plus className="h-5 w-5" />
            Start New Encounter
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Encounters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search encounters by patient name, ID, or clinician..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary text-base shadow-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="h-12 px-5 gap-2 font-bold border-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Clinical Encounters
                </CardTitle>
                <Badge variant="outline" className="bg-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">
                  {encounters.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : encounters.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {encounters.map((encounter: any) => (
                    <div 
                      key={encounter.id} 
                      className="group flex items-center justify-between p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                      onClick={() => navigate(`/emr/encounter/${encounter.id}`)}
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Activity className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {encounter.encounterNumber}
                            </h3>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-1.5 py-0",
                              encounter.status === 'Open' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600"
                            )}>
                              {encounter.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {encounter.patientId}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(encounter.encounterDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end gap-1 mr-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encounter Type</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{encounter.encounterType}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-slate-200">
                          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                    <History className="h-10 w-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Encounters Found</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto mt-1">
                      Start a new clinical encounter to begin recording patient data.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/emr/create')} className="mt-4 font-black uppercase tracking-widest text-xs h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    New Encounter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Clinical Oversight */}
        <div className="space-y-8">
          {/* Quick Stats / Vitals Oversight */}
          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
                Vitals Oversight
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { label: 'Avg BP', value: '120/80', unit: 'mmHg', icon: Droplets, color: 'text-rose-400' },
                { label: 'Avg Heart Rate', value: '72', unit: 'bpm', icon: Activity, color: 'text-blue-400' },
                { label: 'Avg SpO2', value: '98', unit: '%', icon: Thermometer, color: 'text-emerald-400' },
              ].map((vital, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <vital.icon className={cn("h-5 w-5", vital.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{vital.label}</p>
                      <p className="text-lg font-black">{vital.value} <span className="text-[10px] text-white/40">{vital.unit}</span></p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[9px] font-black">Stable</Badge>
                </div>
              ))}
              
              <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs gap-2 mt-4">
                <LayoutDashboard className="h-4 w-4" />
                Vitals Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions / Shortcuts */}
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Clinical Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Prescribe', icon: Pill, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Lab Order', icon: Thermometer, color: 'bg-cyan-50 text-cyan-600' },
                  { label: 'SOAP Note', icon: FileText, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Audit Log', icon: History, color: 'bg-slate-50 text-slate-600' },
                ].map((action, i) => (
                  <button key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:shadow-md transition-all group">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform", action.color)}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
