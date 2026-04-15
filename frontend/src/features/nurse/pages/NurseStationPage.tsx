import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Clock, AlertCircle, CheckCircle2, RefreshCw, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const mockPatients = [
  { id: 1, name: 'John Doe',    age: 45, gender: 'Male',   vitals: 'Stable',   waitTime: '15 min', priority: 'Medium' },
  { id: 2, name: 'Jane Smith',  age: 32, gender: 'Female', vitals: 'Critical', waitTime: '5 min',  priority: 'High'   },
  { id: 3, name: 'Bob Johnson', age: 58, gender: 'Male',   vitals: 'Stable',   waitTime: '30 min', priority: 'Low'    },
  { id: 4, name: 'Alice Brown', age: 28, gender: 'Female', vitals: 'Stable',   waitTime: '20 min', priority: 'Medium' },
];

const PRIORITY_PILL: Record<string, string> = {
  High:   'status-emergency',
  Medium: 'status-waiting',
  Low:    'status-done',
};

export default function NurseStationPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filtered = mockPatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (priority === 'All' || p.priority === priority)
  );

  const stats = [
    { label: 'Total Patients', value: mockPatients.length,                                    icon: Users,        color: 'stat-blue',  text: 'text-blue-600'    },
    { label: 'Critical',       value: mockPatients.filter(p => p.vitals === 'Critical').length,icon: AlertCircle,  color: 'stat-rose',  text: 'text-rose-600'    },
    { label: 'Stable',         value: mockPatients.filter(p => p.vitals === 'Stable').length,  icon: CheckCircle2, color: 'stat-green', text: 'text-emerald-600' },
    { label: 'Avg Wait',       value: '18 min',                                                icon: Clock,        color: 'stat-amber', text: 'text-amber-600'   },
  ];

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Nurse Station</h1>
          <p className="page-subtitle">Patient triage, vital signs monitoring, and care coordination.</p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20">
          <Users className="h-4 w-4" /> Add Patient
        </Button>
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['All', 'High', 'Medium', 'Low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                priority === p
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {p}
            </button>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs ml-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Patient Queue
            </CardTitle>
            <span className="text-xs text-slate-400">{filtered.length} patients</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">No patients found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Priority</th>
                  <th>Vitals</th>
                  <th>Wait Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-none">{p.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">P-{String(p.id).padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">{p.age} / {p.gender}</td>
                    <td><span className={PRIORITY_PILL[p.priority] ?? 'status-inactive'}>{p.priority}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', p.vitals === 'Critical' ? 'bg-rose-500' : 'bg-emerald-500')} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{p.vitals}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500 tabular-nums">{p.waitTime}</td>
                    <td className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => navigate(`/patients/${p.id}`)}>
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
