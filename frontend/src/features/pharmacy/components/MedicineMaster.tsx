/**
 * MedicineMaster Component
 * Comprehensive pharmacy medicine master management
 * Inspired by web-softclinic-app's pharmacy management features
 */

import React, { useState, useEffect } from 'react';
import { pharmacyService, Medicine, MedicineFilter, MedicineCategory, MedicineType, UnitOfMeasurement } from '../services/pharmacyService';

interface MedicineMasterProps {
  onMedicineSelect?: (medicine: Medicine) => void;
  onMedicineEdit?: (medicineId: string) => void;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const MedicineMaster: React.FC<MedicineMasterProps> = ({
  onMedicineSelect,
  onMedicineEdit,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [types, setTypes] = useState<MedicineType[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasurement[]>([]);

  // Filter states
  const [filters, setFilters] = useState<MedicineFilter>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '',
    code: '',
    categoryId: '',
    typeId: '',
    uomId: '',
    purchaseRate: 0,
    saleRate: 0,
    mrpRate: 0,
    stock: 0,
    reorderLevel: 0,
    gstPercent: 0,
    isActive: true,
    isTaxable: true,
    requiresPrescription: false,
    hasExpiry: true
  });

  useEffect(() => {
    loadMedicines();
    loadMasterData();
  }, [filters]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const result = await pharmacyService.getMedicines(filters);
      setMedicines(result.data || []);
      setTotalMedicines(result.total || 0);
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [categoriesData, typesData, uomsData] = await Promise.all([
        pharmacyService.getMedicineCategories(),
        pharmacyService.getMedicineTypes(),
        pharmacyService.getUoms()
      ]);

      setCategories(categoriesData);
      setTypes(typesData);
      setUoms(uomsData);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: MedicineFilter) => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageSize' ? 1 : prev.pageNumber
    }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    setFilters((prev: MedicineFilter) => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev: MedicineFilter) => ({
      ...prev,
      pageNumber: page
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setFilters((prev: MedicineFilter) => ({
      ...prev,
      pageSize: size,
      pageNumber: 1
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMedicines(medicines.map(m => m.id));
    } else {
      setSelectedMedicines([]);
    }
  };

  const handleSelectMedicine = (medicineId: string, checked: boolean) => {
    if (checked) {
      setSelectedMedicines(prev => [...prev, medicineId]);
    } else {
      setSelectedMedicines(prev => prev.filter(id => id !== medicineId));
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;

    try {
      await pharmacyService.deleteMedicine(medicineToDelete);
      loadMedicines();
      setSelectedMedicines(prev => prev.filter(id => id !== medicineToDelete));
    } catch (error) {
      console.error('Error deleting medicine:', error);
    } finally {
      setShowDeleteModal(false);
      setMedicineToDelete(null);
    }
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData(medicine);
    setShowAddEditModal(true);
  };

  const handleAddNewMedicine = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      code: '',
      categoryId: '',
      typeId: '',
      uomId: '',
      purchaseRate: 0,
      saleRate: 0,
      mrpRate: 0,
      stock: 0,
      reorderLevel: 0,
      gstPercent: 0,
      isActive: true,
      isTaxable: true,
      requiresPrescription: false,
      hasExpiry: true
    });
    setShowAddEditModal(true);
  };

  const handleSaveMedicine = async () => {
    try {
      if (editingMedicine && editingMedicine.id) {
        await pharmacyService.updateMedicine(editingMedicine.id, formData);
      } else {
        await pharmacyService.createMedicine(formData);
      }
      loadMedicines();
      setShowAddEditModal(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const getTypeName = (typeId: string) => {
    const type = types.find(t => t.id === typeId);
    return type ? type.name : '-';
  };

  const getUomName = (uomId: string) => {
    const uom = uoms.find(u => u.id === uomId);
    return uom ? uom.name : '-';
  };

  const totalPages = Math.ceil(totalMedicines / pageSize);

  return (
    <div className={`medicine-master ${className}`}>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medicine Master</h2>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={handleAddNewMedicine}
        >
          <span className="mr-2">+</span> Add New Medicine
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.typeId || ''}
                onChange={(e) => handleFilterChange('typeId', e.target.value)}
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
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

            {/* Prescription Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.requiresPrescription !== undefined ? (filters.requiresPrescription ? 'required' : 'not_required') : ''}
                onChange={(e) => handleFilterChange('requiresPrescription', e.target.value === 'required' ? true : e.target.value === 'not_required' ? false : undefined)}
              >
                <option value="">All</option>
                <option value="required">Prescription Required</option>
                <option value="not_required">No Prescription</option>
              </select>
            </div>

            {/* Low Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.lowStock !== undefined ? (filters.lowStock ? 'low' : 'normal') : ''}
                onChange={(e) => handleFilterChange('lowStock', e.target.value === 'low' ? true : e.target.value === 'normal' ? false : undefined)}
              >
                <option value="">All</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal Stock</option>
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
              onClick={loadMedicines}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedMedicines.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedMedicines.length} medicine(s) selected
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

      {/* Medicines Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedMedicines.length === medicines.length && medicines.length > 0}
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
                  Medicine Name {getSortIcon('name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('saleRate')}
                >
                  Sale Rate {getSortIcon('saleRate')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock')}
                >
                  Stock {getSortIcon('stock')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 11 : 10} className="px-4 py-8 text-center text-gray-500">
                    No medicines found. Try adjusting your filters or add a new medicine.
                  </td>
                </tr>
              ) : (
                medicines.map((medicine) => (
                  <tr
                    key={medicine.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onMedicineSelect && onMedicineSelect(medicine)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedMedicines.includes(medicine.id)}
                        onChange={(e) => handleSelectMedicine(medicine.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {medicine.code}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {medicine.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getCategoryName(medicine.categoryId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getTypeName(medicine.typeId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      ₹{medicine.saleRate?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>{medicine.stock || 0}</span>
                        {medicine.stock !== undefined && medicine.reorderLevel !== undefined && medicine.stock <= medicine.reorderLevel && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getUomName(medicine.uomId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getStatusBadge(medicine.isActive)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex space-x-1">
                        {medicine.requiresPrescription && (
                          <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                            Rx
                          </span>
                        )}
                        {medicine.hasExpiry && (
                          <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                            Exp
                          </span>
                        )}
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEditMedicine(medicine)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => {
                              setMedicineToDelete(medicine.id);
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
                {Math.min(currentPage * pageSize, totalMedicines)}
              </span>{' '}
              of <span className="font-medium">{totalMedicines}</span> medicines
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
              Are you sure you want to delete this medicine? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowDeleteModal(false);
                  setMedicineToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                onClick={handleDeleteMedicine}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Medicine Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* Basic Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter medicine name"
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
                  placeholder="Enter medicine code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.typeId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeId: e.target.value }))}
                >
                  <option value="">Select Type</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.uomId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, uomId: e.target.value }))}
                >
                  <option value="">Select UOM</option>
                  {uoms.map(uom => (
                    <option key={uom.id} value={uom.id}>{uom.name}</option>
                  ))}
                </select>
              </div>

              {/* Pricing */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Pricing</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.purchaseRate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseRate: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.saleRate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, saleRate: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.mrpRate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, mrpRate: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.gstPercent || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstPercent: parseFloat(e.target.value) }))}
                />
              </div>

              {/* Stock Management */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Stock Management</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                <input
                  type="number"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.reorderLevel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) }))}
                />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.isTaxable || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isTaxable: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Taxable</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.requiresPrescription || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresPrescription: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Prescription Required</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.hasExpiry || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasExpiry: e.target.checked }))}
                  />
                  <span className="ml-2 text-sm text-gray-700">Has Expiry</span>
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
                onClick={handleSaveMedicine}
              >
                {editingMedicine ? 'Update Medicine' : 'Save Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineMaster;