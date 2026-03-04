/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_IDENTITY_SERVICE_URL: string
  readonly VITE_PATIENT_SERVICE_URL: string
  readonly VITE_APPOINTMENT_SERVICE_URL: string
  readonly VITE_BILLING_SERVICE_URL: string
  readonly VITE_PHARMACY_SERVICE_URL: string
  readonly VITE_LABORATORY_SERVICE_URL: string
  readonly VITE_EMR_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
