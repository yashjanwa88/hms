import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { encounterService } from '../services/encounterService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function CreateEncounterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId, patientName, uhid } = location.state || {};

  const [formData, setFormData] = useState({
    patientId: patientId || '',
    doctorId: '',
    visitType: 'OPD',
    department: '',
    chiefComplaint: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => encounterService.createEncounter(data),
    onSuccess: () => {
      toast.success('Encounter created successfully');
      navigate(`/patients/${patientId}`);
    },
    onError: () => {
      toast.error('Failed to create encounter');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use a dummy doctor ID if not provided
    const payload = {
      ...formData,
      doctorId: formData.doctorId || '00000000-0000-0000-0000-000000000000',
    };
    
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Encounter</h1>
          {patientName && <p className="text-gray-500">{patientName} ({uhid})</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encounter Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Visit Type *</Label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  required
                >
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <Label>Department</Label>
                <Input 
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., General Medicine"
                />
              </div>

              <div>
                <Label>Doctor ID (Optional)</Label>
                <Input 
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  placeholder="Leave empty for now"
                />
              </div>

              <div className="col-span-2">
                <Label>Chief Complaint</Label>
                <textarea 
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Patient's main complaint..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Encounter'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
