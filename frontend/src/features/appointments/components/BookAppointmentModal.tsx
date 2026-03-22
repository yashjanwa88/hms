import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { appointmentService } from '../services/appointmentService';
import { PatientSearch } from '../../patients/components/PatientSearch';

interface Doctor {
  id: string;
  fullName: string;
  department: string;
  consultationFee: number;
  specializations: string[];
  maxPatientsPerDay: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export function BookAppointmentModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    appointmentType: 'New',
    reason: '',
    sendNotification: true
  });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [specialization, setSpecialization] = useState('');
  const [dateValidation, setDateValidation] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get doctors list with specialization filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-booking', specialization],
    queryFn: () => appointmentService.getDoctorsForBooking(specialization || undefined),
  });

  const doctors = doctorsData?.data || [];

  // Validate date when doctor and date are selected
  const { data: validationData } = useQuery({
    queryKey: ['validate-date', formData.doctorId, formData.appointmentDate],
    queryFn: () => appointmentService.validateDate(formData.doctorId, formData.appointmentDate),
    enabled: !!(formData.doctorId && formData.appointmentDate),
  });

  useEffect(() => {
    if (validationData?.data) {
      setDateValidation(validationData.data);
    }
  }, [validationData]);

  // Get available slots when doctor and date are selected and date is valid
  const { data: slotsData } = useQuery({
    queryKey: ['available-slots', formData.doctorId, formData.appointmentDate],
    queryFn: () => appointmentService.getAvailableSlots(formData.doctorId, formData.appointmentDate),
    enabled: !!(formData.doctorId && formData.appointmentDate && dateValidation?.isValid),
  });

  useEffect(() => {
    if (slotsData?.data?.availableSlots) {
      setAvailableSlots(slotsData.data.availableSlots);
    }
  }, [slotsData]);

  const bookMutation = useMutation({
    mutationFn: (data: typeof formData) => appointmentService.bookAppointment(data),
    onSuccess: () => {
      toast.success('Appointment booked successfully');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient.id }));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setFormData(prev => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, appointmentDate: date, startTime: '', endTime: '' }));
    setAvailableSlots([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[700px] max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(formData); }} className="space-y-4">
            
            {/* Patient Selection */}
            <div>
              <Label>Select Patient *</Label>
              <PatientSearch 
                onPatientSelect={handlePatientSelect}
                placeholder="Search patient by name, UHID, or phone..."
              />
              {selectedPatient && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  Selected: {selectedPatient.fullName} ({selectedPatient.uhid})
                </div>
              )}
            </div>

            {/* Specialization Filter */}
            <div>
              <Label>Filter by Specialization (Optional)</Label>
              <Input 
                type="text" 
                placeholder="e.g., Cardiology, Neurology..."
                value={specialization} 
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>

            {/* Doctor Selection */}
            <div>
              <Label>Select Doctor *</Label>
              <select 
                className="w-full border rounded px-3 py-2" 
                required
                value={formData.doctorId} 
                onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor: Doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.fullName} - {doctor.department} - ₹{doctor.consultationFee}
                    {doctor.specializations?.length > 0 && ` (${doctor.specializations.join(', ')})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <Label>Appointment Date *</Label>
              <Input 
                type="date" 
                required
                min={getTodayDate()}
                value={formData.appointmentDate} 
                onChange={(e) => handleDateChange(e.target.value)} 
              />
              {dateValidation && !dateValidation.isValid && (
                <p className="text-red-500 text-sm mt-1">{dateValidation.message}</p>
              )}
              {dateValidation && dateValidation.isValid && (
                <p className="text-green-600 text-sm mt-1">
                  Available slots: {dateValidation.maxAppointmentsAllowed - dateValidation.currentAppointmentCount} remaining
                </p>
              )}
            </div>

            {/* Available Time Slots */}
            {formData.doctorId && formData.appointmentDate && dateValidation?.isValid && (
              <div>
                <Label>Available Time Slots *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {availableSlots.filter(slot => slot.isAvailable).map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`p-2 border rounded text-sm ${
                        formData.startTime === slot.startTime 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
                {availableSlots.filter(slot => slot.isAvailable).length === 0 && (
                  <p className="text-red-500 text-sm mt-2">No available slots for selected date</p>
                )}
              </div>
            )}

            {/* Appointment Type */}
            <div>
              <Label>Appointment Type *</Label>
              <select 
                className="w-full border rounded px-3 py-2" 
                required
                value={formData.appointmentType} 
                onChange={(e) => setFormData({...formData, appointmentType: e.target.value})}
              >
                <option value="New">New Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Emergency">Emergency</option>
                <option value="Routine">Routine Check-up</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <Label>Reason for Visit *</Label>
              <textarea 
                className="w-full border rounded px-3 py-2" 
                rows={3} 
                required
                placeholder="Describe the reason for appointment..."
                value={formData.reason} 
                onChange={(e) => setFormData({...formData, reason: e.target.value})} 
              />
            </div>

            {/* Send Notification */}
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="sendNotification"
                checked={formData.sendNotification} 
                onChange={(e) => setFormData({...formData, sendNotification: e.target.checked})} 
              />
              <Label htmlFor="sendNotification">Send SMS/Email confirmation</Label>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={bookMutation.isPending || !formData.patientId || !formData.doctorId || !formData.startTime || !dateValidation?.isValid}
              >
                {bookMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}