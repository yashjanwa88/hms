import { Moon, Sun, User, Search, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '../ui/Breadcrumb';
import { useLocation, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationsPanel } from './NotificationsPanel';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', reception: 'Reception', 'nurse-station': 'Nurse Station',
  'doctor-dashboard': 'Doctor Dashboard', emr: 'EMR', laboratory: 'Laboratory',
  pharmacy: 'Pharmacy', billing: 'Billing', inventory: 'Inventory',
  doctors: 'Doctors', appointments: 'Appointments', ipd: 'IPD',
  patients: 'Patients', visits: 'Visits', encounters: 'Encounters',
  audit: 'Audit Logs', users: 'Users', queue: 'Queue', settings: 'Settings',
  reports: 'Reports', register: 'Register', edit: 'Edit', history: 'History',
  documents: 'Documents', permissions: 'Permissions', manage: 'Manage',
};

export function Header() {
  const { t } = useTranslation();
  const [dark, setDark]           = useState(() => document.documentElement.classList.contains('dark'));
  const [search, setSearch]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const location  = useLocation();
  const navigate  = useNavigate();

  const userRole  = localStorage.getItem('role')  ?? 'User';
  const userEmail = localStorage.getItem('email') ?? '';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: ROUTE_LABELS[seg] ?? (seg.length === 36 ? '...' : seg.charAt(0).toUpperCase() + seg.slice(1)),
      href: '/' + arr.slice(0, i + 1).join('/'),
    }));

  const quickLinks = [
    { label: 'Register Patient', path: '/patients/register' },
    { label: 'Patient List',     path: '/patients' },
    { label: 'Appointments',     path: '/appointments' },
    { label: 'Billing',          path: '/billing' },
    { label: 'Laboratory',       path: '/laboratory' },
  ];

  const filtered = search.trim()
    ? quickLinks.filter(l => l.label.toLowerCase().includes(search.toLowerCase()))
    : quickLinks;

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 z-30 gap-4">

      {/* Left — breadcrumb */}
      <div className="hidden md:flex items-center min-w-0 flex-1">
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Center — search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder="Quick search…"
            className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              Quick Links
            </p>
            {filtered.map(l => (
              <button
                key={l.path}
                onClick={() => { navigate(l.path); setSearchOpen(false); setSearch(''); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Search className="h-3 w-3 text-slate-400 shrink-0" />
                {l.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-slate-400 text-center">No results</p>
            )}
          </div>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1 shrink-0">
        <LanguageSwitcher />

        <NotificationsPanel />

        <button
          onClick={() => setDark(!dark)}
          className="icon-btn"
          aria-label="Toggle dark mode"
        >
          {dark
            ? <Sun  className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </button>

        {/* User chip */}
        <div className="ml-1 flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
              {userEmail ? userEmail.split('@')[0] : 'Staff'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">{userRole}</span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors">
            {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>
    </header>
  );
}
