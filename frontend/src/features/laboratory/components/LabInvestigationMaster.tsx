/**
 * LabInvestigationMaster Component
 * Comprehensive laboratory investigation master management
 * Inspired by web-softclinic-app's lab investigation management
 */

import React, { useState, useEffect } from 'react';
import { enhancedLabService, InvestigationModel, LabFilter } from '../services/enhancedLabService';

interface LabInvestigationMasterProps {
  onInvestigationSelect?: (investigation: InvestigationModel) => void;
  onInvestigationEdit?: (investigationId: string) => void;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const LabInvestigationMaster: React.FC<LabInvestigationMasterProps> = ({
  onInvestigationSelect,
  onInvestigationEdit,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [investigations, setInvestigations] = useState<InvestigationModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInvestigations, setTotalInvestigations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [investigationToDelete, setInvestigationToDelete] = useState<string | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingInvestigation, setEditingInvestigation] = useState<InvestigationModel | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<any[]>([]);
  const [uomTypes, setUomTypes] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState<LabFilter>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<InvestigationModel>>({
    name: '',
    code: '',
    displayName: '',
    shortName: '',
    description: '',
    sectionTypeId: '',
    serviceTypeId: '',
    investigationType: '',
    status: 'Active',
    isActive: true,
    isTenantWise: false
  });

  useEffect(() => {
    loadInvestigations();
    loadMasterData();
  }, [filters]);

  const loadInvestigations = async () => {
    setLoading(true);
    try {
      const result = await enhancedLabService.getInvestigations(filters);
      setInvestigations(result.data || []);
      setTotalInvestigations(result.total || 0);
    } catch (error) {
      console.error('Error loading investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      // Using available methods from enhancedLabService
      const [specimens] = await Promise.all([
        enhancedLabService.getSpecimens()
      ]);

      setSpecimenTypes(specimens);
      // For now, we'll use empty arrays for departments, uomTypes, methods
      // These can be added later when the service methods are available
      setDepartments([]);
      setUomTypes([]);
      setMethods([]);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: LabFilter) => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageSize' ? 1 : prev.pageNumber
    }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    setFilters((prev: LabFilter) => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev: LabFilter) => ({
      ...prev,
      pageNumber: page
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setFilters((prev: LabFilter) => ({
      ...prev,
      pageSize: size,
      pageNumber: 1
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvestigations(investigations.map(i => i.id));
    } else {
      setSelectedInvestigations([]);
    }
  };

  const handleSelectInvestigation = (investigationId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvestigations(prev => [...prev, investigationId]);
    } else {
      setSelectedInvestigations(prev => prev.filter(id => id !== investigationId));
    }
  };

  const handleDeleteInvestigation = async () => {
    if (!investigationToDelete) return;

    try {
      await enhancedLabService.deleteInvestigation(investigationToDelete);
      loadInvestigations();
      setSelectedInvestigations(prev => prev.filter(id => id !== investigationToDelete));
    } catch (error) {
      console.error('Error deleting investigation:', error);
    } finally {
      setShowDeleteModal(false);
      setInvestigationToDelete(null);
    }
  };

  const handleEditInvestigation = (investigation: InvestigationModel) => {
    setEditingInvestigation(investigation);
    setFormData(investigation);
    setShowAddEditModal(true);
  };

  const handleAddNewInvestigation = () => {
    setEditingInvestigation(null);
    setFormData({
      name: '',
      code: '',
      displayName: '',
      shortName: '',
      description: '',
      sectionTypeId: '',
      serviceTypeId: '',
      investigationType: '',
      status: 'Active',
      isActive: true,
      isTenantWise: false
    });
    setShowAddEditModal(true);
  };

  const handleSaveInvestigation = async () => {
    try {
      if (editingInvestigation && editingInvestigation.id) {
        await enhancedLabService.updateInvestigation(editingInvestigation.id, formData);
      } else {
        await enhancedLabService.createInvestigation(formData);
      }
      loadInvestigations();
      setShowAddEditModal(false);
    } catch (error) {
      console.error('Error saving investigation:', error);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Inactive</span>
    );
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : '-';
  };

  const getSpecimenTypeName = (specimenTypeId: string) => {
    const specimen = specimenTypes.find(s => s.id === specimenTypeId);
    return specimen ? specimen.name : '-';
  };

  const totalPages = Math.ceil(totalInvestigations / pageSize);

  return (
    <div className={`lab-investigation-master ${className}`}>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Laboratory Investigation Master</h2>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={handleAddNewInvestigation}
        >
          <span className="mr-2">+</span> Add New Investigation
        </button>
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
                placeholder="Search by name or code..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            {/* Section/Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section/Department</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.sectionTypeId || ''}
                onChange={(e) => handleFilterChange('sectionTypeId', e.target.value)}
              >
                <option value="">All Sections</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Specimen Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Type</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              >
                <option value="">All Specimen Types</option>
                {specimenTypes.map(specimen => (
                  <option key={specimen.id} value={specimen.id}>{specimen.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.isActive !== undefined ? (filters.isActive ? 'active' : 'inactive') : ''}
                onChange={(e) => handleFilterChange('isActive', e.target.value === 'active' ? true : e.target.value === 'inactive' ? false : undefined)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                  sortBy: 'name',
                  sortOrder: 'asc'
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={loadInvestigations}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedInvestigations.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedInvestigations.length} investigation(s) selected
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

      {/* Investigations Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedInvestigations.length === investigations.length && investigations.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('code')}
                >
                  Code {getSortIcon('code')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Investigation Name {getSortIcon('name')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Specimen
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Normal Range
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rate (₹)
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  TAT (Hours)
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Flags
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
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="px-4 py-8 text-center text-gray-500">
                    No investigations found. Try adjusting your filters or add a new investigation.
                  </td>
                </tr>
              ) : (
                investigations.map((investigation) => (
                  <tr
                    key={investigation.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onInvestigationSelect && onInvestigationSelect(investigation)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedInvestigations.includes(investigation.id)}
                        onChange={(e) => handleSelectInvestigation(investigation.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {investigation.code}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {investigation.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {investigation.sectionTypeName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {investigation.serviceTypeName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {investigation.investigationType || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getStatusBadge(investigation.isActive)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {investigation.isTenantWise && (
                        <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                          Tenant-wide
                        </span>
                      )}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEditInvestigation(investigation)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              setInvestigationToDelete(investigation.id);
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
                {Math.min(currentPage * pageSize, totalInvestigations)}
              </span>{' '}
              of <span className="font-medium">{totalInvestigations}</span> investigations
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
              Are you sure you want to delete this investigation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setInvestigationToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                onClick={handleDeleteInvestigation}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Investigation Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingInvestigation ? 'Edit Investigation' : 'Add New Investigation'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* Basic Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investigation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter investigation name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter investigation code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section/Department</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.sectionTypeId || ''}
                  onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, sectionTypeId: e.target.value }))}
                >
                  <option value="">Select Section</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.serviceTypeId || ''}
                  onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, serviceTypeId: e.target.value }))}
                >
                  <option value="">Select Service Type</option>
                  {specimenTypes.map(specimen => (
                    <option key={specimen.id} value={specimen.id}>{specimen.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="form-textarea w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter investigation description"
                />
              </div>

              {/* Additional Settings */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Additional Settings</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.investigationType || ''}
                  onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, investigationType: e.target.value }))}
                >
                  <option value="">Select Type</option>
                  <option value="Lab">Lab</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Options</h4>
              </div>

              <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.isTenantWise || false}
                    onChange={(e) => setFormData((prev: Partial<InvestigationModel>) => ({ ...prev, isTenantWise: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Tenant-wide</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowAddEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleSaveInvestigation}
              >
                {editingInvestigation ? 'Update Investigation' : 'Save Investigation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabInvestigationMaster;