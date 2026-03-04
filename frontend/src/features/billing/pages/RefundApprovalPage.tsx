import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { billingReportsService } from '../services/billingReportsService';

interface PendingRefund {
  id: string;
  invoiceNumber: string;
  refundAmount: number;
  reason: string;
  processedBy: string;
  processedAt: string;
  status: string;
}

export function RefundApprovalPage() {
  const [selectedRefund, setSelectedRefund] = useState<PendingRefund | null>(null);
  const [comments, setComments] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['pending-refunds'],
    queryFn: () => billingReportsService.getPendingRefunds(),
  });

  const refunds = data?.data?.items || [];

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRefund) return;
      if (action === 'approve') {
        return billingReportsService.approveRefund(selectedRefund.id, comments);
      } else {
        return billingReportsService.rejectRefund(selectedRefund.id, comments);
      }
    },
    onSuccess: () => {
      toast.success(`Refund ${action}d successfully`);
      setShowModal(false);
      setComments('');
      queryClient.invalidateQueries({ queryKey: ['pending-refunds'] });
    },
    onError: () => {
      toast.error(`Failed to ${action} refund`);
    },
  });

  const openModal = (refund: PendingRefund, actionType: 'approve' | 'reject') => {
    setSelectedRefund(refund);
    setAction(actionType);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Refund Approvals</h1>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['pending-refunds'] })}>Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Refunds</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Invoice</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Reason</th>
                <th className="text-left p-2">Processed By</th>
                <th className="text-center p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund: PendingRefund) => (
                <tr key={refund.id} className="border-b">
                  <td className="p-2">{refund.invoiceNumber}</td>
                  <td className="p-2 text-right">₹{refund.refundAmount?.toLocaleString() || '0'}</td>
                  <td className="p-2">{refund.reason}</td>
                  <td className="p-2">{refund.processedBy}</td>
                  <td className="p-2 text-center space-x-2">
                    <Button size="sm" onClick={() => openModal(refund, 'approve')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => openModal(refund, 'reject')}>Reject</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader><CardTitle>{action === 'approve' ? 'Approve' : 'Reject'} Refund</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add comments..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => actionMutation.mutate()} disabled={actionMutation.isPending}>
                  {actionMutation.isPending ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
