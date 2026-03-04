import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { doctorService } from '../services/doctorService';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  mobileNumber: string;
  email: string;
  consultationFee: number;
  isActive: boolean;
}

export function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    department: '',
    gender: 'Male',
    consultationFee: 0
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => doctorService.getDoctors(search),
  });

  const doctors = data?.data?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => doctorService.createDoctor(data),
    onSuccess: () => {
      toast.success('Doctor added successfully');
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', mobileNumber: '', email: '', department: '', gender: 'Male', consultationFee: 0 });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: () => {
      toast.error('Failed to add doctor');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <Button onClick={() => setShowModal(true)}>Add Doctor</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Search doctors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['doctors'] })}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Department</th>
                <th className="text-left p-2">Mobile</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Fee</th>
                <th className="text-center p-2">Status</th>
                <th className="text-center p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor: Doctor) => (
                <tr key={doctor.id} className="border-b">
                  <td className="p-2">{doctor.firstName} {doctor.lastName}</td>
                  <td className="p-2">{doctor.department || '-'}</td>
                  <td className="p-2">{doctor.mobileNumber || '-'}</td>
                  <td className="p-2">{doctor.email}</td>
                  <td className="p-2">₹{doctor.consultationFee}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardHeader><CardTitle>Add Doctor</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input type="text" required
                      value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input type="text" required
                      value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <Input type="text" required
                    value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select className="w-full border rounded px-3 py-2" required
                    value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" required
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input type="tel" required
                    value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} />
                </div>
                <div>
                  <Label>Consultation Fee</Label>
                  <Input type="number" required
                    value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: Number(e.target.value)})} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Doctor'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
