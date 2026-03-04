import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { billingService } from '../services/billingService';
import { toast } from 'sonner';

const refundSchema = z.object({
  refundAmount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  refundMethod: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer']),
});

type RefundFormData = z.infer<typeof refundSchema>;

interface RefundModalProps {
  invoiceId: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundModal({ invoiceId, maxAmount, onClose, onSuccess }: RefundModalProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
  });

  const onSubmit = async (data: RefundFormData) => {
    if (data.refundAmount > maxAmount) {
      toast.error(`Refund amount cannot exceed ₹${maxAmount}`);
      return;
    }

    setLoading(true);
    try {
      await billingService.processRefund(invoiceId, data);
      toast.success('Refund processed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Process Refund</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Refund Amount (Max: ₹{maxAmount})</Label>
              <Input
                type="number"
                step="0.01"
                max={maxAmount}
                {...register('refundAmount', { valueAsNumber: true })}
              />
              {errors.refundAmount && (
                <p className="text-sm text-red-500">{errors.refundAmount.message}</p>
              )}
            </div>

            <div>
              <Label>Reason</Label>
              <Input {...register('reason')} />
              {errors.reason && (
                <p className="text-sm text-red-500">{errors.reason.message}</p>
              )}
            </div>

            <div>
              <Label>Refund Method</Label>
              <select {...register('refundMethod')} className="w-full p-2 border rounded">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              {errors.refundMethod && (
                <p className="text-sm text-red-500">{errors.refundMethod.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Processing...' : 'Process Refund'}
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