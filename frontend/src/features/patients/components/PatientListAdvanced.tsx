import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  Search, Filter, Download, Upload, RefreshCw, Eye, Edit, Trash2, 
  FileText, Phone, Mail, MapPin, Calendar, User, Activity, AlertCircle,
  CheckCircle, XCircle, Clock, MoreVertical, Printer, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { PatientSearchModel, PatientInfoModel } from '../types';
import { patientService } from '../services/patientService';

export function PatientListAdvanced() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [searchFilters, setSearchFilters] = useState<PatientSearchModel>({
    searchText: '',
    uhid: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    patientTypeId: '',
    registrationTypeId: '',
    status: '',
    fromDate: '',
    toDate: '',
    ageFrom: undefined,
    ageTo: undefined,
    bloodGroup: '',
    city: '',
    state: '',
    pincode: '',
    insuranceCompany: '',
    policyNumber: '',
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'registrationDate',
    sortOrder: 'desc',
  });

  // Fetch patients
  const { data: patientsData, isLoading, refetch } = useQuery({
    queryKey: ['patients-list', searchFilters],
    queryFn: () => patientService.searchPatients(searchFilters),
  });

  const patients = patientsData?.data?.items || [];
  const totalCount = patientsData?.data?.totalCount || 0;
  const totalPages = patientsData?.data?.totalPages || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: () => {
      toast.success('Patient deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
    },
    onError: () => {
      toast.error('Failed to delete patient');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => patientService.deletePatient(id))),
    onSuccess: () => {
      toast.success('Selected patients deleted successfully');
      setSelectedPatients([]);
      queryClient.invalidateQueries({ queryKey: ['patients-list'] });
    },
    onError: () => {
      toast.error('Failed to delete selected patients');
    },
  });

  const handleSearch = () => {
    setSearchFilters({ ...searchFilters, pageNumber: 1 });
  };

  const handleClearFilters = () => {
    setSearchFilters({
      searchText: '',
      uhid: '',
      firstName: '',
      lastName: '',
      mobileNumber: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      patientTypeId: '',
      registrationTypeId: '',
      status: '',
      fromDate: '',
      toDate: '',
      ageFrom: undefined,
      ageTo: undefined,
      bloodGroup: '',
      city: '',
      state: '',
      pincode: '',
      insuranceCompany: '',
      policyNumber: '',
      pageNumber: 1,
      pageSize: 20,
      sortBy: 'registrationDate',
      sortOrder: 'desc',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(patients.map((p: PatientInfoModel) => p.id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients([...selectedPatients, patientId]);
    } else {
      setSelectedPatients(selectedPatients.filter(id => id !== patientId));
    }
  };

  const handleDelete = (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      deleteMutation.mutate(patientId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedPatients.length === 0) {
      toast.error('Please select patients to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete ${selectedPatients.length} selected patients?`)) {
      bulkDeleteMutation.mutate(selectedPatients);
    }
  };

  const handleExport = () => {
    toast.info('Exporting patients data...');
    // Implement export logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Merged': return 'bg-orange-100 text-orange-800';
      case 'Deceased': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4" />;
      case 'Inactive': return <XCircle className="h-4 w-4" />;
      case 'Merged': return <AlertCircle className="h-4 w-4" />;
      case 'Deceased': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-gray-600 mt-1">Manage and search patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/patients/register')}>
            <User className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Quick search by name, UHID, mobile, or email..."
                value={searchFilters.searchText}
                onChange={(e) => setSearchFilters({ ...searchFilters, searchText: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label>UHID</Label>
                <Input
                  placeholder="Enter UHID"
                  value={searchFilters.uhid}
                  onChange={(e) => setSearchFilters({ ...searchFilters, uhid: e.target.value })}
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input
                  placeholder="Enter first name"
                  value={searchFilters.firstName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  placeholder="Enter last name"
                  value={searchFilters.lastName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label>Mobile Number</Label>
                <Input
                  placeholder="Enter mobile"
                  value={searchFilters.mobileNumber}
                  onChange={(e) => setSearchFilters({ ...searchFilters, mobileNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={searchFilters.email}
                  onChange={(e) => setSearchFilters({ ...searchFilters, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={searchFilters.gender}
                  onChange={(e) => setSearchFilters({ ...searchFilters, gender: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Blood Group</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={searchFilters.bloodGroup}
                  onChange={(e) => setSearchFilters({ ...searchFilters, bloodGroup: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={searchFilters.status}
                  onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Merged">Merged</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <div>
                <Label>Age From</Label>
                <Input
                  type="number"
                  placeholder="Min age"
                  value={searchFilters.ageFrom || ''}
                  onChange={(e) => setSearchFilters({ ...searchFilters, ageFrom: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label>Age To</Label>
                <Input
                  type="number"
                  placeholder="Max age"
                  value={searchFilters.ageTo || ''}
                  onChange={(e) => setSearchFilters({ ...searchFilters, ageTo: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  placeholder="Enter city"
                  value={searchFilters.city}
                  onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  placeholder="Enter state"
                  value={searchFilters.state}
                  onChange={(e) => setSearchFilters({ ...searchFilters, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Registration From</Label>
                <Input
                  type="date"
                  value={searchFilters.fromDate}
                  onChange={(e) => setSearchFilters({ ...searchFilters, fromDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Registration To</Label>
                <Input
                  type="date"
                  value={searchFilters.toDate}
                  onChange={(e) => setSearchFilters({ ...searchFilters, toDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={searchFilters.dateOfBirth}
                  onChange={(e) => setSearchFilters({ ...searchFilters, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  placeholder="Enter pincode"
                  value={searchFilters.pincode}
                  onChange={(e) => setSearchFilters({ ...searchFilters, pincode: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
              <Button onClick={handleSearch}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedPatients.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">{selectedPatients.length} patients selected</span>
                <Button size="sm" variant="outline" onClick={() => setSelectedPatients([])}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button size="sm" variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Selected
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((searchFilters.pageNumber - 1) * searchFilters.pageSize) + 1} to{' '}
          {Math.min(searchFilters.pageNumber * searchFilters.pageSize, totalCount)} of {totalCount} patients
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Per page:</Label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={searchFilters.pageSize}
            onChange={(e) => setSearchFilters({ ...searchFilters, pageSize: Number(e.target.value), pageNumber: 1 })}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Patient List Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-600">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">No patients found</p>
              <Button className="mt-4" onClick={() => navigate('/patients/register')}>
                Register New Patient
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPatients.length === patients.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-medium">UHID</th>
                    <th className="p-3 text-left text-sm font-medium">Patient Name</th>
                    <th className="p-3 text-left text-sm font-medium">Age/Gender</th>
                    <th className="p-3 text-left text-sm font-medium">Contact</th>
                    <th className="p-3 text-left text-sm font-medium">Location</th>
                    <th className="p-3 text-left text-sm font-medium">Registration</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                    <th className="p-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((patient: PatientInfoModel) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={(e) => handleSelectPatient(patient.id, e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="text-blue-600 hover:underline font-mono font-semibold"
                        >
                          {patient.uhid}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold">{patient.fullName}</div>
                            {patient.bloodGroup && (
                              <div className="text-xs text-gray-500">Blood: {patient.bloodGroup}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>{patient.age}</div>
                          <div className="text-gray-500">{patient.gender}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm space-y-1">
                          {patient.mobileNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{patient.mobileNumber}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">{patient.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {patient.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>{patient.city}</span>
                            </div>
                          )}
                          {patient.state && (
                            <div className="text-gray-500 text-xs">{patient.state}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{new Date(patient.registrationDate).toLocaleDateString()}</span>
                          </div>
                          {patient.patientType && (
                            <div className="text-xs text-gray-500 mt-1">{patient.patientType}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(patient.status)}`}>
                          {getStatusIcon(patient.status)}
                          {patient.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            title="Edit Patient"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/patients/${patient.id}/documents`)}
                            title="Documents"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(patient.id)}
                            title="Delete Patient"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={searchFilters.pageNumber === 1}
            onClick={() => setSearchFilters({ ...searchFilters, pageNumber: searchFilters.pageNumber - 1 })}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={searchFilters.pageNumber === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchFilters({ ...searchFilters, pageNumber: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-gray-500">...</span>}
            {totalPages > 5 && (
              <Button
                variant={searchFilters.pageNumber === totalPages ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchFilters({ ...searchFilters, pageNumber: totalPages })}
              >
                {totalPages}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            disabled={searchFilters.pageNumber === totalPages}
            onClick={() => setSearchFilters({ ...searchFilters, pageNumber: searchFilters.pageNumber + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
