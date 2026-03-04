import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { patientService } from '../services/patientService';
import { encounterService } from '@/features/encounters/services/encounterService';
import { ArrowLeft, Calendar, FileText, Activity } from 'lucide-react';

export function PatientHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id!),
  });

  const { data: encountersData } = useQuery({
    queryKey: ['patient-encounters', id],
    queryFn: () => encounterService.searchEncounters({ patientId: id, pageNumber: 1, pageSize: 20 }),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>Patient not found</div>;

  const patient = data.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{patient.fullName}</h1>
          <p className="text-gray-500">{patient.uhid}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.visitCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Registration Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{new Date(patient.registrationDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {patient.status}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {encountersData?.data?.items?.length > 0 ? (
            <div className="space-y-3">
              {encountersData.data.items.map((enc: any) => (
                <div key={enc.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">{enc.encounterNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(enc.encounterDate).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      enc.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                      enc.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {enc.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Visit Type:</span>
                      <span className="ml-2 font-medium">{enc.visitType}</span>
                    </div>
                    {enc.department && (
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 font-medium">{enc.department}</span>
                      </div>
                    )}
                  </div>
                  {enc.chiefComplaint && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Chief Complaint:</span>
                      <p className="mt-1">{enc.chiefComplaint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No visit records found</p>
              <p className="text-sm mt-2">Patient visits will appear here once encounters are created</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No medical records found</p>
            <p className="text-sm mt-2">Medical records and documents will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
