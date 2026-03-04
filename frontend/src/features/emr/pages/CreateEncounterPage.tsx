import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { emrService } from '../services/emrService';
import { toast } from 'sonner';

const encounterSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  encounterType: z.enum(['OPD', 'IPD', 'Emergency']),
  encounterDate: z.string(),
  chiefComplaint: z.string().optional(),
});

type EncounterFormData = z.infer<typeof encounterSchema>;

export function CreateEncounterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EncounterFormData>({
    resolver: zodResolver(encounterSchema),
  });

  const onSubmit = async (data: EncounterFormData) => {
    setLoading(true);
    try {
      const response = await emrService.createEncounter(data);
      if (response.success) {
        toast.success('Encounter created successfully!');
        navigate(`/emr/encounter/${response.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to create encounter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Encounter</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Encounter Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input id="patientId" {...register('patientId')} />
              {errors.patientId && (
                <p className="text-sm text-destructive">{errors.patientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor ID</Label>
              <Input id="doctorId" {...register('doctorId')} />
              {errors.doctorId && (
                <p className="text-sm text-destructive">{errors.doctorId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="encounterType">Encounter Type</Label>
              <select
                id="encounterType"
                {...register('encounterType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="Emergency">Emergency</option>
              </select>
              {errors.encounterType && (
                <p className="text-sm text-destructive">{errors.encounterType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="encounterDate">Encounter Date</Label>
              <Input
                id="encounterDate"
                type="datetime-local"
                {...register('encounterDate')}
              />
              {errors.encounterDate && (
                <p className="text-sm text-destructive">{errors.encounterDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint</Label>
              <Input id="chiefComplaint" {...register('chiefComplaint')} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Encounter'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/emr')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
