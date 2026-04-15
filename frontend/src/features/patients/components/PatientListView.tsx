/**
 * PatientListView Component
 * Comprehensive patient list with advanced filtering, sorting, and pagination
 * Inspired by web-softclinic-app's patient list component
 */

import React, { useState, useEffect } from 'react';
import { enhancedPatientService, PatientFilter, PatientSearchModel } from '../services/enhancedPatientService';

interface PatientListViewProps {
  onPatientSelect?: (patient: PatientSearchModel) => void;
  onPatientEdit?: (patientId: string) => void;
  onPatientView?: (patientId: string) => void;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const PatientListView: React.FC<PatientListViewProps> = ({
  onPatientSelect,
  onPatientEdit,
  onPatientView,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [patients, setPatients] = useState<PatientSearchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPatients, setTotalPatients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<PatientFilter>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'registrationDate',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadPatients();
  }, [filters]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const result = await enhancedPatientService.searchPatients(filters);
      setPatients(result.data || []);
      setTotalPatients(result.total || 0);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageSize' ? 1 : prev.pageNumber
    }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({
      ...prev,
      pageNumber: page
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      pageSize: size,
      pageNumber: 1
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(patients.map(p => p.patientId));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatients(prev => [...prev, patientId]);
    } else {
      setSelectedPatients(prev => prev.filter(id => id !== patientId));
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      // Note: deletePatient method would need to be added to the service
      // For now, we'll just show a message
      alert('Delete functionality not yet implemented in the service layer');
      loadPatients();
      setSelectedPatients(prev => prev.filter(id => id !== patientToDelete));
    } catch (error) {
      console.error('Error deleting patient:', error);
    } finally {
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getGenderBadge = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Male</span>;
      case 'female':
        return <span className="px-2 py-1 text-xs font-semibold text-pink-800 bg-pink-100 rounded-full">Female</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Other</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Inactive</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Expired</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getPatientTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'opd':
        return <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">OPD</span>;
      case 'ipd':
        return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">IPD</span>;
      case 'emergency':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Emergency</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{type}</span>;
    }
  };

  const totalPages = Math.ceil(totalPatients / pageSize);

  return (
    <div className={`patient-list-view ${className}`}>
      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search by name, UHID, mobile..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            {/* UHID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UHID</label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter UHID"
                value={filters.uhid || ''}
                onChange={(e) => handleFilterChange('uhid', e.target.value)}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Patient Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Type</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.patientType || ''}
                onChange={(e) => handleFilterChange('patientType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter city"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            {/* Registration Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration From</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Registration Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration To</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => {
                setFilters({
                  pageNumber: 1,
                  pageSize: 20,
                  sortBy: 'registrationDate',
                  sortOrder: 'desc'
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={loadPatients}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPatients.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedPatients.length} patient(s) selected
          </span>
          <div className="flex space-x-3">
            <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
              Export Selected
            </button>
            <button
              className="px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Patient Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedPatients.length === patients.length && patients.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('uhid')}
                >
                  UHID {getSortIcon('uhid')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('firstName')}
                >
                  Patient Name {getSortIcon('firstName')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('age')}
                >
                  Age {getSortIcon('age')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('gender')}
                >
                  Gender {getSortIcon('gender')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('mobileNo')}
                >
                  Mobile {getSortIcon('mobileNo')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patientType')}
                >
                  Type {getSortIcon('patientType')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('registrationDate')}
                >
                  Registration Date {getSortIcon('registrationDate')}
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="px-4 py-8 text-center text-gray-500">
                    No patients found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.patientId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onPatientSelect && onPatientSelect(patient)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedPatients.includes(patient.patientId)}
                        onChange={(e) => handleSelectPatient(patient.patientId, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {patient.uhid}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {patient.photographUrl ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={patient.photographUrl}
                              alt={patient.displayName}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm">
                                {patient.gender?.toLowerCase() === 'female' ? '♀' : '♂'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.displayName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {patient.age ? `${patient.age} years` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getGenderBadge(patient.gender)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {patient.mobileNo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getPatientTypeBadge(patient.patientType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getStatusBadge(patient.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {patient.registrationDate
                        ? new Date(patient.registrationDate).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => onPatientView && onPatientView(patient.patientId)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => onPatientEdit && onPatientEdit(patient.patientId)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              setPatientToDelete(patient.patientId);
                              setShowDeleteModal(true);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalPatients)}
              </span>{' '}
              of <span className="font-medium">{totalPatients}</span> patients
            </div>
            <select
              className="form-select text-sm border-gray-300 rounded-md"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'text-white bg-blue-600'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              ⚠️ Confirm Deletion
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this patient? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPatientToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                onClick={handleDeletePatient}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientListView;