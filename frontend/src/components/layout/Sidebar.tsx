import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import { 
  LayoutDashboard, 
  FileText, 
  TestTube, 
  Pill, 
  Package, 
  Receipt,
  Users,
  LogOut,
  Shield,
  FileSearch,
  Calendar,
  Bed, Stethoscope,
  Activity,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/store/slices/authSlice';
import { authService } from '@/features/auth/services/authService';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: 'dashboardArea',
      },
    ],
  },
  {
    title: 'Clinical',
    items: [
      {
        name: 'Patients',
        href: '/patients',
        icon: Users,
        permission: 'patientsArea',
      },
      {
        name: 'IPD',
        href: '/ipd',
        icon: Bed,
        permission: 'ipdArea',
      },

      {
        name: 'Visits',
        href: '/visits',
        icon: Activity,
        permission: 'encountersArea',
      },
      {
        name: 'Appointments',
        href: '/appointments',
        icon: Calendar,
        permission: 'appointmentsArea',
      },
      {
        name: 'EMR',
        href: '/emr',
        icon: FileText,
        permission: 'encountersArea',
      },
      {
        name: 'Doctors',
        href: '/doctors',
        icon: Bed, Stethoscope,
        permission: 'doctorsArea',
      },
    ],
  },
  {
    title: 'Operational',
    items: [
      {
        name: 'Laboratory',
        href: '/laboratory',
        icon: TestTube,
        permission: 'laboratoryArea',
      },
      {
        name: 'Pharmacy',
        href: '/pharmacy',
        icon: Pill,
        permission: 'pharmacyArea',
      },
      { 
        name: 'Inventory', 
        href: '/inventory', 
        icon: Package,
        permission: 'inventoryArea',
      },
      {
        name: 'Billing',
        href: '/billing',
        icon: Receipt,
        permission: 'billingArea',
      },
    ],
  },
  {
    title: 'Admin & Security',
    items: [
      {
        name: 'Users & roles',
        href: '/users',
        icon: Shield,
        permission: 'usersArea',
      },
      {
        name: 'Permission matrix',
        href: '/users/permissions',
        icon: KeyRound,
        permission: 'role.manage',
      },
      { 
        name: 'Audit Logs', 
        href: '/audit', 
        icon: FileSearch, 
        permission: 'audit.view',
      },
    ],
  },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const permissionCodes = useSelector((s: RootState) => s.auth.permissions);
  const userEmail = useSelector((s: RootState) => s.auth.user?.email) || 'staff@hospital.com';
  const userRole = useSelector((s: RootState) => s.auth.user?.role) || 'User';
  
  const canSee = (perm?: string) => {
    if (!perm) return true;
    if (perm === 'usersArea')
      return (
        permissionCodes.includes('user.view') ||
        permissionCodes.includes('role.manage') ||
        permissionCodes.includes('user.create')
      );
    if (perm === 'patientsArea')
      return (
        permissionCodes.includes('patient.view') ||
        permissionCodes.includes('patient.create') ||
        permissionCodes.includes('patient.update') ||
        permissionCodes.includes('patient.merge') ||
        permissionCodes.includes('patient.delete')
      );
    if (perm === 'appointmentsArea')
      return (
        permissionCodes.includes('appointment.view') ||
        permissionCodes.includes('appointment.book') ||
        permissionCodes.includes('appointment.slots')
      );
    if (perm === 'encountersArea')
      return (
        permissionCodes.includes('encounter.view') ||
        permissionCodes.includes('encounter.create') ||
        permissionCodes.includes('encounter.update')
      );
    if (perm === 'billingArea')
      return (
        permissionCodes.includes('invoice.view') ||
        permissionCodes.includes('invoice.create') ||
        permissionCodes.includes('invoice.edit') ||
        permissionCodes.includes('payment.record') ||
        permissionCodes.includes('invoice.refund') ||
        permissionCodes.includes('refund.view') ||
        permissionCodes.includes('refund.approve')
      );
    if (perm === 'laboratoryArea')
      return permissionCodes.some((c) => c.startsWith('lab.'));
    if (perm === 'pharmacyArea')
      return permissionCodes.some((c) => c.startsWith('pharmacy.'));
    if (perm === 'doctorsArea')
      return (
        permissionCodes.includes('doctor.view') ||
        permissionCodes.includes('doctor.create') ||
        permissionCodes.includes('doctor.update') ||
        permissionCodes.includes('doctor.delete') ||
        permissionCodes.includes('doctor.schedule.manage')
      );
    if (perm === 'dashboardArea')
      return (
        permissionCodes.includes('analytics.dashboard') ||
        permissionCodes.includes('analytics.financial') ||
        permissionCodes.includes('analytics.clinical')
      );
    if (perm === 'inventoryArea')
      return permissionCodes.some((c) => c.startsWith('inventory.'));
    return permissionCodes.includes(perm);
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        /* still clear local session */
      }
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div 
      className={cn(
        "relative flex h-screen flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out shadow-2xl z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 hover:bg-primary/90 z-50 transition-transform active:scale-95"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="flex h-20 items-center border-b border-slate-800 px-6 overflow-hidden bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/30">
            <Activity className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="text-xl font-black text-white tracking-tighter leading-none">
                MedLedger
              </h1>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                Health Infrastructure
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar px-3">
        {navigationGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => canSee(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-6">
              {!isCollapsed ? (
                <h2 className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-in fade-in duration-500">
                  {group.title}
                </h2>
              ) : idx > 0 && (
                <div className="mx-auto w-8 border-t border-slate-800 my-4" />
              )}
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'hover:bg-slate-800/50 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[2px_0_8px_rgba(37,99,235,0.4)]" />
                      )}
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-all duration-200 group-hover:scale-110",
                        isActive ? "text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" : "text-slate-400 group-hover:text-white"
                      )} />
                      {!isCollapsed && (
                        <span className="animate-in fade-in slide-in-from-left-2 duration-300">
                          {item.name}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>
      
      <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 space-y-3">
        {/* User Profile Section */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl transition-colors duration-200",
          !isCollapsed && "bg-slate-800/30 border border-slate-800/50"
        )}>
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner group cursor-pointer hover:border-primary/50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-black text-sm uppercase">
                {userEmail.charAt(0)}
              </span>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-sm font-bold text-white truncate leading-none mb-1">
                {userEmail.split('@')[0]}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {userRole}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={isCollapsed ? t('common.logout') : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 group relative"
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-12 group-hover:translate-x-0.5" />
          {!isCollapsed && (
            <span className="animate-in fade-in slide-in-from-left-2 duration-300">
              {t('common.logout')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
