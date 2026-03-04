import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { doctorService } from '../services/doctorService';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export function EditDoctorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    licenseNumber: '',
    experienceYears: 0,
    department: '',
    consultationFee: 0,
    isActive: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id!),
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        firstName: data.data.firstName,
        lastName: data.data.lastName,
        middleName: data.data.middleName || '',
        dateOfBirth: data.data.dateOfBirth !== '0001-01-01T00:00:00' ? data.data.dateOfBirth.split('T')[0] : '',
        gender: data.data.gender || 'Male',
        mobileNumber: data.data.mobileNumber,
        email: data.data.email,
        licenseNumber: data.data.licenseNumber || '',
        experienceYears: data.data.experienceYears || 0,
        department: data.data.department,
        consultationFee: data.data.consultationFee,
        isActive: data.data.isActive
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => doctorService.updateDoctor(id!, data),
    onSuccess: () => {
      toast.success('Doctor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      navigate(`/doctors/${id}`);
    },
    onError: () => {
      toast.error('Failed to update doctor');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/doctors/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Doctor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
              <div>
                <Label>Gender</Label>
                <select className="w-full border rounded px-3 py-2" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Mobile Number</Label>
                <Input required value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <Label>License Number</Label>
                <Input value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} />
              </div>
              <div>
                <Label>Experience (Years)</Label>
                <Input type="number" value={formData.experienceYears} onChange={(e) => setFormData({...formData, experienceYears: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Department</Label>
                <Input required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
              </div>
              <div>
                <Label>Consultation Fee</Label>
                <Input type="number" required value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Status</Label>
                <select className="w-full border rounded px-3 py-2" value={formData.isActive ? 'true' : 'false'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/doctors/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
