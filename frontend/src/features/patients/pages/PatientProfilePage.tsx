import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { patientService } from '../services/patientService';
import { encounterService } from '@/features/encounters/services/encounterService';
import { billingService } from '@/features/billing/services/billingService';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Activity, Edit, DollarSign } from 'lucide-react';

export function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id!),
  });

  const { data: encountersData } = useQuery({
    queryKey: ['encounters', id],
    queryFn: () => encounterService.searchEncounters({ patientId: id, pageNumber: 1, pageSize: 5 }),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: () => billingService.searchInvoices({ patientId: id, pageNumber: 1, pageSize: 5 }),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>Patient not found</div>;

  const patient = data.data;
  const statusColor = patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{patient.fullName}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
          {patient.status}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">UHID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.uhid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Age / Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.age}Y / {patient.gender}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Blood Group</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.bloodGroup || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{patient.visitCount}</p>
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
              <span className="font-medium">{patient.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date of Birth</span>
              <span className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Marital Status</span>
              <span className="font-medium">{patient.maritalStatus || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registration Date</span>
              <span className="font-medium">{new Date(patient.registrationDate).toLocaleDateString()}</span>
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
              <span className="font-medium">{patient.mobileNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Alternate Mobile</span>
              <span className="font-medium">{patient.alternateMobile || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{patient.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">WhatsApp</span>
              <span className="font-medium">{patient.whatsAppNumber || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{patient.addressLine1}</p>
            <p>{patient.city}, {patient.state} - {patient.pincode}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Medical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-gray-500 text-sm">Allergies</span>
              <p className="font-medium">{patient.allergiesSummary || 'None'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Chronic Conditions</span>
              <p className="font-medium">{patient.chronicConditions || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{patient.emergencyContactName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mobile</span>
            <span className="font-medium">{patient.emergencyContactMobile || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Encounters</CardTitle>
        </CardHeader>
        <CardContent>
          {encountersData?.data?.items?.length > 0 ? (
            <div className="space-y-2">
              {encountersData.data.items.map((enc: any) => (
                <div key={enc.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{enc.encounterNumber}</p>
                    <p className="text-sm text-gray-500">{enc.visitType} - {new Date(enc.encounterDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    enc.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No encounters yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesData?.data?.items?.length > 0 ? (
            <div className="space-y-2">
              {invoicesData.data.items.map((inv: any) => (
                <div key={inv.id} className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/billing/invoices/${inv.id}`)}>
                  <div>
                    <p className="font-medium">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">₹{inv.grandTotal.toFixed(2)} - Balance: ₹{inv.balanceAmount.toFixed(2)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No invoices yet</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => navigate('/encounters/create', { state: { patientId: id, patientName: patient.fullName, uhid: patient.uhid } })}>Create Encounter</Button>
        <Button variant="outline" onClick={() => navigate(`/patients/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
        <Button variant="outline" onClick={() => navigate(`/patients/${id}/history`)}>View History</Button>
      </div>
    </div>
  );
}
