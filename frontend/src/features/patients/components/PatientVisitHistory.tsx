import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { visitService } from '@/features/visits/services/visitService';
import { History, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function PatientVisitHistory({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['patientVisitHistory', patientId],
    queryFn: () => visitService.getPatientVisitHistory(patientId)
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'bg-yellow-100 text-yellow-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div>Loading visit history...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" />
          Visit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data?.data?.length === 0 ? (
          <p className="text-gray-500">No visit history found</p>
        ) : (
          <div className="space-y-3">
            {data?.data?.map((visit: any) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{visit.visitNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {visit.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        visit.visitType === 'Emergency' ? 'bg-red-100 text-red-800' :
                        visit.visitType === 'IPD' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {visit.visitType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Doctor:</span> {visit.doctorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Department:</span> {visit.department}
                    </p>
                    {visit.diagnosis && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(visit.visitDateTime).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/visits/${visit.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
