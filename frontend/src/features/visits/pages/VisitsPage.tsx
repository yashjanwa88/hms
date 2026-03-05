import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { visitService, CreateVisitRequest, EmergencyVisitRequest } from '../services/visitService';
import { Plus, Search, Clock, AlertTriangle, Activity, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function VisitsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'emergency'>('list');
  const [searchParams, setSearchParams] = useState({
    visitNumber: '',
    patientUHID: '',
    department: '',
    status: '',
    visitType: '',
    fromDate: '',
    toDate: ''
  });
  const [createForm, setCreateForm] = useState<CreateVisitRequest>({
    patientId: '00000000-0000-0000-0000-000000000000',
    patientUHID: '',
    doctorId: '00000000-0000-0000-0000-000000000000',
    doctorName: '',
    department: '',
    visitType: 'OPD',
    priority: 'Normal',
    chiefComplaint: '',
    symptoms: '',
    isEmergency: false,
    consultationFee: 0
  });
  const [emergencyForm, setEmergencyForm] = useState<EmergencyVisitRequest>({
    patientId: '00000000-0000-0000-0000-000000000000',
    patientUHID: '',
    doctorId: '00000000-0000-0000-0000-000000000000',
    doctorName: '',
    chiefComplaint: '',
    symptoms: '',
    priority: 'Emergency',
    vitalSigns: ''
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', searchParams],
    queryFn: () => visitService.searchVisits({
      ...searchParams,
      pageNumber: 1,
      pageSize: 20
    })
  });

  const { data: stats } = useQuery({
    queryKey: ['visitStats'],
    queryFn: visitService.getVisitStats,
    refetchInterval: 60000
  });

  const createVisitMutation = useMutation({
    mutationFn: visitService.createVisit,
    onSuccess: () => {
      toast.success('Visit created successfully');
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visitStats'] });
    },
    onError: () => toast.error('Failed to create visit')
  });

  const createEmergencyMutation = useMutation({
    mutationFn: visitService.createEmergencyVisit,
    onSuccess: () => {
      toast.success('Emergency visit created successfully');
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visitStats'] });
    },
    onError: () => toast.error('Failed to create emergency visit')
  });

  const checkInMutation = useMutation({
    mutationFn: visitService.checkInVisit,
    onSuccess: () => {
      toast.success('Patient checked in');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: () => toast.error('Failed to check in patient')
  });

  const checkOutMutation = useMutation({
    mutationFn: visitService.checkOutVisit,
    onSuccess: () => {
      toast.success('Patient checked out');
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: () => toast.error('Failed to check out patient')
  });

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    createVisitMutation.mutate(createForm);
  };

  const handleCreateEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    createEmergencyMutation.mutate(emergencyForm);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'bg-yellow-100 text-yellow-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-100 text-red-800';
      case 'Urgent': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Visit Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setActiveTab('emergency')} 
            variant={activeTab === 'emergency' ? 'default' : 'outline'}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Emergency
          </Button>
          <Button 
            onClick={() => setActiveTab('create')} 
            variant={activeTab === 'create' ? 'default' : 'outline'}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Visit
          </Button>
        </div>
      </div>

      {stats?.data && (
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-2xl font-bold">{stats.data.totalVisits}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{stats.data.todayVisits}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{stats.data.activeVisits}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Emergency</p>
                  <p className="text-2xl font-bold">{stats.data.emergencyVisits}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">IPD Conversions</p>
                  <p className="text-2xl font-bold">{stats.data.ipdConversions}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.data.completedVisits}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVisit} className="grid grid-cols-3 gap-4">
              <div>
                <Label>Patient UHID *</Label>
                <Input 
                  value={createForm.patientUHID} 
                  onChange={(e) => setCreateForm({...createForm, patientUHID: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <Label>Doctor Name *</Label>
                <Input 
                  value={createForm.doctorName} 
                  onChange={(e) => setCreateForm({...createForm, doctorName: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <Label>Department *</Label>
                <select 
                  className="w-full border rounded px-3 py-2" 
                  value={createForm.department} 
                  onChange={(e) => setCreateForm({...createForm, department: e.target.value})} 
                  required
                >
                  <option value="">Select Department</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
              <div className="col-span-3">
                <Label>Chief Complaint</Label>
                <Input 
                  value={createForm.chiefComplaint} 
                  onChange={(e) => setCreateForm({...createForm, chiefComplaint: e.target.value})} 
                />
              </div>
              <div className="col-span-3">
                <Button type="submit" disabled={createVisitMutation.isPending}>
                  {createVisitMutation.isPending ? 'Creating...' : 'Create Visit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'emergency' && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Emergency Visit - Quick Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <form onSubmit={handleCreateEmergency} className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient UHID *</Label>
                <Input 
                  value={emergencyForm.patientUHID} 
                  onChange={(e) => setEmergencyForm({...emergencyForm, patientUHID: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <Label>Doctor Name *</Label>
                <Input 
                  value={emergencyForm.doctorName} 
                  onChange={(e) => setEmergencyForm({...emergencyForm, doctorName: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-span-2">
                <Label>Chief Complaint *</Label>
                <Input 
                  value={emergencyForm.chiefComplaint} 
                  onChange={(e) => setEmergencyForm({...emergencyForm, chiefComplaint: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-span-2">
                <Label>Symptoms *</Label>
                <Input 
                  value={emergencyForm.symptoms} 
                  onChange={(e) => setEmergencyForm({...emergencyForm, symptoms: e.target.value})} 
                  required 
                />
              </div>
              <div className="col-span-2">
                <Button 
                  type="submit" 
                  disabled={createEmergencyMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {createEmergencyMutation.isPending ? 'Creating...' : 'Create Emergency Visit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'list' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Search Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Visit Number</Label>
                  <Input 
                    value={searchParams.visitNumber} 
                    onChange={(e) => setSearchParams({...searchParams, visitNumber: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Patient UHID</Label>
                  <Input 
                    value={searchParams.patientUHID} 
                    onChange={(e) => setSearchParams({...searchParams, patientUHID: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={searchParams.department} 
                    onChange={(e) => setSearchParams({...searchParams, department: e.target.value})}
                  >
                    <option value="">All Departments</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={searchParams.status} 
                    onChange={(e) => setSearchParams({...searchParams, status: e.target.value})}
                  >
                    <option value="">All Status</option>
                    <option value="Waiting">Waiting</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Visit #</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Patient</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Doctor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {visits?.data?.items?.map((visit: any) => (
                        <tr key={visit.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => navigate(`/visits/${visit.id}`)} 
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {visit.visitNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3">{visit.patientUHID}</td>
                          <td className="px-4 py-3">{visit.doctorName}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {visit.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/visits/${visit.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {visit.status === 'Waiting' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => checkInMutation.mutate(visit.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {visit.status === 'InProgress' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => checkOutMutation.mutate(visit.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
