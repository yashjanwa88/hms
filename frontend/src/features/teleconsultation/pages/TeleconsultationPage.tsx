import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Users, Calendar, Clock, MapPin, Stethoscope, 
  FileText, Plus, Edit, Trash2, Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Teleconsultation {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  type: 'Video' | 'Audio';
  platform: 'Web' | 'Mobile App';
  consultationId: string;
}

const mockConsultations: Teleconsultation[] = [
  {
    id: '1',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    date: '2024-01-15',
    time: '10:00 AM',
    status: 'Scheduled',
    type: 'Video',
    platform: 'Web',
    consultationId: 'TC-2024-001'
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    doctorName: 'Dr. Johnson',
    date: '2024-01-14',
    time: '02:30 PM',
    status: 'Completed',
    type: 'Audio',
    platform: 'Mobile App',
    consultationId: 'TC-2024-002'
  },
  {
    id: '3',
    patientName: 'Bob Johnson',
    doctorName: 'Dr. Williams',
    date: '2024-01-13',
    time: '11:00 AM',
    status: 'In Progress',
    type: 'Video',
    platform: 'Web',
    consultationId: 'TC-2024-003'
  }
];

export default function TeleconsultationPage() {
  const [consultations, setConsultations] = useState<Teleconsultation[]>(mockConsultations);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Teleconsultation | null>(null);

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         consultation.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         consultation.consultationId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || consultation.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const joinConsultation = (consultation: Teleconsultation) => {
    if (consultation.status === 'Scheduled' || consultation.status === 'In Progress') {
      toast.success(`Joining consultation ${consultation.consultationId}...`);
      // Simulate joining consultation
      setTimeout(() => {
        window.open(`https://meet.example.com/${consultation.consultationId}`, '_blank');
      }, 1000);
    } else {
      toast.error('Consultation is not available');
    }
  };

  const startConsultation = (consultation: Teleconsultation) => {
    setConsultations(consultations.map(c => 
      c.id === consultation.id ? { ...c, status: 'In Progress' as const } : c
    ));
    toast.success('Consultation started');
  };

  const endConsultation = (consultation: Teleconsultation) => {
    setConsultations(consultations.map(c => 
      c.id === consultation.id ? { ...c, status: 'Completed' as const } : c
    ));
    toast.success('Consultation ended');
  };

  const cancelConsultation = (consultation: Teleconsultation) => {
    setConsultations(consultations.map(c => 
      c.id === consultation.id ? { ...c, status: 'Cancelled' as const } : c
    ));
    toast.success('Consultation cancelled');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Teleconsultation
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
            Manage virtual consultations and video appointments.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Schedule New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by patient name, doctor, or consultation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <div className="grid gap-6">
        {filteredConsultations.map((consultation) => (
          <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {consultation.patientName}
                    </h3>
                    <p className="text-sm text-slate-500">with {consultation.doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(consultation.status)}>
                    {consultation.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {consultation.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {consultation.platform}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4" />
                  <span>{consultation.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span>{consultation.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <FileText className="h-4 w-4" />
                  <span>ID: {consultation.consultationId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {consultation.status === 'Scheduled' && (
                    <Button onClick={() => startConsultation(consultation)} className="gap-2">
                      <Video className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                  {consultation.status === 'In Progress' && (
                    <>
                      <Button onClick={() => joinConsultation(consultation)} className="gap-2">
                        <Video className="h-4 w-4" />
                        Join
                      </Button>
                      <Button variant="outline" onClick={() => endConsultation(consultation)} className="gap-2">
                        <PhoneOff className="h-4 w-4" />
                        End
                      </Button>
                    </>
                  )}
                  {consultation.status === 'Scheduled' && (
                    <Button variant="outline" onClick={() => cancelConsultation(consultation)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                      <PhoneOff className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredConsultations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Video className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No consultations found</p>
          <p className="text-sm mt-2">Schedule a new teleconsultation to get started</p>
          <Button className="mt-4 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule New
          </Button>
        </div>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Teleconsultation</h2>
                  <p className="text-sm text-slate-500">Create a new virtual consultation</p>
                </div>
              </div>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Input placeholder="Search patient..." />
                </div>
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Input placeholder="Search doctor..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Consultation Type</Label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700">
                    <option value="Video">Video Consultation</option>
                    <option value="Audio">Audio Consultation</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Teleconsultation scheduled successfully!');
                setIsModalOpen(false);
              }}>
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}