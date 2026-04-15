/**
 * PatientAdvancedSearch Component
 * Advanced patient search with multiple filters
 * Inspired by web-softclinic-app's patientinfo-search component
 */

import React, { useState, useEffect } from 'react';
import { enhancedPatientService, PatientFilter, PatientSearchModel } from '../services/enhancedPatientService';

interface PatientAdvancedSearchProps {
  onPatientSelect?: (patient: PatientSearchModel) => void;
  showFilters?: boolean;
  maxResults?: number;
  className?: string;
}

const PatientAdvancedSearch: React.FC<PatientAdvancedSearchProps> = ({
  onPatientSelect,
  showFilters = true,
  maxResults = 20,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientSearchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchModel | null>(null);

  // Filter states
  const [filters, setFilters] = useState<PatientFilter>({
    pageNumber: 1,
    pageSize: maxResults,
    sortBy: 'registrationDate',
    sortOrder: 'desc'
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const result = await enhancedPatientService.searchPatients({
        ...filters,
        searchTerm: searchTerm.trim()
      });

      setPatients(result.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: PatientSearchModel) => {
    setSelectedPatient(patient);
    setShowDropdown(false);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getPatientDisplayName = (patient: PatientSearchModel) => {
    return patient.displayName || `${patient.firstName} ${patient.lastName}`.trim();
  };

  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '♂️';
      case 'female':
        return '♀️';
      default:
        return '👤';
    }
  };

  return (
    <div className={`patient-advanced-search ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center">
          <input
            type="text"
            className="form-input flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by UHID, Name, Mobile, CR Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && patients.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {patients.map((patient) => (
              <div
                key={patient.patientId}
                className="flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handlePatientSelect(patient)}
              >
                {/* Patient Photo */}
                <div className="flex-shrink-0 mr-3">
                  {patient.photographUrl ? (
                    <img
                      src={patient.photographUrl}
                      alt={patient.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                      {getGenderIcon(patient.gender)}
                    </div>
                  )}
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {getPatientDisplayName(patient)}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {patient.uhid}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span className="mr-3">
                      {patient.age ? `${patient.age} years` : ''}
                    </span>
                    <span className="mr-3">{patient.gender}</span>
                    <span className="mr-3">{patient.mobileNo}</span>
                    {patient.city && <span>{patient.city}</span>}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0 ml-2">
                  {patient.status === 'Active' && (
                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                      Active
                    </span>
                  )}
                  {patient.status === 'Inactive' && (
                    <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showDropdown && searchTerm && !loading && patients.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
            <p className="text-gray-500">No patients found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* UHID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UHID
              </label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter UHID"
                value={filters.uhid || ''}
                onChange={(e) => handleFilterChange('uhid', e.target.value)}
              />
            </div>

            {/* Mobile Number Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter mobile number"
                value={filters.mobileNumber || ''}
                onChange={(e) => handleFilterChange('mobileNumber', e.target.value)}
              />
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
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

            {/* Patient Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Type
              </label>
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

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter city"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
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

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
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
                  pageSize: maxResults,
                  sortBy: 'registrationDate',
                  sortOrder: 'desc'
                });
                setSearchTerm('');
                setPatients([]);
              }}
            >
              Clear Filters
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleSearch}
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Selected Patient Display */}
      {selectedPatient && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {selectedPatient.photographUrl ? (
                  <img
                    src={selectedPatient.photographUrl}
                    alt={selectedPatient.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    {getGenderIcon(selectedPatient.gender)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {getPatientDisplayName(selectedPatient)}
                </h4>
                <p className="text-sm text-gray-600">
                  UHID: {selectedPatient.uhid} | Age: {selectedPatient.age} | {selectedPatient.gender}
                </p>
                <p className="text-sm text-gray-600">
                  Mobile: {selectedPatient.mobileNo}
                </p>
              </div>
            </div>
            <button
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              onClick={() => onPatientSelect && onPatientSelect(selectedPatient)}
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAdvancedSearch;