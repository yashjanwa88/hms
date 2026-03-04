import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { billingService } from '../services/billingService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingService.getInvoiceById(id!),
  });

  const [itemData, setItemData] = useState({
    itemType: 'Consultation',
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'Cash',
  });

  const [refundData, setRefundData] = useState({
    refundAmount: 0,
    reason: '',
    refundMethod: 'Cash',
  });

  const addItemMutation = useMutation({
    mutationFn: (data: any) => billingService.addInvoiceItem(id!, data),
    onSuccess: () => {
      toast.success('Item added successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setShowAddItem(false);
      setItemData({ itemType: 'Consultation', description: '', quantity: 1, unitPrice: 0 });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => billingService.recordPayment(id!, data),
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setShowPayment(false);
      setPaymentData({ amount: 0, paymentMethod: 'Cash' });
    },
  });

  const refundMutation = useMutation({
    mutationFn: (data: any) => billingService.processRefund(id!, data),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setShowRefund(false);
      setRefundData({ refundAmount: 0, reason: '', refundMethod: 'Cash' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Refund failed');
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>Invoice not found</div>;

  const invoice = data.data;
  const statusColor = 
    invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
    invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'Paid' && (
            <>
              <Button onClick={() => setShowAddItem(true)}>Add Item</Button>
              <Button variant="outline" onClick={() => setShowPayment(true)}>Record Payment</Button>
            </>
          )}
          {invoice.status === 'Paid' && invoice.paidAmount > 0 && (
            <Button variant="destructive" onClick={() => setShowRefund(true)}>Process Refund</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Subtotal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{invoice.subtotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{invoice.grandTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{invoice.balanceAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.items.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.itemType}</td>
                    <td className="py-2">{item.description}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-2">₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-4">No items added yet</p>
          )}
        </CardContent>
      </Card>

      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Item</h2>
            <form onSubmit={(e) => { e.preventDefault(); addItemMutation.mutate(itemData); }} className="space-y-4">
              <div>
                <Label>Item Type</Label>
                <select className="w-full border rounded px-3 py-2" value={itemData.itemType} onChange={(e) => setItemData({ ...itemData, itemType: e.target.value })}>
                  <option>Consultation</option>
                  <option>Lab</option>
                  <option>Medicine</option>
                  <option>Procedure</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={itemData.description} onChange={(e) => setItemData({ ...itemData, description: e.target.value })} required />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={itemData.quantity} onChange={(e) => setItemData({ ...itemData, quantity: parseInt(e.target.value) })} required />
              </div>
              <div>
                <Label>Unit Price</Label>
                <Input type="number" step="0.01" value={itemData.unitPrice} onChange={(e) => setItemData({ ...itemData, unitPrice: parseFloat(e.target.value) })} required />
              </div>
              <div className="flex gap-4">
                <Button type="submit">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
            <form onSubmit={(e) => { e.preventDefault(); paymentMutation.mutate(paymentData); }} className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })} required />
              </div>
              <div>
                <Label>Payment Method</Label>
                <select className="w-full border rounded px-3 py-2" value={paymentData.paymentMethod} onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="flex gap-4">
                <Button type="submit">Record Payment</Button>
                <Button type="button" variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Process Refund</h2>
            <form onSubmit={(e) => { e.preventDefault(); refundMutation.mutate(refundData); }} className="space-y-4">
              <div>
                <Label>Refund Amount (Max: ₹{invoice.paidAmount.toFixed(2)})</Label>
                <Input type="number" step="0.01" max={invoice.paidAmount} value={refundData.refundAmount} onChange={(e) => setRefundData({ ...refundData, refundAmount: parseFloat(e.target.value) })} required />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={refundData.reason} onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })} required placeholder="Reason for refund" />
              </div>
              <div>
                <Label>Refund Method</Label>
                <select className="w-full border rounded px-3 py-2" value={refundData.refundMethod} onChange={(e) => setRefundData({ ...refundData, refundMethod: e.target.value })}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>BankTransfer</option>
                </select>
              </div>
              <div className="flex gap-4">
                <Button type="submit" variant="destructive">Process Refund</Button>
                <Button type="button" variant="outline" onClick={() => setShowRefund(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
