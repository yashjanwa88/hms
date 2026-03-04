import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { patientService } from '../services/patientService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function EditPatientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id!),
  });

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: '',
    mobileNumber: '',
    alternateMobile: '',
    email: '',
    whatsAppNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    allergiesSummary: '',
    chronicConditions: '',
    currentMedications: '',
    disabilityStatus: '',
    organDonor: false,
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactMobile: '',
    status: 'Active',
  });

  useEffect(() => {
    if (data?.data) {
      const patient = data.data;
      setFormData({
        firstName: patient.firstName || '',
        middleName: patient.middleName || '',
        lastName: patient.lastName || '',
        gender: patient.gender || 'Male',
        dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
        bloodGroup: patient.bloodGroup || '',
        maritalStatus: patient.maritalStatus || '',
        mobileNumber: patient.mobileNumber || '',
        alternateMobile: patient.alternateMobile || '',
        email: patient.email || '',
        whatsAppNumber: patient.whatsAppNumber || '',
        addressLine1: patient.addressLine1 || '',
        addressLine2: patient.addressLine2 || '',
        city: patient.city || '',
        state: patient.state || '',
        pincode: patient.pincode || '',
        country: 'India',
        allergiesSummary: patient.allergiesSummary || '',
        chronicConditions: patient.chronicConditions || '',
        currentMedications: patient.currentMedications || '',
        disabilityStatus: patient.disabilityStatus || '',
        organDonor: patient.organDonor || false,
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactRelation: patient.emergencyContactRelation || '',
        emergencyContactMobile: patient.emergencyContactMobile || '',
        status: patient.status || 'Active',
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => patientService.updatePatient(id!, data),
    onSuccess: () => {
      toast.success('Patient updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate(`/patients/${id}`);
    },
    onError: () => {
      toast.error('Failed to update patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Patient</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <div className="col-span-3 border-b pb-2 mb-2">
              <h3 className="font-semibold text-lg">Personal Information</h3>
            </div>
            <div>
              <Label>First Name *</Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
            <div>
              <Label>Gender *</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
            </div>
            <div>
              <Label>Blood Group</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
            <div>
              <Label>Marital Status</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}>
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="col-span-3 border-b pb-2 mb-2 mt-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
            </div>
            <div>
              <Label>Mobile Number *</Label>
              <Input value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} required />
            </div>
            <div>
              <Label>Alternate Mobile</Label>
              <Input value={formData.alternateMobile} onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input value={formData.whatsAppNumber} onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label>Address Line 1</Label>
              <Input value={formData.addressLine1} onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })} />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <Input value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
            </div>

            <div className="col-span-3 border-b pb-2 mb-2 mt-4">
              <h3 className="font-semibold text-lg">Medical Information</h3>
            </div>
            <div>
              <Label>Allergies Summary</Label>
              <Input value={formData.allergiesSummary} onChange={(e) => setFormData({ ...formData, allergiesSummary: e.target.value })} />
            </div>
            <div>
              <Label>Chronic Conditions</Label>
              <Input value={formData.chronicConditions} onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })} />
            </div>
            <div>
              <Label>Current Medications</Label>
              <Input value={formData.currentMedications} onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })} />
            </div>

            <div className="col-span-3 border-b pb-2 mb-2 mt-4">
              <h3 className="font-semibold text-lg">Emergency Contact</h3>
            </div>
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} />
            </div>
            <div>
              <Label>Relation</Label>
              <Input value={formData.emergencyContactRelation} onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })} />
            </div>
            <div>
              <Label>Emergency Contact Mobile</Label>
              <Input value={formData.emergencyContactMobile} onChange={(e) => setFormData({ ...formData, emergencyContactMobile: e.target.value })} />
            </div>

            <div className="col-span-3 mt-4 flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Patient'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/patients/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
