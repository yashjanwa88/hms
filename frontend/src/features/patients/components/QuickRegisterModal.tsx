import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { patientService } from '../services/patientService';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface QuickRegisterModalProps {
  onClose: () => void;
}

export function QuickRegisterModal({ onClose }: QuickRegisterModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    mobileNumber: '',
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: () => {
      toast.success('Patient registered successfully');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to register patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>⚡ Quick Register</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>First Name *</Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
            <div>
              <Label>Gender *</Label>
              <select className="w-full border rounded px-3 py-2" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
            </div>
            <div>
              <Label>Mobile Number *</Label>
              <Input value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Registering...' : '⚡ Quick Register'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
            <p className="text-xs text-gray-500">Complete details can be added later</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
