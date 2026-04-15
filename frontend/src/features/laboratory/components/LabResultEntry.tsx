/**
 * LabResultEntry Component
 * Comprehensive laboratory result entry and management
 * Inspired by web-softclinic-app's lab result entry features
 */

import React, { useState, useEffect } from 'react';
import { enhancedLabService, InvestigationModel, LabRequisition, InvestigationParameter, ResultEntryConfiguration } from '../services/enhancedLabService';

interface LabResultEntryProps {
  onResultSave?: (requisition: LabRequisition) => void;
  onResultUpdate?: (requisition: LabRequisition) => void;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const LabResultEntry: React.FC<LabResultEntryProps> = ({
  onResultSave,
  onResultUpdate,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [requisitions, setRequisitions] = useState<LabRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<LabRequisition | null>(null);
  const [resultFormData, setResultFormData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('requisitionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<any>({
    status: 'SampleCollected',
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'requisitionDate',
    sortOrder: 'desc'
  });

  // Form state for result entry
  const [showResultModal, setShowResultModal] = useState(false);
  const [investigations, setInvestigations] = useState<InvestigationModel[]>([]);
  const [parameters, setParameters] = useState<InvestigationParameter[]>([]);
  const [configurations, setConfigurations] = useState<ResultEntryConfiguration[]>([]);

  useEffect(() => {
    loadRequisitions();
    loadInvestigations();
  }, [filters]);

  const loadRequisitions = async () => {
    setLoading(true);
    try {
      const result = await enhancedLabService.getRequisitions(filters);
      setRequisitions(result.data || []);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvestigations = async () => {
    try {
      const result = await enhancedLabService.getInvestigations({
        pageNumber: 1,
        pageSize: 1000,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setInvestigations(result.data || []);
    } catch (error) {
      console.error('Error loading investigations:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: RequisitionFilter) => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageSize' ? 1 : prev.pageNumber
    }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    setFilters((prev: RequisitionFilter) => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev: RequisitionFilter) => ({
      ...prev,
      pageNumber: page
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setFilters((prev: RequisitionFilter) => ({
      ...prev,
      pageSize: size,
      pageNumber: 1
    }));
  };

  const handleSelectRequisition = (requisition: LabRequisition) => {
    setSelectedRequisition(requisition);
    // Load investigation details for result entry
    loadInvestigationDetails(requisition.items);
  };

  const loadInvestigationDetails = async (items: any[]) => {
    try {
      // Load parameters and configurations for each investigation
      const investigationIds = items.map(item => item.investigationId);
      const details = await Promise.all(
        investigationIds.map(id => enhancedLabService.getInvestigationById(id))
      );
      
      // Flatten parameters and configurations
      const allParameters = details.flatMap(d => d.parameters || []);
      const allConfigurations = details.flatMap(d => d.resultEntryConfiguration || []);
      
      setParameters(allParameters);
      setConfigurations(allConfigurations);
      
      // Initialize form data
      const formData: any = {};
      allParameters.forEach(param => {
        formData[param.id] = '';
      });
      setResultFormData(formData);
    } catch (error) {
      console.error('Error loading investigation details:', error);
    }
  };

  const handleResultInputChange = (parameterId: string, value: any) => {
    setResultFormData((prev: Record<string, any>) => ({
      ...prev,
      [parameterId]: value
    }));
  };

  const handleSaveResults = async () => {
    if (!selectedRequisition) return;

    try {
      const resultData = {
        requisitionId: selectedRequisition.id,
        results: Object.entries(resultFormData).map(([parameterId, value]) => ({
          parameterId,
          value,
          enteredAt: new Date().toISOString(),
          enteredBy: 'CurrentUser' // This would come from auth context
        }))
      };

      // Get the first item ID from the requisition
      const itemId = selectedRequisition.items[0]?.id || '';
      const results: LabResultEntry[] = Object.entries(resultFormData).map(([parameterId, value]) => ({
        id: '',
        itemId,
        parameterId,
        parameterName: parameters.find(p => p.id === parameterId)?.parameterName || '',
        value: value as string,
        unit: parameters.find(p => p.id === parameterId)?.unit || '',
        isAbnormal: false,
        isCritical: false,
        isVerified: false
      }));

      await enhancedLabService.saveResults(selectedRequisition.id, itemId, results);
      loadRequisitions();
      setShowResultModal(false);
      onResultSave && onResultSave(selectedRequisition);
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const handleUpdateResults = async () => {
    if (!selectedRequisition) return;

    try {
      const resultData = {
        requisitionId: selectedRequisition.id,
        results: Object.entries(resultFormData).map(([parameterId, value]) => ({
          parameterId,
          value,
          updatedAt: new Date().toISOString(),
          updatedBy: 'CurrentUser' // This would come from auth context
        }))
      };

      // Get the first item ID from the requisition
      const itemId = selectedRequisition.items[0]?.id || '';
      const results: LabResultEntry[] = Object.entries(resultFormData).map(([parameterId, value]) => ({
        id: '',
        itemId,
        parameterId,
        parameterName: parameters.find(p => p.id === parameterId)?.parameterName || '',
        value: value as string,
        unit: parameters.find(p => p.id === parameterId)?.unit || '',
        isAbnormal: false,
        isCritical: false,
        isVerified: false
      }));

      await enhancedLabService.updateResults(selectedRequisition.id, itemId, results);
      loadRequisitions();
      setShowResultModal(false);
      onResultUpdate && onResultUpdate(selectedRequisition);
    } catch (error) {
      console.error('Error updating results:', error);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
      case 'samplecollected':
        return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Sample Collected</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">Processing</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Cancelled</span>;
      case 'onhold':
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">On Hold</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'routine':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Routine</span>;
      case 'urgent':
        return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">Urgent</span>;
      case 'stat':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">STAT</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{priority}</span>;
    }
  };

  const canEnterResults = (requisition: LabRequisition) => {
    return requisition.status === 'SampleCollected' || requisition.status === 'Processing';
  };

  const totalPages = Math.ceil((requisitions.length || 0) / pageSize);

  return (
    <div className={`lab-result-entry ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Lab Result Entry</h2>
        <div className="flex space-x-3">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            onClick={() => setShowResultModal(true)}
            disabled={!selectedRequisition}
          >
            Enter Results
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setShowResultModal(true)}
            disabled={!selectedRequisition}
          >
            View Results
          </button>
        </div>
      </div>

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
                placeholder="Search by requisition number, patient name..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
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
                <option value="Pending">Pending</option>
                <option value="SampleCollected">Sample Collected</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="OnHold">On Hold</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
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
                  status: 'SampleCollected',
                  pageNumber: 1,
                  pageSize: 20,
                  sortBy: 'requisitionDate',
                  sortOrder: 'desc'
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={loadRequisitions}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Requisitions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('requisitionNumber')}
                >
                  Requisition No. {getSortIcon('requisitionNumber')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patientName')}
                >
                  Patient Name {getSortIcon('patientName')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('requisitionDate')}
                >
                  Date {getSortIcon('requisitionDate')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Investigations
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Referring Doctor
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
                  <td colSpan={showActions ? 8 : 7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    No requisitions found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                requisitions.map((requisition) => (
                  <tr
                    key={requisition.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedRequisition?.id === requisition.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectRequisition(requisition)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {requisition.requisitionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm">{requisition.patientName.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {requisition.patientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            UHID: {requisition.patientUHID}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(requisition.requisitionDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getPriorityBadge(requisition.priority)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getStatusBadge(requisition.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {requisition.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {requisition.referringDoctorName}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <button
                            className={`px-3 py-1 text-sm font-medium rounded-md ${
                              canEnterResults(requisition)
                                ? 'text-green-600 bg-green-100 hover:bg-green-200'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (canEnterResults(requisition)) {
                                setSelectedRequisition(requisition);
                                setShowResultModal(true);
                              }
                            }}
                            disabled={!canEnterResults(requisition)}
                          >
                            Enter Results
                          </button>
                          <button
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                            onClick={() => {
                              setSelectedRequisition(requisition);
                              setShowResultModal(true);
                            }}
                          >
                            View Results
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
                {Math.min(currentPage * pageSize, requisitions.length || 0)}
              </span>{' '}
              of <span className="font-medium">{requisitions.length || 0}</span> requisitions
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

      {/* Result Entry Modal */}
      {showResultModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Result Entry - {selectedRequisition.requisitionNumber}
              </h3>
              <div className="flex space-x-2">
                {getStatusBadge(selectedRequisition.status)}
                {getPriorityBadge(selectedRequisition.priority)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Patient Information */}
              <div className="md:col-span-1">
                <h4 className="font-medium text-gray-700 mb-3">Patient Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">{selectedRequisition.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">UHID:</span>
                      <span className="text-sm font-medium">{selectedRequisition.patientUHID}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Age:</span>
                      <span className="text-sm font-medium">{selectedRequisition.patientAge || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gender:</span>
                      <span className="text-sm font-medium">{selectedRequisition.patientGender || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Requisition Date:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedRequisition.requisitionDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Referring Doctor:</span>
                      <span className="text-sm font-medium">{selectedRequisition.referringDoctorName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investigation Details */}
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Investigation Details</h4>
                <div className="space-y-4">
                  {selectedRequisition.items?.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">{item.investigationName}</h5>
                        <span className="text-sm text-gray-600">Code: {item.investigationCode}</span>
                      </div>
                      
                      {/* Parameters for this investigation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parameters
                          .filter(param => param.investigationId === item.investigationId)
                          .map(param => (
                            <div key={param.id} className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                {param.parameterName}
                                {param.unit && <span className="text-xs text-gray-500"> ({param.unit})</span>}
                              </label>
                              <input
                                type={param.resultType === 'Numeric' ? 'number' : 'text'}
                                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={resultFormData[param.id] || ''}
                                onChange={(e) => handleResultInputChange(param.id, e.target.value)}
                                placeholder={`Enter ${param.parameterName}`}
                              />
                              {param.referenceMin !== undefined && param.referenceMax !== undefined && (
                                <p className="text-xs text-gray-600">
                                  Reference: {param.referenceMin} - {param.referenceMax}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowResultModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                onClick={handleSaveResults}
              >
                Save Results
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleUpdateResults}
              >
                Update Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabResultEntry;