import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { patientService } from '../services/patientService';
import { QuickRegisterModal } from '../components/QuickRegisterModal';
import { Plus, X, Zap, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function PatientsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const navigate = useNavigate();
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
  });
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page],
    queryFn: () => patientService.getPatients(page, pageSize),
  });

  const createMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: () => {
      toast.success('Patient created successfully');
      setShowForm(false);
      setFormData({
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
      });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => {
      toast.error('Failed to create patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    { 
      header: 'UHID', 
      accessorKey: 'uhid',
    },
    { header: 'Name', accessorKey: 'fullName' },
    { header: 'Age', accessorKey: 'age' },
    { header: 'Gender', accessorKey: 'gender' },
    { header: 'Mobile', accessorKey: 'mobileNumber' },
    { header: 'City', accessorKey: 'city' },
    { 
      header: 'Status', 
      accessorKey: 'status',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowQuickRegister(true)} variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            Quick Register
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? 'Cancel' : 'Full Registration'}
          </Button>
        </div>
      </div>

      {showQuickRegister && <QuickRegisterModal onClose={() => setShowQuickRegister(false)} />}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Patient</CardTitle>
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
                <Input value={formData.allergiesSummary} onChange={(e) => setFormData({ ...formData, allergiesSummary: e.target.value })} placeholder="e.g., Penicillin, Peanuts" />
              </div>
              <div>
                <Label>Chronic Conditions</Label>
                <Input value={formData.chronicConditions} onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })} placeholder="e.g., Diabetes, Hypertension" />
              </div>
              <div>
                <Label>Current Medications</Label>
                <Input value={formData.currentMedications} onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })} placeholder="e.g., Metformin, Aspirin" />
              </div>
              <div>
                <Label>Disability Status</Label>
                <Input value={formData.disabilityStatus} onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.organDonor} onChange={(e) => setFormData({ ...formData, organDonor: e.target.checked })} />
                <Label>Organ Donor</Label>
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
                <Input value={formData.emergencyContactRelation} onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })} placeholder="e.g., Spouse, Parent" />
              </div>
              <div>
                <Label>Emergency Contact Mobile</Label>
                <Input value={formData.emergencyContactMobile} onChange={(e) => setFormData({ ...formData, emergencyContactMobile: e.target.value })} />
              </div>

              <div className="col-span-3 mt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Patient'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.accessorKey} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        {col.header}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data?.items?.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/patients/${row.id}`)} className="text-blue-600 hover:underline font-medium">
                          {row.uhid}
                        </button>
                      </td>
                      <td className="px-4 py-3">{row.fullName}</td>
                      <td className="px-4 py-3">{row.age}</td>
                      <td className="px-4 py-3">{row.gender}</td>
                      <td className="px-4 py-3">{row.mobileNumber}</td>
                      <td className="px-4 py-3">{row.city}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === 'Active' ? 'bg-green-100 text-green-800' :
                          row.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                          row.status === 'Merged' ? 'bg-orange-100 text-orange-800' :
                          row.status === 'Deceased' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${row.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
