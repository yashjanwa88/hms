import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { patientService } from '../services/patientService';
import { QuickRegisterModal } from '../components/QuickRegisterModal';
import { PatientRegistrationForm } from '../components/PatientRegistrationForm';
import { PatientSearch } from '../components/PatientSearch';
import { PatientListAdvanced } from '../components/PatientListAdvanced';
import { 
  Plus, Search, BarChart3, Clock, RefreshCw, GitMerge, 
  FileSpreadsheet, CreditCard, History, QrCode, Settings, Zap,
  Users, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function PatientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Patients</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('patients.title')}
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Manage your hospital's patient directory and health records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => navigate('/patients/register')} 
            className="h-12 px-6 shadow-xl shadow-primary/20 gap-2 text-base font-bold"
          >
            <Plus className="h-5 w-5" />
            {t('patients.register')}
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: BarChart3, label: 'Dashboard', path: '/patients/dashboard', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Clock, label: 'Queue', path: '/patients/queue', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: RefreshCw, label: 'Renewal', path: '/patients/renewal', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: GitMerge, label: 'Merge', path: '/patients/merge', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: FileSpreadsheet, label: 'Export/Import', path: '/patients/export-import', color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { icon: CreditCard, label: 'Card Reprint', path: '/patients/card-reprint', color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: History, label: 'Audit Log', path: '/patients/audit-log', color: 'text-slate-600', bg: 'bg-slate-50' },
          { icon: QrCode, label: 'Barcode/QR', path: '/patients/barcode', color: 'text-rose-600', bg: 'bg-rose-50' },
          { icon: Settings, label: 'Masters', path: '/patients/masters', color: 'text-gray-600', bg: 'bg-gray-50' },
          { icon: Zap, label: 'Walk-in', path: '/patients/walk-in', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
          >
            <div className={`h-12 w-12 rounded-xl ${action.bg} dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <action.icon className={`h-6 w-6 ${action.color}`} />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Advanced Patient List Component */}
      <PatientListAdvanced />
    </div>
  );
}
