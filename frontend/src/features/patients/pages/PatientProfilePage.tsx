import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { patientService } from '../services/patientService';
import { encounterService } from '@/features/encounters/services/encounterService';
import { billingService } from '@/features/billing/services/billingService';
import { PatientHistoryTimeline } from '../components/PatientHistoryTimeline';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Activity, Edit, 
  DollarSign, Clock, CreditCard, Stethoscope, ArrowUpRight, Plus,
  ShieldCheck, History, MoreVertical, Printer, Share2,
  Badge,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (isLoading) return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-slate-100 rounded-3xl" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    </div>
  );
  
  if (!data?.data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <AlertCircle className="h-16 w-16 mb-4" />
      <h2 className="text-2xl font-bold">Patient Not Found</h2>
      <Button variant="link" onClick={() => navigate('/patients')} className="mt-2 text-primary font-bold">
        Return to Patient List
      </Button>
    </div>
  );

  const patient = data.data;
  const statusColor = patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="h-12 w-12 rounded-2xl bg-white shadow-sm">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.fullName || `${patient.firstName} ${patient.lastName}`}</h1>
              <Badge className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border", statusColor)}>
                {patient.status}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Verified Patient Record • UHID: {patient.uhid}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-slate-100 font-bold gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
          <div className="h-10 w-px bg-slate-200 mx-1" />
          <Button 
            className="h-12 px-6 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20"
            onClick={() => navigate(`/appointments/book?patientId=${patient.id}`)}
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </Button>
          <Button 
            variant="outline"
            className="h-12 px-6 rounded-2xl font-black gap-2 bg-white border-slate-100 text-amber-600 hover:bg-amber-50"
            onClick={() => navigate(`/billing/create?patientId=${patient.id}`)}
          >
            <DollarSign className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Patient Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Patient UHID', value: patient.uhid, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Age / Gender', value: `${patient.age}Y / ${patient.gender}`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Blood Group', value: patient.bloodGroup || 'Not Tested', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Total Visits', value: patient.visitCount || '0', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Identity Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Full Name', value: patient.fullName || `${patient.firstName} ${patient.lastName}` },
                { label: 'Date of Birth', value: new Date(patient.dateOfBirth).toLocaleDateString() },
                { label: 'Marital Status', value: patient.maritalStatus || 'Single' },
                { label: 'Registration Date', value: new Date(patient.registrationDate).toLocaleDateString() },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                  <span className="font-bold text-slate-700">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-indigo-600" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Mobile', value: patient.mobileNumber, icon: Phone },
                { label: 'WhatsApp', value: patient.whatsAppNumber || 'Not Linked', icon: Activity },
                { label: 'Email Address', value: patient.email || 'N/A', icon: Mail },
              ].map((row, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <row.icon className="h-4 w-4 text-slate-300" />
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-600" />
                Primary Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="font-bold text-slate-900 leading-relaxed">
                {patient.addressLine1}<br />
                {patient.city}, {patient.state} - {patient.pincode}<br />
                {patient.country || 'India'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History & Connected Modules */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline View */}
          <PatientHistoryTimeline patientId={patient.id} />

          {/* Connected Billing & Appointments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Recent Billing
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold" onClick={() => navigate(`/billing?patientId=${patient.id}`)}>
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {invoicesData?.data?.items?.length > 0 ? (
                  <div className="space-y-4">
                    {invoicesData.data.items.slice(0, 3).map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">#{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">${inv.totalAmount}</p>
                          <Badge className={cn(
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">No recent invoices.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-indigo-600" />
                  Appointments
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold" onClick={() => navigate(`/appointments?patientId=${patient.id}`)}>
                  History
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-sm text-slate-400 mb-3">Schedule next follow-up</p>
                  <Button size="sm" onClick={() => navigate(`/appointments/book?patientId=${patient.id}`)} className="h-9 px-4 rounded-xl font-bold gap-2">
                    <Plus className="h-4 w-4" /> Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
              