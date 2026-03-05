import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { visitService, UpdateVisitRequest } from '../services/visitService';
import { VisitTimeline } from '../components/VisitTimeline';
import { IPDConversionModal } from '../components/IPDConversionModal';
import { ArrowLeft, Edit, Save, X, Activity, Clock, User, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showIPDModal, setShowIPDModal] = useState(false);
  const [updateForm, setUpdateForm] = useState<UpdateVisitRequest>({});

  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitService.getVisit(id!),
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateVisitRequest) => visitService.updateVisit(id!, data),
    onSuccess: () => {
      toast.success('Visit updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['visit', id] });
    },
    onError: () => toast.error('Failed to update visit')
  });

  const checkInMutation = useMutation({
    mutationFn: () => visitService.checkInVisit(id!),
    onSuccess: () => {
      toast.success('Patient checked in');
      queryClient.invalidateQueries({ queryKey: ['visit', id] });
    },
    onError: () => toast.error('Failed to check in patient')
  });

  const checkOutMutation = useMutation({
    mutationFn: () => visitService.checkOutVisit(id!),
    onSuccess: () => {
      toast.success('Patient checked out');
      queryClient.invalidateQueries({ queryKey: ['visit', id] });
    },
    onError: () => toast.error('Failed to check out patient')
  });

  const handleEdit = () => {
    setUpdateForm({
      chiefComplaint: visit?.data?.chiefComplaint || '',
      symptoms: visit?.data?.symptoms || '',
      vitalSigns: visit?.data?.vitalSigns || '',
      diagnosis: visit?.data?.diagnosis || '',
      treatment: visit?.data?.treatment || '',
      prescription: visit?.data?.prescription || '',
      instructions: visit?.data?.instructions || '',
      followUpDate: visit?.data?.followUpDate || '',
      notes: visit?.data?.notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(updateForm);
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

  if (isLoading) return <div>Loading...</div>;
  if (!visit?.data) return <div>Visit not found</div>;

  const visitData = visit.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/visits')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visits
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{visitData.visitNumber}</h1>
            <p className="text-gray-600">Visit Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {visitData.status === 'Waiting' && (
            <Button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending}>
              <Clock className="mr-2 h-4 w-4" />
              Check In
            </Button>
          )}
          {visitData.status === 'InProgress' && (
            <>
              <Button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending}>
                <Clock className="mr-2 h-4 w-4" />
                Check Out
              </Button>
              {visitData.visitType === 'OPD' && (
                <Button onClick={() => setShowIPDModal(true)} variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  Convert to IPD
                </Button>
              )}
            </>
          )}
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Visit Information */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient UHID</Label>
                <p className="font-medium">{visitData.patientUHID}</p>
              </div>
              <div>
                <Label>Doctor</Label>
                <p className="font-medium">{visitData.doctorName}</p>
              </div>
              <div>
                <Label>Department</Label>
                <p className="font-medium">{visitData.department}</p>
              </div>
              <div>
                <Label>Visit Type</Label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  visitData.visitType === 'Emergency' ? 'bg-red-100 text-red-800' :
                  visitData.visitType === 'IPD' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {visitData.visitType}
                </span>
              </div>
              <div>
                <Label>Priority</Label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(visitData.priority)}`}>
                  {visitData.priority}
                </span>
              </div>
              <div>
                <Label>Status</Label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitData.status)}`}>
                  {visitData.status}
                </span>
              </div>
              <div>
                <Label>Visit Date & Time</Label>
                <p className="font-medium">{new Date(visitData.visitDateTime).toLocaleString()}</p>
              </div>
              {visitData.checkInTime && (
                <div>
                  <Label>Check-in Time</Label>
                  <p className="font-medium">{new Date(visitData.checkInTime).toLocaleString()}</p>
                </div>
              )}
              {visitData.checkOutTime && (
                <div>
                  <Label>Check-out Time</Label>
                  <p className="font-medium">{new Date(visitData.checkOutTime).toLocaleString()}</p>
                </div>
              )}
              {visitData.consultationFee && (
                <div>
                  <Label>Consultation Fee</Label>
                  <p className="font-medium">₹{visitData.consultationFee}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Clinical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chief Complaint</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.chiefComplaint || ''}
                    onChange={(e) => setUpdateForm({...updateForm, chiefComplaint: e.target.value})}
                    placeholder="Patient's main concern"
                  />
                ) : (
                  <p className="mt-1">{visitData.chiefComplaint || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Symptoms</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.symptoms || ''}
                    onChange={(e) => setUpdateForm({...updateForm, symptoms: e.target.value})}
                    placeholder="Describe symptoms"
                  />
                ) : (
                  <p className="mt-1">{visitData.symptoms || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Vital Signs</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.vitalSigns || ''}
                    onChange={(e) => setUpdateForm({...updateForm, vitalSigns: e.target.value})}
                    placeholder="BP, Pulse, Temperature, etc."
                  />
                ) : (
                  <p className="mt-1">{visitData.vitalSigns || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Diagnosis</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.diagnosis || ''}
                    onChange={(e) => setUpdateForm({...updateForm, diagnosis: e.target.value})}
                    placeholder="Clinical diagnosis"
                  />
                ) : (
                  <p className="mt-1">{visitData.diagnosis || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Treatment</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.treatment || ''}
                    onChange={(e) => setUpdateForm({...updateForm, treatment: e.target.value})}
                    placeholder="Treatment provided"
                  />
                ) : (
                  <p className="mt-1">{visitData.treatment || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Prescription</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.prescription || ''}
                    onChange={(e) => setUpdateForm({...updateForm, prescription: e.target.value})}
                    placeholder="Medications prescribed"
                  />
                ) : (
                  <p className="mt-1">{visitData.prescription || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Instructions</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.instructions || ''}
                    onChange={(e) => setUpdateForm({...updateForm, instructions: e.target.value})}
                    placeholder="Patient instructions"
                  />
                ) : (
                  <p className="mt-1">{visitData.instructions || 'Not recorded'}</p>
                )}
              </div>
              <div>
                <Label>Follow-up Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={updateForm.followUpDate || ''}
                    onChange={(e) => setUpdateForm({...updateForm, followUpDate: e.target.value})}
                  />
                ) : (
                  <p className="mt-1">{visitData.followUpDate ? new Date(visitData.followUpDate).toLocaleDateString() : 'Not scheduled'}</p>
                )}
              </div>
              <div>
                <Label>Notes</Label>
                {isEditing ? (
                  <Input
                    value={updateForm.notes || ''}
                    onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                    placeholder="Additional notes"
                  />
                ) : (
                  <p className="mt-1">{visitData.notes || 'No notes'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <VisitTimeline visitId={id!} />
        </div>
      </div>

      {/* IPD Conversion Modal */}
      {showIPDModal && (
        <IPDConversionModal
          visitId={id!}
          onClose={() => setShowIPDModal(false)}
          onSuccess={() => {
            setShowIPDModal(false);
            queryClient.invalidateQueries({ queryKey: ['visit', id] });
          }}
        />
      )}
    </div>
  );
}