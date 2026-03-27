import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, Users, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { queueService } from '@/services/queueService';
import { toast } from 'sonner';
import type { QueueToken } from '@/types';

export function QueueManagementDashboard() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch active queue
  const { data: activeQueueData, refetch } = useQuery({
    queryKey: ['active-queue', selectedDoctorId],
    queryFn: () => queueService.getActiveQueue(selectedDoctorId || undefined),
    refetchInterval: 10000, // 10 seconds
  });

  const activeQueue: QueueToken[] = activeQueueData?.data || [];

  // Fetch today's statistics
  const { data: statsData } = useQuery({
    queryKey: ['queue-stats', selectedDoctorId],
    queryFn: () => queueService.getStatistics(undefined, selectedDoctorId || undefined),
    refetchInterval: 30000, // 30 seconds
  });

  const stats = statsData?.data;

  // Call next patient mutation
  const callNextMutation = useMutation({
    mutationFn: (doctorId: string) => queueService.callNextPatient(doctorId),
    onSuccess: (response) => {
      if (response.data) {
        toast.success(response.message || 'Patient called successfully');
      } else {
        toast.info('No patients waiting in queue');
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: () => {
      toast.error('Failed to call next patient');
    },
  });

  // Call specific token mutation
  const callTokenMutation = useMutation({
    mutationFn: (tokenId: string) => queueService.callSpecificToken(tokenId),
    onSuccess: () => {
      toast.success('Token called successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to call token');
    },
  });

  // Complete token mutation
  const completeMutation = useMutation({
    mutationFn: (tokenId: string) => queueService.completeToken(tokenId),
    onSuccess: () => {
      toast.success('Token marked as completed');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: () => {
      toast.error('Failed to complete token');
    },
  });

  const handleCallNext = () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor first');
      return;
    }
    callNextMutation.mutate(selectedDoctorId);
  };

  const waitingQueue = activeQueue.filter(t => t.status === 'Waiting');
  const calledQueue = activeQueue.filter(t => t.status === 'Called');
  const inProgressQueue = activeQueue.filter(t => t.status === 'InProgress');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-muted-foreground">Manage patient queue and call next patient</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Doctors</option>
            {/* Add doctor options here from doctors list */}
          </select>
          <Button
            onClick={handleCallNext}
            disabled={callNextMutation.isPending || !selectedDoctorId}
            size="lg"
            className="gap-2"
            data-testid="call-next-btn"
          >
            <Bell className="h-5 w-5" />
            Call Next Patient
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingQueue.length}</div>
            <p className="text-xs text-muted-foreground">
              Patients in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressQueue.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently consulting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedTokens || 0}</div>
            <p className="text-xs text-muted-foreground">
              Patients today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgWaitTimeMinutes || 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average waiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Active Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {activeQueue.length > 0 ? (
            <div className="space-y-4">
              {/* Called/In Progress Tokens */}
              {(calledQueue.length > 0 || inProgressQueue.length > 0) && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">NOW SERVING</h3>
                  {[...calledQueue, ...inProgressQueue].map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg mb-2"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-blue-600">
                          {token.tokenNumber}
                        </div>
                        <div>
                          <div className="font-medium text-lg">{token.patientName}</div>
                          <div className="text-sm text-gray-600">{token.doctorName}</div>
                        </div>
                        {token.priority === 2 && (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          token.status === 'InProgress'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {token.status}
                        </span>
                        {token.status !== 'Completed' && (
                          <Button
                            onClick={() => completeMutation.mutate(token.id)}
                            variant="outline"
                            size="sm"
                            data-testid={`complete-btn-${token.tokenNumber}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Waiting Tokens */}
              {waitingQueue.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">
                    WAITING ({waitingQueue.length})
                  </h3>
                  {waitingQueue.map((token, index) => (
                    <div
                      key={token.id}
                      className={`flex items-center justify-between p-4 rounded-lg mb-2 ${
                        index === 0
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-green-600' : 'text-gray-700'
                        }`}>
                          {token.tokenNumber}
                        </div>
                        <div>
                          <div className="font-medium">{token.patientName}</div>
                          <div className="text-sm text-gray-600">{token.doctorName}</div>
                        </div>
                        {token.priority > 0 && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            token.priority === 2
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {token.priority === 2 ? 'EMERGENCY' : 'SENIOR'}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                            NEXT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                          Wait: {token.waitTimeMinutes ? Math.round(token.waitTimeMinutes) : 0}m
                        </div>
                        <Button
                          onClick={() => callTokenMutation.mutate(token.id)}
                          variant="outline"
                          size="sm"
                          disabled={callTokenMutation.isPending}
                          data-testid={`call-btn-${token.tokenNumber}`}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No patients in queue</p>
              <p className="text-sm">Patients will appear here when tokens are assigned</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
