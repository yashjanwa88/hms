import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { pharmacyService } from '../services/pharmacyService';
import { Plus, CheckCircle, XCircle, FileText, Printer } from 'lucide-react';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  prescriptionDate: string;
  status: string;
  totalAmount: number;
  items: any[];
  verifiedAt?: string;
  dispensedAt?: string;
}

export function PrescriptionManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const queryClient = useQueryClient();

  const [prescriptionForm, setPrescrip tionForm] = useState({
    patientId: '',
    doctorId: '',
    encounterId: '',
    notes: '',
    items: [] as any[],
  });

  const [itemForm, setItemForm] = useState({
    drugId: '',
    quantity: 1,
    dosage: '',
    frequency: '',
    duration: 7,
    instructions: '',
  });

  const { data: drugsData } = useQuery({
    queryKey: ['drugs'],
    queryFn: () => pharmacyService.getDrugs(),
  });

  const drugs = drugsData?.data || [];

  const verifyMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.verifyPrescription(id),
    onSuccess: () => {
      toast.success('Prescription verified successfully');
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
    onError: () => toast.error('Failed to verify prescription'),
  });

  const dispenseMutation = useMutation({
    mutationFn: (id: string) => pharmacyService.dispensePrescription(id),
    onSuccess: () => {
      toast.success('Prescription dispensed successfully');
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setShowDetailsModal(false);
    },
    onError: () => toast.error('Failed to dispense prescription'),
  });

  const addItemToPrescription = () => {
    if (!itemForm.drugId || !itemForm.dosage || !itemForm.frequency) {
      toast.error('Please fill all required fields');
      return;
    }
    setPrescriptionForm({
      ...prescriptionForm,
      items: [...prescriptionForm.items, { ...itemForm }],
    });
    setItemForm({
      drugId: '',
      quantity: 1,
      dosage: '',
      frequency: '',
      duration: 7,
      instructions: '',
    });
  };

  const removeItem = (index: number) => {
    setPrescrip tionForm({
      ...prescriptionForm,
      items: prescriptionForm.items.filter((_, i) => i !== index),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Verified': return 'bg-blue-100 text-blue-800';
      case 'Dispensed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewPrescriptionDetails = async (prescriptionId: string) => {
    try {
      const response = await pharmacyService.getPrescriptionById(prescriptionId);
      setSelectedPrescription(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load prescription details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prescription Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Prescription list will appear here</p>
            <p className="text-sm">Connect to backend to view prescriptions</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Prescription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-[700px] max-h-[90vh] overflow-y-auto my-8">
            <CardHeader>
              <CardTitle>Create New Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Patient ID *</Label>
                    <Input required value={prescriptionForm.patientId} onChange={(e) => setPrescriptionForm({...prescriptionForm, patientId: e.target.value})} />
                  </div>
                  <div>
                    <Label>Doctor ID *</Label>
                    <Input required value={prescriptionForm.doctorId} onChange={(e) => setPrescriptionForm({...prescriptionForm, doctorId: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Encounter ID (Optional)</Label>
                  <Input value={prescriptionForm.encounterId} onChange={(e) => setPrescriptionForm({...prescriptionForm, encounterId: e.target.value})} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <textarea className="w-full border rounded px-3 py-2" rows={2} value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})} />
                </div>

                <hr />
                <h3 className="font-semibold">Add Medications</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Drug *</Label>
                    <select className="w-full border rounded px-3 py-2" value={itemForm.drugId} onChange={(e) => setItemForm({...itemForm, drugId: e.target.value})}>
                      <option value="">Select Drug</option>
                      {drugs.map((drug: any) => (
                        <option key={drug.id} value={drug.id}>{drug.drugName} - {drug.strength}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input type="number" min="1" value={itemForm.quantity} onChange={(e) => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Dosage *</Label>
                    <Input placeholder="e.g., 1 tablet" value={itemForm.dosage} onChange={(e) => setItemForm({...itemForm, dosage: e.target.value})} />
                  </div>
                  <div>
                    <Label>Frequency *</Label>
                    <Input placeholder="e.g., Twice daily" value={itemForm.frequency} onChange={(e) => setItemForm({...itemForm, frequency: e.target.value})} />
                  </div>
                  <div>
                    <Label>Duration (days) *</Label>
                    <Input type="number" min="1" value={itemForm.duration} onChange={(e) => setItemForm({...itemForm, duration: Number(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <Label>Instructions</Label>
                  <Input placeholder="e.g., Take after meals" value={itemForm.instructions} onChange={(e) => setItemForm({...itemForm, instructions: e.target.value})} />
                </div>

                <Button type="button" variant="outline" onClick={addItemToPrescription}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Prescription
                </Button>

                {/* Items List */}
                {prescriptionForm.items.length > 0 && (
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Prescription Items ({prescriptionForm.items.length})</h4>
                    <div className="space-y-2">
                      {prescriptionForm.items.map((item, idx) => {
                        const drug = drugs.find((d: any) => d.id === item.drugId);
                        return (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{drug?.drugName || 'Unknown Drug'}</p>
                              <p className="text-sm text-gray-600">
                                {item.dosage} - {item.frequency} - {item.duration} days - Qty: {item.quantity}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button disabled={prescriptionForm.items.length === 0}>
                    Create Prescription
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[600px]">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Prescription #</p>
                    <p className="font-medium">{selectedPrescription.prescriptionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedPrescription.status)}`}>
                      {selectedPrescription.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold">₹{selectedPrescription.totalAmount.toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  {selectedPrescription.status === 'Pending' && (
                    <Button onClick={() => verifyMutation.mutate(selectedPrescription.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  )}
                  {selectedPrescription.status === 'Verified' && (
                    <Button onClick={() => dispenseMutation.mutate(selectedPrescription.id)}>
                      Dispense
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
