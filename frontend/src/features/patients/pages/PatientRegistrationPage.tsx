import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import PatientRegistrationForm from '../components/PatientRegistrationForm';
import { patientService } from '../services/patientService';
import {
  mapRegistrationFormToCreatePatientPayload,
  stripEmptyOptionalFields,
} from '../utils/mapRegistrationForm';
import { toast } from 'sonner';

export function PatientRegistrationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      let payload = mapRegistrationFormToCreatePatientPayload(data);
      payload = stripEmptyOptionalFields(payload);
      const envelope = (await patientService.createPatient(payload)) as {
        success?: boolean;
        message?: string;
        data?: {
          uhid?: string;
          potentialDuplicates?: unknown[];
        };
      };

      if (envelope?.success === false) {
        toast.error(envelope.message || 'Registration failed');
        return;
      }

      const reg = envelope?.data;
      const uhid = reg?.uhid;
      if (uhid) {
        toast.success(`Patient registered. UHID: ${uhid}`);
      } else {
        toast.success(envelope?.message || 'Patient registered successfully.');
      }

      if (reg?.potentialDuplicates?.length) {
        toast.warning('Possible duplicate matches found — review the patient master.');
      }

      navigate('/patients');
    } catch (err) {
      if (!isAxiosError(err) && err instanceof Error && err.message) {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/patients');
  };

  return (
    <div className="space-y-6">
      <PatientRegistrationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
