import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Search, AlertTriangle, CheckCircle, ArrowRight, User, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../services/patientService';

interface PatientResult {
  id: string;
  uhid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  dateOfBirth?: string;
  gender: string;
  city?: string;
  state?: string;
  registrationDate: string;
  visitCount?: number;
}

export function PatientMerge() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PatientResult[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<PatientResult | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<PatientResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter mobile number or name');
      return;
    }
    setIsSearching(true);
    try {
      const res = await patientService.quickSearch(searchTerm);
      const patients: PatientResult[] = (res ?? []).map((p: any) => ({
        id: p.id,
        uhid: p.uhid ?? p.UHID,
        fullName: p.fullName ?? `${p.firstName ?? p.first_name} ${p.lastName ?? p.last_name}`.trim(),
        firstName: p.firstName ?? p.first_name,
        lastName: p.lastName ?? p.last_name,
        mobileNumber: p.mobileNumber ?? p.mobile_number,
        dateOfBirth: p.dateOfBirth ?? p.date_of_birth,
        gender: p.gender,
        city: p.city,
        state: p.state,
        registrationDate: p.registrationDate ?? p.registration_date,
        visitCount: p.visitCount ?? p.visit_count ?? 0,
      }));
      setResults(patients);
      if (patients.length === 0) toast.info('No patients found');
      else toast.success(`Found ${patients.length} patient(s)`);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const mergeMutation = useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      patientService.mergePatients({ primaryPatientId: primaryId, secondaryPatientId: duplicateId }),
    onSuccess: () => {
      toast.success('Patients merged successfully');
      setSelectedPrimary(null);
      setSelectedDuplicate(null);
      setResults([]);
      setSearchTerm('');
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => toast.error('Failed to merge patients'),
  });

  const handleMerge = () => {
    if (!selectedPrimary || !selectedDuplicate) {
      toast.error('Please select both primary and duplicate patient');
      return;
    }
    if (selectedPrimary.id === selectedDuplicate.id) {
      toast.error('Cannot merge same patient');
      return;
    }
    setShowConfirm(true);
  };

  const PatientCard = ({ patient, type, isSelected, onSelect }: {
    patient: PatientResult;
    type: 'primary' | 'duplicate' | null;
    isSelected: boolean;
    onSelect: (p: PatientResult) => void;
  }) => (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
      }`}
      onClick={() => onSelect(patient)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold">{patient.fullName}</h3>
            <p className="text-xs text-gray-500 font-mono">UHID: {patient.uhid}</p>
          </div>
        </div>
        {isSelected && <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />}
      </div>

      <div className="grid grid-cols-2 gap-1 text-sm">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-gray-400" />
          <span>{patient.mobileNumber || '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{patient.gender}</span>
        </div>
        {patient.dateOfBirth && (
          <div className="col-span-2 text-gray-600 text-xs">
            DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
          </div>
        )}
        {patient.city && (
          <div className="col-span-2 text-gray-600 text-xs">{patient.city}, {patient.state}</div>
        )}
        <div className="col-span-2 text-gray-600 text-xs">
          Registered: {new Date(patient.registrationDate).toLocaleDateString()}
        </div>
        <div className="col-span-2 text-gray-600 text-xs">Visits: {patient.visitCount ?? 0}</div>
      </div>

      {type && (
        <div className="mt-2 pt-2 border-t">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            type === 'primary' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {type === 'primary' ? 'Primary Record' : 'Duplicate Record'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Merge</h1>
        <p className="text-gray-600 mt-1">Find and merge duplicate patient records</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Search Patients</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Mobile Number or Patient Name</Label>
              <Input
                placeholder="Enter mobile number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Results ({results.length}) — Select Primary & Duplicate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
              Select the <strong>PRIMARY</strong> record (to keep) and the <strong>DUPLICATE</strong> record (to merge and remove).
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-700">Select Primary (Keep)</h3>
                <div className="space-y-3">
                  {results.map((p) => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      type={selectedPrimary?.id === p.id ? 'primary' : null}
                      isSelected={selectedPrimary?.id === p.id}
                      onSelect={setSelectedPrimary}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-orange-700">Select Duplicate (Remove)</h3>
                <div className="space-y-3">
                  {results.map((p) => (
                    <PatientCard
                      key={p.id}
                      patient={p}
                      type={selectedDuplicate?.id === p.id ? 'duplicate' : null}
                      isSelected={selectedDuplicate?.id === p.id}
                      onSelect={setSelectedDuplicate}
                    />
                  ))}
                </div>
              </div>
            </div>

            {selectedPrimary && selectedDuplicate && (
              <div className="mt-6 flex justify-center">
                <Button size="lg" onClick={handleMerge}>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Merge Patients
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {results.length === 0 && searchTerm && !isSearching && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <p className="text-lg font-semibold">No patients found</p>
            <p className="text-gray-600">Try a different search term</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      {showConfirm && selectedPrimary && selectedDuplicate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Confirm Patient Merge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                ⚠️ This action cannot be undone. The duplicate record will be permanently merged.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-green-500 rounded p-3 bg-green-50">
                  <p className="text-xs font-semibold text-green-700 mb-1">Primary (Keep)</p>
                  <p className="font-bold text-sm">{selectedPrimary.fullName}</p>
                  <p className="text-xs text-gray-600">{selectedPrimary.uhid}</p>
                </div>
                <div className="border-2 border-orange-500 rounded p-3 bg-orange-50">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Duplicate (Remove)</p>
                  <p className="font-bold text-sm">{selectedDuplicate.fullName}</p>
                  <p className="text-xs text-gray-600">{selectedDuplicate.uhid}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => mergeMutation.mutate({ primaryId: selectedPrimary.id, duplicateId: selectedDuplicate.id })}
                  disabled={mergeMutation.isPending}
                >
                  {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
