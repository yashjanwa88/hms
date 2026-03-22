import { useParams, useNavigate } from 'react-router-dom';
import { FileManager } from '../components/file-manager/FileManager';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export function PatientDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock patient data - replace with actual API call
  const patientName = 'John Doe';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient
        </Button>
      </div>

      <FileManager patientId={id!} patientName={patientName} />
    </div>
  );
}
