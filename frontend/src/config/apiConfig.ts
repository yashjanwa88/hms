/**
 * Centralized API Configuration
 * Inspired by web-softclinic-app's EnvironmentService pattern
 */

export interface ApiEndpoint {
  baseUrl: string;
  oDataUrl?: string;
  name: string;
}

export interface ApiConfig {
  patientService: ApiEndpoint;
  laboratoryService: ApiEndpoint;
  pharmacyService: ApiEndpoint;
  appointmentService: ApiEndpoint;
  doctorService: ApiEndpoint;
  encounterService: ApiEndpoint;
  emrService: ApiEndpoint;
  billingService: ApiEndpoint;
  inventoryService: ApiEndpoint;
  ipdService: ApiEndpoint;
  hrService: ApiEndpoint;
  identityService: ApiEndpoint;
  insuranceService: ApiEndpoint;
  visitService: ApiEndpoint;
  auditService: ApiEndpoint;
  tenantService: ApiEndpoint;
  analyticsService: ApiEndpoint;
  notificationService: ApiEndpoint;
  apiGateway: ApiEndpoint;
}

const getEnvVar = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

export const apiConfig: ApiConfig = {
  patientService: {
    baseUrl: getEnvVar('VITE_PATIENT_SERVICE_URL', 'http://localhost:5001'),
    oDataUrl: getEnvVar('VITE_PATIENT_SERVICE_ODATA_URL', 'http://localhost:5001/odata'),
    name: 'Patient Service'
  },
  laboratoryService: {
    baseUrl: getEnvVar('VITE_LABORATORY_SERVICE_URL', 'http://localhost:5007'),
    oDataUrl: getEnvVar('VITE_LABORATORY_SERVICE_ODATA_URL', 'http://localhost:5007/odata'),
    name: 'Laboratory Service'
  },
  pharmacyService: {
    baseUrl: getEnvVar('VITE_PHARMACY_SERVICE_URL', 'http://localhost:5003'),
    oDataUrl: getEnvVar('VITE_PHARMACY_SERVICE_ODATA_URL', 'http://localhost:5003/odata'),
    name: 'Pharmacy Service'
  },
  appointmentService: {
    baseUrl: getEnvVar('VITE_APPOINTMENT_SERVICE_URL', 'http://localhost:5002'),
    oDataUrl: getEnvVar('VITE_APPOINTMENT_SERVICE_ODATA_URL', 'http://localhost:5002/odata'),
    name: 'Appointment Service'
  },
  doctorService: {
    baseUrl: getEnvVar('VITE_DOCTOR_SERVICE_URL', 'http://localhost:5004'),
    oDataUrl: getEnvVar('VITE_DOCTOR_SERVICE_ODATA_URL', 'http://localhost:5004/odata'),
    name: 'Doctor Service'
  },
  encounterService: {
    baseUrl: getEnvVar('VITE_ENCOUNTER_SERVICE_URL', 'http://localhost:5005'),
    oDataUrl: getEnvVar('VITE_ENCOUNTER_SERVICE_ODATA_URL', 'http://localhost:5005/odata'),
    name: 'Encounter Service'
  },
  emrService: {
    baseUrl: getEnvVar('VITE_EMR_SERVICE_URL', 'http://localhost:5006'),
    oDataUrl: getEnvVar('VITE_EMR_SERVICE_ODATA_URL', 'http://localhost:5006/odata'),
    name: 'EMR Service'
  },
  billingService: {
    baseUrl: getEnvVar('VITE_BILLING_SERVICE_URL', 'http://localhost:5008'),
    oDataUrl: getEnvVar('VITE_BILLING_SERVICE_ODATA_URL', 'http://localhost:5008/odata'),
    name: 'Billing Service'
  },
  inventoryService: {
    baseUrl: getEnvVar('VITE_INVENTORY_SERVICE_URL', 'http://localhost:5009'),
    oDataUrl: getEnvVar('VITE_INVENTORY_SERVICE_ODATA_URL', 'http://localhost:5009/odata'),
    name: 'Inventory Service'
  },
  ipdService: {
    baseUrl: getEnvVar('VITE_IPD_SERVICE_URL', 'http://localhost:5010'),
    oDataUrl: getEnvVar('VITE_IPD_SERVICE_ODATA_URL', 'http://localhost:5010/odata'),
    name: 'IPD Service'
  },
  hrService: {
    baseUrl: getEnvVar('VITE_HR_SERVICE_URL', 'http://localhost:5011'),
    oDataUrl: getEnvVar('VITE_HR_SERVICE_ODATA_URL', 'http://localhost:5011/odata'),
    name: 'HR Service'
  },
  identityService: {
    baseUrl: getEnvVar('VITE_IDENTITY_SERVICE_URL', 'http://localhost:5012'),
    oDataUrl: getEnvVar('VITE_IDENTITY_SERVICE_ODATA_URL', 'http://localhost:5012/odata'),
    name: 'Identity Service'
  },
  insuranceService: {
    baseUrl: getEnvVar('VITE_INSURANCE_SERVICE_URL', 'http://localhost:5013'),
    oDataUrl: getEnvVar('VITE_INSURANCE_SERVICE_ODATA_URL', 'http://localhost:5013/odata'),
    name: 'Insurance Service'
  },
  visitService: {
    baseUrl: getEnvVar('VITE_VISIT_SERVICE_URL', 'http://localhost:5014'),
    oDataUrl: getEnvVar('VITE_VISIT_SERVICE_ODATA_URL', 'http://localhost:5014/odata'),
    name: 'Visit Service'
  },
  auditService: {
    baseUrl: getEnvVar('VITE_AUDIT_SERVICE_URL', 'http://localhost:5015'),
    oDataUrl: getEnvVar('VITE_AUDIT_SERVICE_ODATA_URL', 'http://localhost:5015/odata'),
    name: 'Audit Service'
  },
  tenantService: {
    baseUrl: getEnvVar('VITE_TENANT_SERVICE_URL', 'http://localhost:5016'),
    oDataUrl: getEnvVar('VITE_TENANT_SERVICE_ODATA_URL', 'http://localhost:5016/odata'),
    name: 'Tenant Service'
  },
  analyticsService: {
    baseUrl: getEnvVar('VITE_ANALYTICS_SERVICE_URL', 'http://localhost:5017'),
    oDataUrl: getEnvVar('VITE_ANALYTICS_SERVICE_ODATA_URL', 'http://localhost:5017/odata'),
    name: 'Analytics Service'
  },
  notificationService: {
    baseUrl: getEnvVar('VITE_NOTIFICATION_SERVICE_URL', 'http://localhost:5018'),
    oDataUrl: getEnvVar('VITE_NOTIFICATION_SERVICE_ODATA_URL', 'http://localhost:5018/odata'),
    name: 'Notification Service'
  },
  apiGateway: {
    baseUrl: getEnvVar('VITE_API_GATEWAY_URL', 'http://localhost:5000'),
    oDataUrl: getEnvVar('VITE_API_GATEWAY_ODATA_URL', 'http://localhost:5000/odata'),
    name: 'API Gateway'
  }
};

// API Route Constants (following web-softclinic-app patterns)
export const ApiRoutes = {
  patient: {
    registration: '/api/patients/v1/registration',
    search: '/api/patients/v2/search',
    quickSearch: '/api/patients/quick-search',
    masters: {
      types: '/api/patients/masters/types',
      prefixes: '/api/patients/masters/prefixes',
      registrationTypes: '/api/patients/masters/registration-types'
    }
  },
  laboratory: {
    tests: '/api/lab/tests',
    orders: '/api/lab/orders',
    results: '/api/lab/results',
    masters: {
      investigations: '/api/lab/masters/investigations',
      specimens: '/api/lab/masters/specimens',
      containers: '/api/lab/masters/containers'
    }
  },
  pharmacy: {
    medicines: '/api/pharmacy/medicines',
    prescriptions: '/api/pharmacy/prescriptions',
    dispensing: '/api/pharmacy/dispensing',
    stock: '/api/pharmacy/stock'
  },
  appointment: {
    bookings: '/api/appointments/bookings',
    schedule: '/api/appointments/schedule',
    slots: '/api/appointments/slots'
  },
  common: {
    facilities: '/odata/facilities',
    departments: '/odata/departments',
    locations: '/odata/locations',
    enums: '/api/common/enums'
  }
};

export default apiConfig;