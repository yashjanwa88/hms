import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { visitService } from '../services/visitService';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface IPDConversionModalProps {
  visitId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function IPDConversionModal({ visitId, onClose, onSuccess }: IPDConversionModalProps) {
  const [formData, setFormData] = useState({
    reason: '',
    wardType: '',
    roomNumber: ''
  });

  const convertMutation = useMutation({
    mutationFn: () => visitService.convertToIPD(visitId, formData.reason, formData.wardType, formData.roomNumber),
    onSuccess: () => {
      toast.success('Visit converted to IPD successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to convert to IPD')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    convertMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Convert to IPD</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Reason for Admission *</Label>
            <Input
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
              placeholder="Enter reason for IPD admission"
            />
          </div>
          <div>
            <Label>Ward Type</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.wardType}
              onChange={(e) => setFormData({...formData, wardType: e.target.value})}
            >
              <option value="">Select Ward Type</option>
              <option value="General">General</option>
              <option value="Private">Private</option>
              <option value="ICU">ICU</option>
              <option value="NICU">NICU</option>
              <option value="CCU">CCU</option>
            </select>
          </div>
          <div>
            <Label>Room Number</Label>
            <Input
              value={formData.roomNumber}
              onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
              placeholder="e.g., 101, 202"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Convert to IPD'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
