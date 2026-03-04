import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { billingService } from '../services/billingService';
import { patientService } from '@/features/patients/services/patientService';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { itemType: 'Consultation', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [tax, setTax] = useState(18);
  const [discount, setDiscount] = useState(0);

  const { data: patients } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientService.searchPatients({ searchTerm: patientSearch, pageSize: 10 }),
    enabled: patientSearch.length > 2,
  });

  const createMutation = useMutation({
    mutationFn: billingService.createInvoice,
    onSuccess: (data) => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/billing/invoices/${data.data.id}`);
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const addItem = () => {
    setItems([...items, { itemType: 'Service', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = (subtotal * tax) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    createMutation.mutate({
      patientId: selectedPatient.id,
      encounterId: selectedPatient.id, // Temporary - should be actual encounter
      tax: taxAmount,
      discount: discountAmount,
      items,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <Button variant="outline" onClick={() => navigate('/billing')}>
          Back to Billing
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Search Patient</Label>
                <Input
                  placeholder="Search by name, UHID, or mobile"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              
              {patients?.data?.items && patientSearch.length > 2 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {patients.data.items.map((patient: any) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientSearch(patient.fullName);
                      }}
                    >
                      <div className="font-medium">{patient.fullName}</div>
                      <div className="text-sm text-gray-500">
                        UHID: {patient.uhid} | Mobile: {patient.mobileNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPatient && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="font-medium">{selectedPatient.fullName}</div>
                  <div className="text-sm text-gray-600">
                    UHID: {selectedPatient.uhid} | Age: {selectedPatient.age} | 
                    Mobile: {selectedPatient.mobileNumber}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 items-end">
                  <div>
                    <Label>Type</Label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={item.itemType}
                      onChange={(e) => updateItem(index, 'itemType', e.target.value)}
                    >
                      <option>Consultation</option>
                      <option>Procedure</option>
                      <option>Medicine</option>
                      <option>Test</option>
                      <option>Service</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Tax (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({tax}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({discount}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending || !selectedPatient}>
            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/billing')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}