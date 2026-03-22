import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Search, Calendar, AlertCircle, CheckCircle, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../services/patientService';

interface RenewalData {
  patientId: string;
  patientName: string;
  uhid: string;
  registrationDate: string;
  validTill: string;
  registrationType: string;
  patientType: string;
  daysRemaining: number;
  isExpired: boolean;
  renewalFee: number;
  lastRenewalDate?: string;
  renewalCount: number;
}

export function PatientRenewal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<RenewalData | null>(null);
  const [renewalPeriod, setRenewalPeriod] = useState('365'); // days
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discount, setDiscount] = useState(0);

  const queryClient = useQueryClient();

  const searchPatientMutation = useMutation({
    mutationFn: (term: string) => patientService.searchRenewal(term).then(r => r.data),
    onSuccess: (data) => {
      setSelectedPatient(data);
      if (data.isExpired) {
        toast.warning('Patient registration has expired!');
      } else if (data.daysRemaining <= 30) {
        toast.info(`Registration expires in ${data.daysRemaining} days`);
      }
    },
    onError: () => {
      toast.error('Patient not found');
      setSelectedPatient(null);
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data: any) => patientService.renewPatient(data),
    onSuccess: () => {
      toast.success('Registration renewed successfully!');
      setSelectedPatient(null);
      setSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => {
      toast.error('Failed to renew registration');
    },
  });

  const handleSearch = () => {
    if (!searchTerm) {
      toast.error('Please enter UHID or mobile number');
      return;
    }
    searchPatientMutation.mutate(searchTerm);
  };

  const handleRenew = () => {
    if (!selectedPatient) return;

    const finalAmount = selectedPatient.renewalFee - discount;

    if (confirm(`Renew registration for ${selectedPatient.patientName}?\nAmount: ₹${finalAmount}`)) {
      renewMutation.mutate({
        patientId: selectedPatient.patientId,
        renewalPeriod: parseInt(renewalPeriod),
        renewalFee: selectedPatient.renewalFee,
        discount,
        finalAmount,
        paymentMode,
      });
    }
  };

  const calculateNewValidTill = () => {
    if (!selectedPatient) return '';
    const currentValidTill = new Date(selectedPatient.validTill);
    const newValidTill = new Date(currentValidTill);
    newValidTill.setDate(newValidTill.getDate() + parseInt(renewalPeriod));
    return newValidTill.toLocaleDateString();
  };

  const finalAmount = selectedPatient ? selectedPatient.renewalFee - discount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Registration Renewal</h1>
        <p className="text-gray-600 mt-1">Renew patient registration and extend validity</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>UHID or Mobile Number</Label>
              <Input
                placeholder="Enter UHID or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searchPatientMutation.isPending}>
                <Search className="h-4 w-4 mr-2" />
                {searchPatientMutation.isPending ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details */}
      {selectedPatient && (
        <>
          <Card className={selectedPatient.isExpired ? 'border-red-500' : selectedPatient.daysRemaining <= 30 ? 'border-yellow-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patient Details</CardTitle>
                {selectedPatient.isExpired ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Expired
                  </span>
                ) : selectedPatient.daysRemaining <= 30 ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expiring Soon
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold">{selectedPatient.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">UHID</p>
                  <p className="font-semibold font-mono">{selectedPatient.uhid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Type</p>
                  <p className="font-semibold">{selectedPatient.registrationType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient Type</p>
                  <p className="font-semibold">{selectedPatient.patientType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="font-semibold">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Till</p>
                  <p className={`font-semibold ${selectedPatient.isExpired ? 'text-red-600' : selectedPatient.daysRemaining <= 30 ? 'text-yellow-600' : ''}`}>
                    {new Date(selectedPatient.validTill).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days Remaining</p>
                  <p className={`font-semibold ${selectedPatient.isExpired ? 'text-red-600' : selectedPatient.daysRemaining <= 30 ? 'text-yellow-600' : ''}`}>
                    {selectedPatient.isExpired ? 'Expired' : `${selectedPatient.daysRemaining} days`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Renewal Count</p>
                  <p className="font-semibold">{selectedPatient.renewalCount}</p>
                </div>
              </div>

              {selectedPatient.lastRenewalDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Last Renewal:</strong> {new Date(selectedPatient.lastRenewalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Renewal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Renewal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Renewal Period (Days)</Label>
                  <select
                    value={renewalPeriod}
                    onChange={(e) => setRenewalPeriod(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="90">3 Months (90 days)</option>
                    <option value="180">6 Months (180 days)</option>
                    <option value="365">1 Year (365 days)</option>
                    <option value="730">2 Years (730 days)</option>
                  </select>
                </div>

                <div>
                  <Label>New Valid Till</Label>
                  <Input value={calculateNewValidTill()} readOnly className="bg-gray-50" />
                </div>

                <div>
                  <Label>Renewal Fee</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <Input value={`₹${selectedPatient.renewalFee}`} readOnly className="bg-gray-50" />
                  </div>
                </div>

                <div>
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Math.min(selectedPatient.renewalFee, Number(e.target.value))))}
                    min="0"
                    max={selectedPatient.renewalFee}
                  />
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
                    <option value="NetBanking">Net Banking</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <Label>Final Amount</Label>
                  <div className="text-3xl font-bold text-green-600">
                    ₹{finalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <h4 className="font-semibold text-green-800 mb-2">Renewal Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <div>Current Valid Till: {new Date(selectedPatient.validTill).toLocaleDateString()}</div>
                  <div>New Valid Till: {calculateNewValidTill()}</div>
                  <div>Renewal Fee: ₹{selectedPatient.renewalFee}</div>
                  <div>Discount: ₹{discount}</div>
                  <div className="col-span-2 font-bold text-lg">Final Amount: ₹{finalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {renewMutation.isPending ? 'Processing...' : 'Renew Registration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchTerm('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Info Card */}
      {!selectedPatient && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">How to Renew Registration:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Search patient by UHID or mobile number</li>
                  <li>Verify patient details and current validity</li>
                  <li>Select renewal period (3 months, 6 months, 1 year, 2 years)</li>
                  <li>Apply discount if applicable</li>
                  <li>Select payment mode</li>
                  <li>Click "Renew Registration" to complete</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
