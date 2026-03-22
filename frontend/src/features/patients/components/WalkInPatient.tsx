import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Zap, User, Phone, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';

export function WalkInPatient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    age: '',
    mobileNumber: '',
    emergencyContact: '',
    chiefComplaint: '',
  });

  const createWalkInMutation = useMutation({
    mutationFn: (data: any) => patientService.createWalkIn({
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      age: parseInt(data.age),
      mobileNumber: data.mobileNumber,
      emergencyContact: data.emergencyContact,
      chiefComplaint: data.chiefComplaint,
    }).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Walk-in patient created! UHID: ${data.uhid}`);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      // Ask if user wants to convert to full registration
      setTimeout(() => {
        if (confirm('Do you want to convert this to full registration?')) {
          navigate(`/patients/${data.id}/edit`);
        } else {
          resetForm();
        }
      }, 1000);
    },
    onError: () => {
      toast.error('Failed to create walk-in patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.gender || !formData.age) {
      toast.error('Please fill required fields');
      return;
    }

    createWalkInMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Male',
      age: '',
      mobileNumber: '',
      emergencyContact: '',
      chiefComplaint: '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          Walk-in Patient Registration
        </h1>
        <p className="text-gray-600 mt-1">Quick registration for emergency and walk-in patients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Alert */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Quick Registration Mode</p>
                    <p>This creates a temporary patient record. You can convert it to full registration later with complete details.</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Gender *</Label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Age (Years) *</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter age"
                      min="0"
                      max="150"
                      required
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mobile Number</Label>
                      <Input
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="10 digit mobile"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact</Label>
                      <Input
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="Emergency contact number"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Medical Information</h3>
                  <div>
                    <Label>Chief Complaint / Reason for Visit</Label>
                    <textarea
                      value={formData.chiefComplaint}
                      onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                      placeholder="Brief description of the complaint..."
                      className="w-full border rounded px-3 py-2 min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createWalkInMutation.isPending}
                    className="flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {createWalkInMutation.isPending ? 'Creating...' : 'Quick Register'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What is Walk-in Registration?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p>Quick registration for emergency patients who need immediate attention</p>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p>Minimal information required - just name, age, and gender</p>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p>Contact details are optional but recommended</p>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p>Can be converted to full registration later with complete details</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Instant UHID generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>No mandatory documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Quick OPD/Emergency access</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Upgrade to full registration anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Billing and treatment ready</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> After quick registration, you can convert to full registration by clicking "Edit" on the patient profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
