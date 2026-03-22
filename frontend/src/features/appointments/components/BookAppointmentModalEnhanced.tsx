import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { X, Calendar, Clock, User, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentService } from '../services/appointmentService';
import { PatientSearch } from '@/features/patients/components/PatientSearch';

interface BookAppointmentModalEnhancedProps {
  onClose: () => void;
  appointmentId?: string;
  patientId?: string;
}

export function BookAppointmentModalEnhanced({ onClose, appointmentId, patientId }: BookAppointmentModalEnhancedProps) {
  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    appointmentType: 'Consultation',
    reason: '',
    notes: '',
    priority: 'Normal',
    visitType: 'First Visit',
  });

  const queryClient = useQueryClient();

  // Fetch doctors list
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', searchDoctorQuery],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5008/api/doctors?search=${searchDoctorQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
          'X-User-Id': localStorage.getItem('userId') || '',
        },
      });
      const data = await response.json();
      return data.data?.items || [];
    },
  });

  // Fetch doctor schedule/slots
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctor-slots', selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor?.id) return [];
      const response = await fetch(
        `http://localhost:5004/api/appointments/doctor-schedule/${selectedDoctor.id}?date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-Tenant-Id': localStorage.getItem('tenantId') || '',
            'X-User-Id': localStorage.getItem('userId') || '',
          },
        }
      );
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!selectedDoctor?.id && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: appointmentService.bookAppointment,
    onSuccess: () => {
      toast.success('Appointment booked successfully');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id });
    setStep(2);
  };

  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setFormData({ ...formData, doctorId: doctor.id });
    setStep(3);
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      startTime: slot.startTime,
      endTime: slot.endTime,
      appointmentDate: selectedDate,
    });
    setStep(4);
  };

  const handleSubmit = () => {
    if (!formData.patientId || !formData.doctorId || !formData.startTime) {
      toast.error('Please complete all required fields');
      return;
    }
    bookMutation.mutate(formData);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const endHour = min === 30 ? hour + 1 : hour;
        const endMin = min === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        
        const isBooked = slotsData?.some((s: any) => s.startTime === startTime);
        
        slots.push({
          startTime,
          endTime,
          isAvailable: !isBooked,
        });
      }
    }
    return slots;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Appointment
          </CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: 'Patient' },
              { num: 2, label: 'Doctor' },
              { num: 3, label: 'Time Slot' },
              { num: 4, label: 'Details' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                  </div>
                  <span className="text-xs mt-1">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div
                    className={`h-1 flex-1 ${
                      step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Patient */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Patient</h3>
              <PatientSearch
                onPatientSelect={handlePatientSelect}
                placeholder="Search patient by name, UHID, or mobile..."
              />
              {selectedPatient && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                  <p className="font-semibold">{selectedPatient.fullName}</p>
                  <p className="text-sm text-gray-600">UHID: {selectedPatient.uhid}</p>
                  <p className="text-sm text-gray-600">Mobile: {selectedPatient.mobileNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Doctor */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Doctor</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctor by name or specialization..."
                  value={searchDoctorQuery}
                  onChange={(e) => setSearchDoctorQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {loadingDoctors ? (
                <div className="text-center py-8">Loading doctors...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {doctorsData?.map((doctor: any) => (
                    <div
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition ${
                        selectedDoctor?.id === doctor.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{doctor.fullName}</h4>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          <p className="text-xs text-gray-500 mt-1">{doctor.qualification}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {doctor.experience} years exp
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              ₹{doctor.consultationFee}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!selectedDoctor}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Time Slot */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
              
              <div className="mb-4">
                <Label>Appointment Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {loadingSlots ? (
                <div className="text-center py-8">Loading available slots...</div>
              ) : (
                <div>
                  <Label className="mb-2 block">Available Time Slots</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {generateTimeSlots().map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => slot.isAvailable && handleSlotSelect(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 border rounded text-sm font-medium transition ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'bg-blue-600 text-white border-blue-600'
                            : slot.isAvailable
                            ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Clock className="h-4 w-4 mx-auto mb-1" />
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!selectedSlot}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Appointment Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
              
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient:</span>
                    <p className="font-semibold">{selectedPatient?.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <p className="font-semibold">{selectedDoctor?.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-semibold">{selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Appointment Type *</Label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="FollowUp">Follow Up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>
                
                <div>
                  <Label>Visit Type</Label>
                  <select
                    value={formData.visitType}
                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="First Visit">First Visit</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Review">Review</option>
                  </select>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                
                <div>
                  <Label>Reason for Visit *</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Fever, Checkup"
                  />
                </div>
              </div>
              
              <div>
                <Label>Additional Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                  placeholder="Any additional information..."
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
