import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Search, Printer, History, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';

interface ReprintHistory {
  id: string;
  reprintDate: string;
  reprintBy: string;
  reason: string;
  charges: number;
  paymentMode: string;
}

export function PatientCardReprint() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [charges, setCharges] = useState(50);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: (term: string) => patientService.searchCardReprint(term).then(r => r.data),
    onSuccess: (data) => {
      setSelectedPatient(data);
    },
    onError: () => {
      toast.error('Patient not found');
    },
  });

  const { data: reprintHistory = [] } = useQuery<ReprintHistory[]>({
    queryKey: ['reprint-history', selectedPatient?.patientId],
    queryFn: () => patientService.getReprintHistory(selectedPatient!.patientId).then(r => r.data ?? []),
    enabled: !!selectedPatient,
  });

  const reprintMutation = useMutation({
    mutationFn: (data: any) => patientService.createCardReprint(data),
    onSuccess: () => {
      toast.success('Card reprint initiated!');
      queryClient.invalidateQueries({ queryKey: ['reprint-history'] });
      // Open print page
      if (selectedPatient) {
        window.open(`/patients/${selectedPatient.id}/print`, '_blank');
      }
    },
  });

  const handleSearch = () => {
    if (!searchTerm) {
      toast.error('Please enter UHID or mobile');
      return;
    }
    searchMutation.mutate(searchTerm);
  };

  const handleReprint = () => {
    if (!selectedPatient) return;
    if (!reason) {
      toast.error('Please enter reason for reprint');
      return;
    }

    if (confirm(`Reprint card for ${selectedPatient.patientName}?\nCharges: ₹${charges}`)) {
      reprintMutation.mutate({
        patientId: selectedPatient.patientId,
        reason,
        charges,
        paymentMode,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Card Reprint</h1>
        <p className="text-gray-600 mt-1">Reprint patient registration card with tracking</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>UHID or Mobile Number</Label>
              <Input
                placeholder="Enter UHID or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          {/* Patient Details */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold">{selectedPatient.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">UHID</p>
                  <p className="font-semibold font-mono">{selectedPatient.uhid ?? selectedPatient.uHID}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="font-semibold">{selectedPatient.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="font-semibold">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Reprint</p>
                  <p className="font-semibold">
                    {selectedPatient.lastReprintDate ? new Date(selectedPatient.lastReprintDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reprint Count</p>
                  <p className="font-semibold">{selectedPatient.reprintCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reprint Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Reprint Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Reason for Reprint *</Label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select reason</option>
                    <option value="Lost Card">Lost Card</option>
                    <option value="Damaged Card">Damaged Card</option>
                    <option value="Information Update">Information Update</option>
                    <option value="Duplicate Copy">Duplicate Copy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label>Reprint Charges</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={charges}
                      onChange={(e) => setCharges(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Free">Free (No Charge)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="text-2xl font-bold text-green-600">
                    Total: ₹{charges}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleReprint}
                  disabled={!reason || reprintMutation.isPending}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {reprintMutation.isPending ? 'Processing...' : 'Reprint Card'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/patients/${selectedPatient.id}/print`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reprint History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Reprint History ({reprintHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reprintHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No reprint history</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                        <th className="p-3 text-left text-sm font-medium">Reprinted By</th>
                        <th className="p-3 text-left text-sm font-medium">Reason</th>
                        <th className="p-3 text-left text-sm font-medium">Charges</th>
                        <th className="p-3 text-left text-sm font-medium">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reprintHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3 text-sm">{new Date(item.reprintDate).toLocaleString()}</td>
                          <td className="p-3 text-sm">{item.reprintBy}</td>
                          <td className="p-3 text-sm">{item.reason}</td>
                          <td className="p-3 text-sm font-semibold">₹{item.charges}</td>
                          <td className="p-3 text-sm">{item.paymentMode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Info */}
      {!selectedPatient && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Card Reprint Process:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Search patient by UHID or mobile number</li>
                <li>Select reason for reprint</li>
                <li>Confirm charges and payment mode</li>
                <li>Click "Reprint Card" to generate new card</li>
                <li>Card will open in new window for printing</li>
                <li>Reprint history is automatically tracked</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
