import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import {
  LayoutDashboard, FileText, TestTube, Pill, Package, Receipt,
  Users, LogOut, Shield, FileSearch, Calendar, Bed, Stethoscope,
  Activity, KeyRound, ChevronLeft, ChevronRight, Settings, BarChart3,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/store/slices/authSlice';
import { authService } from '@/features/auth/services/authService';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard',     href: '/dashboard',        icon: LayoutDashboard, permission: 'dashboardArea' },
      { name: 'Reception',     href: '/reception',        icon: ClipboardList,   permission: 'patient.view' },
    ],
  },
  {
    title: 'Clinical',
    items: [
      { name: 'Patients',      href: '/patients',         icon: Users,           permission: 'patientsArea' },
      { name: 'Appointments',  href: '/appointments',     icon: Calendar,        permission: 'appointmentsArea' },
      { name: 'Doctor Queue',  href: '/doctor-dashboard', icon: Stethoscope,     permission: 'encountersArea' },
      { name: 'Nurse Station', href: '/nurse-station',    icon: Activity,        permission: 'encountersArea' },
      { name: 'IPD',           href: '/ipd',              icon: Bed,             permission: 'ipdArea' },
      { name: 'Visits',        href: '/visits',           icon: Activity,        permission: 'encountersArea' },
      { name: 'EMR',           href: '/emr',              icon: FileText,        permission: 'encountersArea' },
      { name: 'Doctors',       href: '/doctors',          icon: Stethoscope,     permission: 'doctorsArea' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Laboratory',    href: '/laboratory',       icon: TestTube,        permission: 'laboratoryArea' },
      { name: 'Pharmacy',      href: '/pharmacy',         icon: Pill,            permission: 'pharmacyArea' },
      { name: 'Inventory',     href: '/inventory',        icon: Package,         permission: 'inventoryArea' },
      { name: 'Billing',       href: '/billing',          icon: Receipt,         permission: 'billingArea' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { name: 'Users & Roles', href: '/users',                    icon: Shield,    permission: 'usersArea' },
      { name: 'Permissions',   href: '/users/permissions',        icon: KeyRound,  permission: 'role.manage' },
      { name: 'Audit Logs',    href: '/audit',                    icon: FileSearch,permission: 'audit.view' },
      { name: 'Reports',       href: '/reports',                  icon: BarChart3, permission: 'analytics.reports' },
      { name: 'Settings',      href: '/settings',                 icon: Settings,  permission: 'settings.manage' },
    ],
  },
] as const;

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const permissionCodes = useSelector((s: RootState) => s.auth.permissions);
  const userEmail = useSelector((s: RootState) => s.auth.user?.email) ?? 'staff@hospital.com';
  const userRole  = useSelector((s: RootState) => s.auth.user?.role)  ?? 'User';
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const canSee = (perm?: string) => {
    if (!perm) return true;
    const has = (c: string) => permissionCodes.includes(c);
    const any = (...cs: string[]) => cs.some(has);
    const startsWith = (prefix: string) => permissionCodes.some(c => c.startsWith(prefix));
    switch (perm) {
      case 'usersArea':        return any('user.view','role.manage','user.create');
      case 'patientsArea':     return any('patient.view','patient.create','patient.update','patient.merge','patient.delete');
      case 'appointmentsArea': return any('appointment.view','appointment.book','appointment.slots');
      case 'encountersArea':   return any('encounter.view','encounter.create','encounter.update');
      case 'billingArea':      return any('invoice.view','invoice.create','invoice.edit','payment.record','invoice.refund','refund.view','refund.approve');
      case 'laboratoryArea':   return startsWith('lab.');
      case 'pharmacyArea':     return startsWith('pharmacy.');
      case 'doctorsArea':      return any('doctor.view','doctor.create','doctor.update','doctor.delete','doctor.schedule.manage');
      case 'dashboardArea':    return any('analytics.dashboard','analytics.financial','analytics.clinical');
      case 'inventoryArea':    return startsWith('inventory.');
      case 'ipdArea':          return any('ipd.view','ipd.admit','ipd.discharge');
      case 'settings.manage':  return any('settings.manage','admin.full');
      case 'analytics.reports':return any('analytics.reports','analytics.dashboard');
      default:                 return has(perm);
    }
  };

  const handleLogout = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) { try { await authService.logout(rt); } catch { /* ignore */ } }
    dispatch(logout());
    navigate('/login');
  };

  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col bg-slate-900 border-r border-slate-800/60 transition-[width] duration-300 ease-in-out z-40 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] z-50 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft  className="h-3.5 w-3.5" />
        }
      </button>

      {/* Logo */}
      <div className="flex h-[60px] shrink-0 items-center border-b border-slate-800/60 px-4 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Activity className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <p className="text-sm font-bold text-white leading-none truncate">MedLedger</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">HMS Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-5">
        {navigationGroups.map((group, gi) => {
          const visible = group.items.filter(i => canSee(i.permission));
          if (!visible.length) return null;
          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {group.title}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-3 mb-3 border-t border-slate-800/60" />
              )}
              <ul className="space-y-0.5">
                {visible.map(item => {
                  const active = location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        title={collapsed ? item.name : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
                        )}
                        <item.icon className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                        )} />
                        {!collapsed && (
                          <span className="truncate animate-in fade-in duration-150">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-800/60 p-3 space-y-1">
        {/* User info */}
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-2 py-2 overflow-hidden',
          !collapsed && 'bg-slate-800/40'
        )}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary text-xs font-bold">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-in fade-in duration-150">
              <p className="text-xs font-semibold text-slate-200 truncate leading-none">
                {userEmail.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{userRole}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? t('common.logout') : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span className="animate-in fade-in duration-150">{t('common.logout')}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
