import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ChangePasswordPage } from './features/auth/pages/ChangePasswordPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { EMRPage } from './features/emr/pages/EMRPage';
import { EncounterDetailPage } from './features/emr/pages/EncounterDetailPage';
import { LaboratoryPage } from './features/laboratory/pages/LaboratoryPage';
import { PharmacyPage } from './features/pharmacy/pages/PharmacyPage';
import { BillingPage } from './features/billing/pages/BillingPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { PatientsPage } from './features/patients/pages/PatientsPage';
import { PatientProfilePage } from './features/patients/pages/PatientProfilePage';
import { EditPatientPage } from './features/patients/pages/EditPatientPage';
import { PatientHistoryPage } from './features/patients/pages/PatientHistoryPage';
import { PatientRegistrationPage } from './features/patients/pages/PatientRegistrationPage';
import { PatientMastersPage } from './features/patients/pages/PatientMastersPage';
import { PatientDocumentsPage } from './features/patients/pages/PatientDocumentsPage';
import { PatientDashboardPage } from './features/patients/pages/PatientDashboardPage';
import { PatientMergePage } from './features/patients/pages/PatientMergePage';
import { WalkInPatientPage } from './features/patients/pages/WalkInPatientPage';
import { PatientQueuePage } from './features/patients/pages/PatientQueuePage';
import { PatientRenewalPage } from './features/patients/pages/PatientRenewalPage';
import { PatientExportImportPage } from './features/patients/pages/PatientExportImportPage';
import { PatientCardReprintPage } from './features/patients/pages/PatientCardReprintPage';
import { PatientAuditLogPage } from './features/patients/pages/PatientAuditLogPage';
import { PatientBarcodeGeneratorPage } from './features/patients/pages/PatientBarcodeGeneratorPage';
import { VisitsPage } from './features/visits/pages/VisitsPage';
import { VisitDetailPage } from './features/visits/pages/VisitDetailPage';
import { CreateEncounterPage } from './features/encounters/pages/CreateEncounterPage';
import { InvoiceDetailPage } from './features/billing/pages/InvoiceDetailPage';
import { ARAgingReportPage } from './features/billing/pages/ARAgingReportPage';
import { RefundApprovalPage } from './features/billing/pages/RefundApprovalPage';
import { AuditLogsPage } from './features/audit/pages/AuditLogsPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { PermissionsPage } from './features/users/pages/PermissionsPage';
import { PermissionsManagementPage } from './features/users/pages/PermissionsManagementPage';
import { DoctorsPage } from './features/doctors/pages/DoctorsPage';
import { DoctorDetailPage } from './features/doctors/pages/DoctorDetailPage';
import { EditDoctorPage } from './features/doctors/pages/EditDoctorPage';
import { AppointmentsPage } from './features/appointments/pages/AppointmentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="emr" element={<EMRPage />} />
              <Route path="emr/encounter/:id" element={<EncounterDetailPage />} />
              <Route path="laboratory" element={<LaboratoryPage />} />
              <Route path="pharmacy" element={<PharmacyPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="billing/ar-aging" element={<ARAgingReportPage />} />
              <Route path="billing/refunds/approval" element={<RefundApprovalPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="doctors" element={<DoctorsPage />} />
              <Route path="doctors/:id" element={<DoctorDetailPage />} />
              <Route path="doctors/:id/edit" element={<EditDoctorPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/dashboard" element={<PatientDashboardPage />} />
              <Route path="patients/register" element={<PatientRegistrationPage />} />
              <Route path="patients/walk-in" element={<WalkInPatientPage />} />
              <Route path="patients/merge" element={<PatientMergePage />} />
              <Route path="patients/queue" element={<PatientQueuePage />} />
              <Route path="patients/renewal" element={<PatientRenewalPage />} />
              <Route path="patients/export-import" element={<PatientExportImportPage />} />
              <Route path="patients/card-reprint" element={<PatientCardReprintPage />} />
              <Route path="patients/audit-log" element={<PatientAuditLogPage />} />
              <Route path="patients/barcode" element={<PatientBarcodeGeneratorPage />} />
              <Route path="patients/masters" element={<PatientMastersPage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="patients/:id/edit" element={<EditPatientPage />} />
              <Route path="patients/:id/history" element={<PatientHistoryPage />} />
              <Route path="patients/:id/documents" element={<PatientDocumentsPage />} />
              <Route path="visits" element={<VisitsPage />} />
              <Route path="visits/:id" element={<VisitDetailPage />} />
              <Route path="encounters/create" element={<CreateEncounterPage />} />
              <Route path="billing/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/permissions" element={<PermissionsPage />} />
              <Route path="users/permissions/manage" element={<PermissionsManagementPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
