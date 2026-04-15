/**
 * Pharmacy Service
 * Comprehensive pharmacy management service inspired by web-softclinic-app
 * Includes medicine management, prescriptions, dispensing, and inventory
 */

import api from '@/lib/api';
import { apiConfig } from '@/config/apiConfig';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  unit?: string;
  category?: string;
  schedule?: string;
  requiresPrescription: boolean;
  isControlled: boolean;
  price: number;
  mrp: number;
  taxRate?: number;
  hsnCode?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface MedicineStock {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  expiryDate: string;
  manufactureDate?: string;
  supplierId?: string;
  supplierName?: string;
  location?: string;
  reorderLevel?: number;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  lastUpdated?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  encounterId?: string;
  prescriptionDate: string;
  status: 'Active' | 'Dispensed' | 'PartiallyDispensed' | 'Cancelled' | 'Expired';
  priority: 'Routine' | 'Urgent' | 'STAT';
  items: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
  validFrom?: string;
  validTo?: string;
  validDays?: number;
  totalAmount?: number;
  discount?: number;
  finalAmount?: number;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  dosageForm?: string;
  strength?: string;
  quantity: number;
  unit: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  durationUnit?: 'Days' | 'Weeks' | 'Months';
  route?: string;
  instructions?: string;
  refills?: number;
  status: 'Pending' | 'Dispensed' | 'PartiallyDispensed' | 'Cancelled';
  dispensedQuantity?: number;
  remainingQuantity?: number;
  price?: number;
  finalAmount?: number;
}

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  dispensedDate: string;
  dispensedBy: string;
  verifiedBy?: string;
  items: DispensedItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Refunded';
  paymentMode?: string;
  paymentReference?: string;
  notes?: string;
  createdAt?: string;
  tenantId?: string;
}

export interface DispensedItem {
  id: string;
  dispensingId: string;
  prescriptionItemId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantityDispensed: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  expiryDate: string;
  instructions?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  licenseNumber?: string;
  gstNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'Draft' | 'Approved' | 'Ordered' | 'PartiallyReceived' | 'Received' | 'Cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  totalAmount: number;
  receivedQuantity?: number;
  pendingQuantity?: number;
}

export interface PharmacyFilter {
  searchTerm?: string;
  medicineCode?: string;
  category?: string;
  manufacturer?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockFilter {
  medicineId?: string;
  medicineName?: string;
  batchNumber?: string;
  isLowStock?: boolean;
  isExpiringSoon?: boolean;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  location?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PrescriptionFilter {
  prescriptionNumber?: string;
  patientId?: string;
  patientUHID?: string;
  patientName?: string;
  doctorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Pharmacy Service ─────────────────────────────────────────────────────────

export const pharmacyService = {
  // ─── Medicine Management ────────────────────────────────────────────────────

  /**
   * Get medicines with filtering
   */
  getMedicines: async (filter: PharmacyFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines`, { params })
      .then(r => r.data);
  },

  /**
   * Get medicine by ID
   */
  getMedicineById: async (id: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines/${id}`)
      .then(r => r.data);
  },

  /**
   * Create new medicine
   */
  createMedicine: async (medicine: Partial<Medicine>) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines`, medicine)
      .then(r => r.data);
  },

  /**
   * Update medicine
   */
  updateMedicine: async (id: string, medicine: Partial<Medicine>) => {
    return api.put(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines/${id}`, medicine)
      .then(r => r.data);
  },

  /**
   * Delete medicine
   */
  deleteMedicine: async (id: string) => {
    return api.delete(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines/${id}`)
      .then(r => r.data);
  },

  /**
   * Search medicines
   */
  searchMedicines: async (term: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/medicines/search`, { params: { term } })
      .then(r => r.data?.data || []);
  },

  // ─── Stock Management ───────────────────────────────────────────────────────

  /**
   * Get medicine stock
   */
  getStock: async (filter: StockFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock`, { params })
      .then(r => r.data);
  },

  /**
   * Get stock by medicine ID
   */
  getStockByMedicineId: async (medicineId: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock/medicine/${medicineId}`)
      .then(r => r.data);
  },

  /**
   * Get low stock items
   */
  getLowStockItems: async () => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock/low-stock`)
      .then(r => r.data);
  },

  /**
   * Get expiring items
   */
  getExpiringItems: async (daysAhead: number = 30) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock/expiring`, { params: { daysAhead } })
      .then(r => r.data);
  },

  /**
   * Get expired items
   */
  getExpiredItems: async () => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock/expired`)
      .then(r => r.data);
  },

  /**
   * Update stock
   */
  updateStock: async (medicineId: string, batchNumber: string, quantity: number, adjustmentType: 'Add' | 'Remove' | 'Adjust', reason?: string) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/stock/adjust`, {
      medicineId,
      batchNumber,
      quantity,
      adjustmentType,
      reason
    })
      .then(r => r.data);
  },

  // ─── Prescription Management ────────────────────────────────────────────────

  /**
   * Get prescriptions
   */
  getPrescriptions: async (filter: PrescriptionFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions`, { params })
      .then(r => r.data);
  },

  /**
   * Get prescription by ID
   */
  getPrescriptionById: async (id: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions/${id}`)
      .then(r => r.data);
  },

  /**
   * Get prescriptions by patient ID
   */
  getPrescriptionsByPatientId: async (patientId: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions/patient/${patientId}`)
      .then(r => r.data);
  },

  /**
   * Get active prescriptions for patient
   */
  getActivePrescriptions: async (patientId: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions/patient/${patientId}/active`)
      .then(r => r.data);
  },

  /**
   * Create prescription (from EMR)
   */
  createPrescription: async (prescription: Partial<Prescription>) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions`, prescription)
      .then(r => r.data);
  },

  /**
   * Update prescription status
   */
  updatePrescriptionStatus: async (id: string, status: string) => {
    return api.patch(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions/${id}/status`, { status })
      .then(r => r.data);
  },

  /**
   * Cancel prescription
   */
  cancelPrescription: async (id: string, reason: string) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/prescriptions/${id}/cancel`, { reason })
      .then(r => r.data);
  },

  // ─── Dispensing ─────────────────────────────────────────────────────────────

  /**
   * Dispense prescription
   */
  dispensePrescription: async (prescriptionId: string, items: { prescriptionItemId: string; quantity: number; batchNumber: string }[]) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dispensing`, {
      prescriptionId,
      items
    })
      .then(r => r.data);
  },

  /**
   * Get dispensing records
   */
  getDispensingRecords: async (filter: PrescriptionFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dispensing`, { params })
      .then(r => r.data);
  },

  /**
   * Get dispensing record by ID
   */
  getDispensingRecordById: async (id: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dispensing/${id}`)
      .then(r => r.data);
  },

  /**
   * Get dispensing records by patient ID
   */
  getDispensingByPatientId: async (patientId: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dispensing/patient/${patientId}`)
      .then(r => r.data);
  },

  /**
   * Process payment for dispensing
   */
  processPayment: async (dispensingId: string, paymentData: { paymentMode: string; paymentReference?: string; amount: number }) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dispensing/${dispensingId}/payment`, paymentData)
      .then(r => r.data);
  },

  // ─── Suppliers ──────────────────────────────────────────────────────────────

  /**
   * Get suppliers
   */
  getSuppliers: async (isActive?: boolean) => {
    const params = isActive !== undefined ? { isActive } : {};
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/suppliers`, { params })
      .then(r => r.data);
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (id: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/suppliers/${id}`)
      .then(r => r.data);
  },

  /**
   * Create supplier
   */
  createSupplier: async (supplier: Partial<Supplier>) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/suppliers`, supplier)
      .then(r => r.data);
  },

  /**
   * Update supplier
   */
  updateSupplier: async (id: string, supplier: Partial<Supplier>) => {
    return api.put(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/suppliers/${id}`, supplier)
      .then(r => r.data);
  },

  /**
   * Delete supplier
   */
  deleteSupplier: async (id: string) => {
    return api.delete(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/suppliers/${id}`)
      .then(r => r.data);
  },

  // ─── Purchase Orders ────────────────────────────────────────────────────────

  /**
   * Get purchase orders
   */
  getPurchaseOrders: async (filter: any) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders`, { params })
      .then(r => r.data);
  },

  /**
   * Get purchase order by ID
   */
  getPurchaseOrderById: async (id: string) => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders/${id}`)
      .then(r => r.data);
  },

  /**
   * Create purchase order
   */
  createPurchaseOrder: async (order: Partial<PurchaseOrder>) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders`, order)
      .then(r => r.data);
  },

  /**
   * Update purchase order
   */
  updatePurchaseOrder: async (id: string, order: Partial<PurchaseOrder>) => {
    return api.put(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders/${id}`, order)
      .then(r => r.data);
  },

  /**
   * Approve purchase order
   */
  approvePurchaseOrder: async (id: string, approvedBy: string) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders/${id}/approve`, { approvedBy })
      .then(r => r.data);
  },

  /**
   * Receive purchase order
   */
  receivePurchaseOrder: async (id: string, receivedItems: { itemId: string; receivedQuantity: number; batchNumber: string; expiryDate: string }[]) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders/${id}/receive`, { receivedItems })
      .then(r => r.data);
  },

  /**
   * Cancel purchase order
   */
  cancelPurchaseOrder: async (id: string, reason: string) => {
    return api.post(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/purchase-orders/${id}/cancel`, { reason })
      .then(r => r.data);
  },

  // ─── Pharmacy Statistics & Dashboard ────────────────────────────────────────

  /**
   * Get pharmacy statistics
   */
  getPharmacyStats: async () => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/statistics`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get pharmacy dashboard summary
   */
  getDashboardSummary: async () => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/dashboard`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get sales statistics
   */
  getSalesStats: async (dateFrom: string, dateTo: string, groupBy?: 'day' | 'week' | 'month') => {
    const params: any = { dateFrom, dateTo };
    if (groupBy) params.groupBy = groupBy;

    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/statistics/sales`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get inventory value
   */
  getInventoryValue: async () => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/statistics/inventory-value`)
      .then(r => r.data?.data || {});
  },

  // ─── Reports ────────────────────────────────────────────────────────────────

  /**
   * Generate dispensing report
   */
  generateDispensingReport: async (dateFrom: string, dateTo: string, format: 'PDF' | 'Excel' = 'PDF') => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/reports/dispensing`, {
      params: { dateFrom, dateTo, format },
      responseType: 'blob'
    })
      .then(r => r.data);
  },

  /**
   * Generate stock report
   */
  generateStockReport: async (format: 'PDF' | 'Excel' = 'PDF') => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/reports/stock`, {
      params: { format },
      responseType: 'blob'
    })
      .then(r => r.data);
  },

  /**
   * Generate expiry report
   */
  generateExpiryReport: async (daysAhead: number = 30, format: 'PDF' | 'Excel' = 'PDF') => {
    return api.get(`${apiConfig.pharmacyService.baseUrl}/api/pharmacy/reports/expiry`, {
      params: { daysAhead, format },
      responseType: 'blob'
    })
      .then(r => r.data);
  }
};

export default pharmacyService;