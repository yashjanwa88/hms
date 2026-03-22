export interface User {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  tenantCode?: string;
  /** RBAC codes from IdentityService (mirrors JWT <code>permission</code> claims). */
  permissions?: string[];
  /** Optional; also stored at auth slice level for gating. */
  forcePasswordChangeRequired?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Denormalized from login for UI gating (same as <code>user.permissions</code>). */
  permissions: string[];
  /** When true, user must complete change-password before other routes (mirrors Identity <code>force_password_change</code>). */
  forcePasswordChangeRequired: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    mfaRequired?: boolean;
    mfaChallengeToken?: string;
    accessToken: string;
    refreshToken: string;
    userId: string;
    tenantId: string;
    email: string;
    role: string;
    expiresAt: string;
    permissions?: string[];
    forcePasswordChange?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface Encounter {
  id: string;
  encounterNumber: string;
  patientId: string;
  doctorId: string;
  encounterType: string;
  encounterDate: string;
  status: string;
  chiefComplaint?: string;
}

export interface Vital {
  id: string;
  temperature?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  oxygenSaturation?: number;
  recordedAt: string;
}

export interface Diagnosis {
  id: string;
  icd10Code: string;
  diagnosisName: string;
  diagnosisType: string;
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  noteType: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  createdAt: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  testId: string;
  testName: string;
  status: string;
  orderedAt: string;
}

export interface Medicine {
  id: string;
  medicineName: string;
  genericName: string;
  category: string;
  unitPrice: number;
  stockQuantity: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  encounterId: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeEncounters: number;
  pendingLabOrders: number;
  lowStockAlerts: number;
}
