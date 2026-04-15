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
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('patients.title')}</h1>
          <p className="page-subtitle">Manage your hospital's patient directory and health records.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/patients/register')} className="gap-1.5 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          {t('patients.register')}
        </Button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
        {[
          { icon: BarChart3,     label: 'Dashboard',    path: '/patients/dashboard',    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { icon: Clock,         label: 'Queue',        path: '/patients/queue',        color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: RefreshCw,     label: 'Renewal',      path: '/patients/renewal',      color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { icon: GitMerge,      label: 'Merge',        path: '/patients/merge',        color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: FileSpreadsheet,label:'Export/Import', path: '/patients/export-import',color: 'text-cyan-600',   bg: 'bg-cyan-50'   },
          { icon: CreditCard,    label: 'Card Reprint', path: '/patients/card-reprint', color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: History,       label: 'Audit Log',    path: '/patients/audit-log',    color: 'text-slate-600',  bg: 'bg-slate-50'  },
          { icon: QrCode,        label: 'Barcode/QR',   path: '/patients/barcode',      color: 'text-rose-600',   bg: 'bg-rose-50'   },
          { icon: Settings,      label: 'Masters',      path: '/patients/masters',      color: 'text-gray-600',   bg: 'bg-gray-50'   },
          { icon: Zap,           label: 'Walk-in',      path: '/patients/walk-in',      color: 'text-amber-600',  bg: 'bg-amber-50'  },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)} className="group quick-tile">
            <div className={`quick-tile-icon ${a.bg} group-hover:scale-110 transition-transform`}>
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="quick-tile-label group-hover:text-primary">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Patient List Component */}
      <PatientListAdvanced />
    </div>
  );
}
