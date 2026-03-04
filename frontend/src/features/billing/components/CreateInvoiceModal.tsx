import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { billingService } from '../services/billingService';
import { toast } from 'sonner';

interface CreateInvoiceModalProps {
  encounterId: string;
  patientId: string;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}

export function CreateInvoiceModal({ encounterId, patientId, onClose, onSuccess }: CreateInvoiceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tax: 0,
    discount: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => billingService.createInvoice(data),
    onSuccess: (response) => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess(response.data.id);
      onClose();
    },
    onError: () => {
      toast.error('Failed to create invoice');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId,
      encounterId,
      tax: formData.tax,
      discount: formData.discount,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tax Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Discount Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
