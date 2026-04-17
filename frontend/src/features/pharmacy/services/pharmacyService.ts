import api from '@/lib/api';

const BASE = import.meta.env.VITE_PHARMACY_SERVICE_URL ?? 'http://localhost:5006';
const PH = `${BASE}/api/pharmacy`;

// ─── Types (matching backend DTOs exactly) ────────────────────────────────────

export interface Drug {
  id: string;
  drugCode: string;
  drugName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  strength: string;
  dosageForm: string;
  unitPrice: number;
  reorderLevel: number;
  availableStock: number;
  isControlled: boolean;
  requiresPrescription: boolean;
  isActive: boolean;
}

export interface CreateDrugRequest {
  drugCode: string;
  drugName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  strength: string;
  dosageForm: string;
  unitPrice: number;
  reorderLevel: number;
  isControlled: boolean;
  requiresPrescription: boolean;
}

export interface UpdateDrugRequest extends CreateDrugRequest {
  isActive: boolean;
}

export interface DrugBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  isExpired: boolean;
}

export interface CreateBatchRequest {
  drugId: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
}

export interface PrescriptionItem {
  id: string;
  drugId: string;
  drugName: string;
  strength: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: number;
  instructions?: string;
  unitPrice: number;
  amount: number;
  isDispensed: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  encounterId?: string;
  doctorId: string;
  prescriptionDate: string;
  status: 'Pending' | 'Verified' | 'Dispensed' | 'Cancelled';
  verifiedAt?: string;
  verifiedBy?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionRequest {
  patientId: string;
  encounterId?: string;
  doctorId: string;
  notes?: string;
  items: {
    drugId: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: number;
    instructions?: string;
  }[];
}

export interface LowStockItem {
  drugId: string;
  drugCode: string;
  drugName: string;
  availableStock: number;
  reorderLevel: number;
  status: string;
}

export interface DailySalesReport {
  date: string;
  totalPrescriptions: number;
  totalRevenue: number;
  topDrugs: { drugName: string; quantitySold: number; revenue: number }[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const pharmacyService = {

  // ── Drugs ──────────────────────────────────────────────────────────────────

  getDrugs: () =>
    api.get(`${PH}/drugs`).then(r => r.data),

  getDrugById: (id: string) =>
    api.get(`${PH}/drugs/${id}`).then(r => r.data),

  createDrug: (data: CreateDrugRequest) =>
    api.post(`${PH}/drugs`, data).then(r => r.data),

  updateDrug: (id: string, data: UpdateDrugRequest) =>
    api.put(`${PH}/drugs/${id}`, data).then(r => r.data),

  // ── Batches ────────────────────────────────────────────────────────────────

  createBatch: (data: CreateBatchRequest) =>
    api.post(`${PH}/batches`, data).then(r => r.data),

  getBatchesByDrugId: (drugId: string) =>
    api.get(`${PH}/batches/by-drug/${drugId}`).then(r => r.data),

  // ── Prescriptions ──────────────────────────────────────────────────────────

  createPrescription: (data: CreatePrescriptionRequest) =>
    api.post(`${PH}/prescriptions`, data).then(r => r.data),

  getPrescriptionById: (id: string) =>
    api.get(`${PH}/prescriptions/${id}`).then(r => r.data),

  getPrescriptionsByPatientId: (patientId: string) =>
    api.get(`${PH}/prescriptions/by-patient/${patientId}`).then(r => r.data),

  verifyPrescription: (id: string) =>
    api.post(`${PH}/prescriptions/${id}/verify`).then(r => r.data),

  dispensePrescription: (id: string) =>
    api.post(`${PH}/prescriptions/${id}/dispense`).then(r => r.data),

  cancelPrescription: (id: string, cancellationReason: string) =>
    api.post(`${PH}/prescriptions/${id}/cancel`, { cancellationReason }).then(r => r.data),

  getPrescriptionReceipt: (id: string) =>
    api.get(`${PH}/prescriptions/${id}/receipt`).then(r => r.data),

  // ── Reports ────────────────────────────────────────────────────────────────

  getDailySalesReport: (date: string) =>
    api.get(`${PH}/reports/daily-sales`, { params: { date } }).then(r => r.data),

  getLowStockReport: () =>
    api.get(`${PH}/reports/low-stock`).then(r => r.data),

  // ── Health ─────────────────────────────────────────────────────────────────

  healthCheck: () =>
    api.get(`${PH}/health`).then(r => r.data),
};

export default pharmacyService;
