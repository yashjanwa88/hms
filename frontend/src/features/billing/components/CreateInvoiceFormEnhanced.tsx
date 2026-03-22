import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Trash2, Calculator, Receipt, X } from 'lucide-react';
import { PatientSearch } from '@/features/patients/components/PatientSearch';

interface InvoiceItem {
  serviceId: string;
  serviceName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'Percentage' | 'Amount';
  taxRate: number;
  amount: number;
}

interface CreateInvoiceFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  patientId?: string;
}

export function CreateInvoiceForm({ onClose, onSubmit, patientId }: CreateInvoiceFormProps) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      patientId: patientId || '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentMode: 'Cash',
      paymentStatus: 'Unpaid',
      notes: '',
      items: [
        {
          serviceId: '',
          serviceName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          discountType: 'Percentage' as const,
          taxRate: 18,
          amount: 0,
        },
      ] as InvoiceItem[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');

  // Calculate totals whenever items change
  useEffect(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount =
        item.discountType === 'Percentage'
          ? (itemSubtotal * item.discount) / 100
          : item.discount;
      const afterDiscount = itemSubtotal - discountAmount;
      const taxAmount = (afterDiscount * item.taxRate) / 100;
      const itemTotal = afterDiscount + taxAmount;

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    setTotals({
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
    });
  }, [items]);

  const calculateItemAmount = (index: number) => {
    const item = items[index];
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount =
      item.discountType === 'Percentage'
        ? (itemSubtotal * item.discount) / 100
        : item.discount;
    const afterDiscount = itemSubtotal - discountAmount;
    const taxAmount = (afterDiscount * item.taxRate) / 100;
    const amount = afterDiscount + taxAmount;
    
    setValue(`items.${index}.amount`, amount);
    return amount;
  };

  const addNewItem = () => {
    append({
      serviceId: '',
      serviceName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'Percentage',
      taxRate: 18,
      amount: 0,
    });
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
  };

  const onFormSubmit = (data: any) => {
    const invoiceData = {
      ...data,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
    };
    onSubmit(invoiceData);
  };

  // Service/Item templates
  const serviceTemplates = [
    { id: '1', name: 'Consultation Fee', price: 500, taxRate: 18 },
    { id: '2', name: 'Blood Test - CBC', price: 300, taxRate: 5 },
    { id: '3', name: 'X-Ray Chest', price: 800, taxRate: 12 },
    { id: '4', name: 'ECG', price: 400, taxRate: 12 },
    { id: '5', name: 'Ultrasound', price: 1200, taxRate: 12 },
    { id: '6', name: 'Medicine', price: 0, taxRate: 12 },
    { id: '7', name: 'Injection', price: 150, taxRate: 12 },
    { id: '8', name: 'Dressing', price: 200, taxRate: 18 },
  ];

  const applyServiceTemplate = (index: number, serviceId: string) => {
    const service = serviceTemplates.find((s) => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.serviceId`, service.id);
      setValue(`items.${index}.serviceName`, service.name);
      setValue(`items.${index}.unitPrice`, service.price);
      setValue(`items.${index}.taxRate`, service.taxRate);
      calculateItemAmount(index);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-white z-10">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Invoice
          </CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="mb-2 block font-semibold">Select Patient *</Label>
              {!selectedPatient ? (
                <PatientSearch
                  onPatientSelect={handlePatientSelect}
                  placeholder="Search patient by name, UHID, or mobile..."
                />
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <p className="font-semibold">{selectedPatient.fullName}</p>
                    <p className="text-sm text-gray-600">UHID: {selectedPatient.uhid}</p>
                    <p className="text-sm text-gray-600">Mobile: {selectedPatient.mobileNumber}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Invoice Date *</Label>
                <Input type="date" {...register('invoiceDate', { required: true })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" {...register('dueDate')} />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <select {...register('paymentMode')} className="w-full border rounded px-3 py-2">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <select {...register('paymentStatus')} className="w-full border rounded px-3 py-2">
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Invoice Items</h3>
                <Button type="button" onClick={addNewItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">#</th>
                      <th className="p-2 text-left text-sm font-medium">Service/Item</th>
                      <th className="p-2 text-left text-sm font-medium">Description</th>
                      <th className="p-2 text-left text-sm font-medium w-20">Qty</th>
                      <th className="p-2 text-left text-sm font-medium w-24">Unit Price</th>
                      <th className="p-2 text-left text-sm font-medium w-24">Discount</th>
                      <th className="p-2 text-left text-sm font-medium w-20">Tax %</th>
                      <th className="p-2 text-left text-sm font-medium w-28">Amount</th>
                      <th className="p-2 text-center text-sm font-medium w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <select
                            {...register(`items.${index}.serviceId`)}
                            onChange={(e) => applyServiceTemplate(index, e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select Service</option>
                            {serviceTemplates.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                          <Input
                            {...register(`items.${index}.serviceName`)}
                            placeholder="Or enter custom"
                            className="mt-1 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            {...register(`items.${index}.description`)}
                            placeholder="Description"
                            className="text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            min="1"
                            onChange={() => calculateItemAmount(index)}
                            className="text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            min="0"
                            step="0.01"
                            onChange={() => calculateItemAmount(index)}
                            className="text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              {...register(`items.${index}.discount`, { valueAsNumber: true })}
                              min="0"
                              onChange={() => calculateItemAmount(index)}
                              className="text-sm w-16"
                            />
                            <select
                              {...register(`items.${index}.discountType`)}
                              onChange={() => calculateItemAmount(index)}
                              className="border rounded px-1 text-xs w-12"
                            >
                              <option value="Percentage">%</option>
                              <option value="Amount">₹</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                            min="0"
                            max="100"
                            onChange={() => calculateItemAmount(index)}
                            className="text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            {...register(`items.${index}.amount`, { valueAsNumber: true })}
                            readOnly
                            className="bg-gray-50 text-sm font-semibold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Discount:</span>
                    <span className="font-semibold text-red-600">
                      - ₹{totals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Tax (GST):</span>
                    <span className="font-semibold">₹{totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-lg">Grand Total:</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₹{totals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes / Terms & Conditions</Label>
              <textarea
                {...register('notes')}
                className="w-full border rounded px-3 py-2 min-h-[80px]"
                placeholder="Add any notes or terms..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedPatient}>
                <Calculator className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
