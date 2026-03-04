import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { doctorService } from '../services/doctorService';
import { ArrowLeft, User, Phone, Mail, Briefcase, DollarSign, Edit } from 'lucide-react';

export function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id!),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>Doctor not found</div>;

  const doctor = data.data;
  const statusColor = doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/doctors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{doctor.fullName}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
          {doctor.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Doctor Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{doctor.doctorCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Department</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{doctor.department || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{doctor.experienceYears} Years</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Full Name</span>
              <span className="font-medium">{doctor.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gender</span>
              <span className="font-medium">{doctor.gender || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date of Birth</span>
              <span className="font-medium">{doctor.dateOfBirth !== '0001-01-01T00:00:00' ? new Date(doctor.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Age</span>
              <span className="font-medium">{doctor.age > 0 && doctor.age < 150 ? doctor.age : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Mobile</span>
              <span className="font-medium">{doctor.mobileNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{doctor.email || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">License Number</span>
              <span className="font-medium">{doctor.licenseNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-medium">{doctor.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Experience</span>
              <span className="font-medium">{doctor.experienceYears} Years</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Consultation Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{doctor.consultationFee}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(`/doctors/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>
    </div>
  );
}
