import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, UserPlus, Activity, TrendingUp, Calendar, MapPin, Heart, FileText } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { patientService } from '../services/patientService';

const GENDER_COLORS = ['#3B82F6', '#EC4899'];
const TYPE_COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16'];

export function PatientDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['patient-dashboard-stats'],
    queryFn: () => patientService.getPatientDashboardStats(),
    staleTime: 60_000,
  });

  const stats = statsData ?? {
    totalPatients: 0, todayRegistrations: 0, activePatients: 0, inactivePatients: 0,
    malePatients: 0, femalePatients: 0, avgAge: 0,
    genderData: [], ageGroupData: [], patientTypeData: [],
    cityWiseData: [], monthlyRegistrations: [], bloodGroupData: [],
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold">{Number(value).toLocaleString()}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of patient statistics and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="bg-blue-500" subtitle="All registered patients" />
        <StatCard title="Today's Registrations" value={stats.todayRegistrations} icon={UserPlus} color="bg-green-500" subtitle="New patients today" />
        <StatCard
          title="Active Patients" value={stats.activePatients} icon={Activity} color="bg-purple-500"
          subtitle={stats.totalPatients > 0 ? `${((stats.activePatients / stats.totalPatients) * 100).toFixed(1)}% of total` : ''}
        />
        <StatCard title="Avg Age" value={`${stats.avgAge} yrs`} icon={TrendingUp} color="bg-orange-500" subtitle="Average patient age" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.genderData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100} dataKey="count">
                  {stats.genderData.map((_: any, i: number) => (
                    <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500" /><span className="text-sm">Male: {Number(stats.malePatients).toLocaleString()}</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-pink-500" /><span className="text-sm">Female: {Number(stats.femalePatients).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Age Group Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ageGroupData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Patient Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.patientTypeData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100} dataKey="count">
                  {stats.patientTypeData.map((_: any, i: number) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Cities</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.cityWiseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" /><YAxis dataKey="name" type="category" width={80} /><Tooltip />
                <Bar dataKey="count" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Monthly Registration Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Registrations" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Blood Group Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.bloodGroupData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div><p className="text-sm text-gray-600">Average Age</p><p className="text-2xl font-bold">{stats.avgAge} years</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-green-600" />
              <div><p className="text-sm text-gray-600">Top City</p><p className="text-2xl font-bold">{stats.cityWiseData?.[0]?.name ?? '-'}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-600" />
              <div><p className="text-sm text-gray-600">Most Common Blood</p><p className="text-2xl font-bold">{stats.bloodGroupData?.[0]?.name ?? '-'}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div><p className="text-sm text-gray-600">Inactive Patients</p><p className="text-2xl font-bold">{Number(stats.inactivePatients).toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
