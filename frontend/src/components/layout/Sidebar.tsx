import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Stethoscope,
  Activity,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboardArea' as const,
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users,
    permission: 'patientsArea' as const,
  },
  {
    name: 'Visits',
    href: '/visits',
    icon: Activity,
    permission: 'encountersArea' as const,
  },
  {
    name: 'Doctors',
    href: '/doctors',
    icon: Stethoscope,
    permission: 'doctorsArea' as const,
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    permission: 'appointmentsArea' as const,
  },
  {
    name: 'EMR',
    href: '/emr',
    icon: FileText,
    permission: 'encountersArea' as const,
  },
  {
    name: 'Laboratory',
    href: '/laboratory',
    icon: TestTube,
    permission: 'laboratoryArea' as const,
  },
  {
    name: 'Pharmacy',
    href: '/pharmacy',
    icon: Pill,
    permission: 'pharmacyArea' as const,
  },
  { name: 'Inventory', href: '/inventory', icon: Package },
  {
    name: 'Billing',
    href: '/billing',
    icon: Receipt,
    permission: 'billingArea' as const,
  },
  {
    name: 'Users & roles',
    href: '/users',
    icon: Shield,
    permission: 'usersArea' as const,
  },
  {
    name: 'Permission matrix',
    href: '/users/permissions',
    icon: KeyRound,
    permission: 'role.manage' as const,
  },
  { name: 'Audit Logs', href: '/audit', icon: FileSearch, permission: 'audit.view' as const },
] as const;

export function Sidebar() {
  const location = useLocation();
  const permissionCodes = useSelector((s: RootState) => s.auth.permissions);
  const canSee = (_href: string, perm?: string) => {
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

  const visibleNav = navigation.filter((item) =>
    'permission' in item ? canSee(item.href, item.permission) : true
  );
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
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">MedLedger</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const isActive =
            item.href === '/users'
              ? location.pathname === '/users'
              : item.href === '/users/permissions'
                ? location.pathname === '/users/permissions'
                : item.href === '/patients'
                  ? location.pathname.startsWith('/patients')
                  : item.href === '/appointments'
                    ? location.pathname.startsWith('/appointments')
                    : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
