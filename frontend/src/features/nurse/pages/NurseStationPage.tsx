import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, Clock, AlertCircle, CheckCircle2, 
  RefreshCw, Filter, Search, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockPatients = [
  { id: 1, name: 'John Doe', age: 45, gender: 'Male', vitals: 'Stable', waitTime: '15 min', priority: 'Medium' },
  { id: 2, name: 'Jane Smith', age: 32, gender: 'Female', vitals: 'Critical', waitTime: '5 min', priority: 'High' },
  { id: 3, name: 'Bob Johnson', age: 58, gender: 'Male', vitals: 'Stable', waitTime: '30 min', priority: 'Low' },
  { id: 4, name: 'Alice Brown', age: 28, gender: 'Female', vitals: 'Stable', waitTime: '20 min', priority: 'Medium' },
];

export default function NurseStationPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || patient.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const stats = {
    total: mockPatients.length,
    critical: mockPatients.filter(p => p.vitals === 'Critical').length,
    stable: mockPatients.filter(p => p.vitals === 'Stable').length,
    waiting: mockPatients.length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Nurse Station</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Nurse Station
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
            Patient triage and vital signs monitoring.
          </p>
        </div>
        <Button className="h-10 gap-2 shadow-lg shadow-primary/20">
          <Users className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Total Patients
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Currently waiting
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Critical
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">
              {stats.critical}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Stable
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {stats.stable}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Vitals normal
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Avg Wait Time
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">
              18 min
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Average wait time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {(['All', 'High', 'Medium', 'Low'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    filterPriority === priority
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {priority}
                </button>
              ))}
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Patient Queue
            </CardTitle>
            <Badge variant="outline">
              {filteredPatients.length} patients
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Age/Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Vitals
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Wait Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {patient.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID: P-{String(patient.id).padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {patient.age} / {patient.gender}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          patient.priority === 'High' ? 'destructive' :
                          patient.priority === 'Medium' ? 'warning' : 'success'
                        }
                      >
                        {patient.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          patient.vitals === 'Critical' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {patient.vitals}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {patient.waitTime}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="gap-1"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No patients found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}