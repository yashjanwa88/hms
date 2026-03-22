import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Clock, Users, Phone, CheckCircle, XCircle, PlayCircle, Pause, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../../services/patientService';

interface QueueItem {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  mobileNumber: string;
  departmentId: string;
  departmentName: string;
  doctorId?: string;
  doctorName?: string;
  status: 'Waiting' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
  priority: 'Normal' | 'Emergency' | 'VIP';
  registrationTime: string;
  calledTime?: string;
  completedTime?: string;
  waitingTime?: number;
  serviceTime?: number;
}

export function PatientQueueManagement() {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [currentToken, setCurrentToken] = useState<QueueItem | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queryClient = useQueryClient();

  // Mock data - replace with actual API
  const departments = [
    { id: '1', name: 'OPD' },
    { id: '2', name: 'Emergency' },
    { id: '3', name: 'Cardiology' },
    { id: '4', name: 'Orthopedics' },
  ];

  const doctors = [
    { id: '1', name: 'Dr. Smith', departmentId: '1' },
    { id: '2', name: 'Dr. Johnson', departmentId: '1' },
    { id: '3', name: 'Dr. Williams', departmentId: '3' },
  ];

  // Fetch queue data
  const { data: queueData = [], isLoading } = useQuery({
    queryKey: ['patient-queue', selectedDepartment, selectedDoctor],
    queryFn: () => patientService.getQueue({
      doctorId: selectedDoctor || undefined,
      status: undefined,
    }).then(r => r.data ?? []),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const callNextMutation = useMutation({
    mutationFn: (queueId: string) => patientService.updateQueueStatus(queueId, 'InProgress'),
    onSuccess: () => {
      toast.success('Patient called successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-queue'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ queueId, status }: { queueId: string; status: string }) =>
      patientService.updateQueueStatus(queueId, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['patient-queue'] });
    },
  });

  const handleCallNext = () => {
    const nextPatient = queueData.find((q: QueueItem) => q.status === 'Waiting');
    if (nextPatient) {
      callNextMutation.mutate(nextPatient.id);
      setCurrentToken(nextPatient);
    } else {
      toast.info('No patients in queue');
    }
  };

  const handleComplete = (queueId: string) => {
    updateStatusMutation.mutate({ queueId, status: 'Completed' });
    setCurrentToken(null);
  };

  const handleCancel = (queueId: string) => {
    if (confirm('Cancel this token?')) {
      updateStatusMutation.mutate({ queueId, status: 'Cancelled' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'bg-yellow-100 text-yellow-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'NoShow': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500 text-white';
      case 'VIP': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const waitingCount = queueData.filter((q: QueueItem) => q.status === 'Waiting').length;
  const inProgressCount = queueData.filter((q: QueueItem) => q.status === 'InProgress').length;
  const completedCount = queueData.filter((q: QueueItem) => q.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Queue Management</h1>
          <p className="text-gray-600 mt-1">Token system and queue tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto Refresh (5s)
          </label>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Department</Label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Doctor</Label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">All Doctors</option>
                {doctors
                  .filter((doc) => !selectedDepartment || doc.departmentId === selectedDepartment)
                  .map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCallNext} className="w-full">
                <SkipForward className="h-4 w-4 mr-2" />
                Call Next Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <h3 className="text-3xl font-bold">{waitingCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <h3 className="text-3xl font-bold">{inProgressCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <h3 className="text-3xl font-bold">{completedCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <h3 className="text-3xl font-bold">{queueData.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Token Display */}
      {currentToken && (
        <Card className="border-4 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-2xl">Current Token</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-6xl font-bold text-blue-600 mb-4">{currentToken.tokenNumber}</div>
                <div className="space-y-2">
                  <p className="text-lg"><strong>Patient:</strong> {currentToken.patientName}</p>
                  <p><strong>UHID:</strong> {currentToken.patientUHID}</p>
                  <p><strong>Mobile:</strong> {currentToken.mobileNumber}</p>
                  <p><strong>Doctor:</strong> {currentToken.doctorName}</p>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <Button size="lg" onClick={() => handleComplete(currentToken.id)} className="w-full">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Complete
                </Button>
                <Button size="lg" variant="outline" onClick={() => setCurrentToken(null)} className="w-full">
                  <Pause className="h-5 w-5 mr-2" />
                  Hold
                </Button>
                <Button size="lg" variant="destructive" onClick={() => handleCancel(currentToken.id)} className="w-full">
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Queue List ({queueData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading queue...</div>
          ) : queueData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No patients in queue</div>
          ) : (
            <div className="space-y-3">
              {queueData.map((item: QueueItem) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.status === 'InProgress' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-700">{item.tokenNumber}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{item.patientName}</p>
                          {item.priority !== 'Normal' && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">UHID: {item.patientUHID} | Mobile: {item.mobileNumber}</p>
                        <p className="text-sm text-gray-600">Doctor: {item.doctorName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        {item.waitingTime && (
                          <p className="text-sm text-gray-600 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {item.waitingTime} min
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {item.status === 'Waiting' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              callNextMutation.mutate(item.id);
                              setCurrentToken(item);
                            }}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        )}
                        {item.status === 'InProgress' && (
                          <Button size="sm" onClick={() => handleComplete(item.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        {(item.status === 'Waiting' || item.status === 'InProgress') && (
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(item.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
