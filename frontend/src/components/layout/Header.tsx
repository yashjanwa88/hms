import { Moon, Sun, User, Search, Settings, HelpCircle, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/Input';
import { Breadcrumb } from '../ui/Breadcrumb';
import { useLocation } from 'react-router-dom';
import { NotificationsPanel } from './NotificationsPanel';

export function Header() {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userRole = localStorage.getItem('role') || 'User';
  const userEmail = localStorage.getItem('email') || 'staff@hospital.com';
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Generate breadcrumbs based on current route
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: Array<{ label: string; href?: string }> = [];

    if (pathSegments.length === 0) return items;

    // Map routes to breadcrumb labels
    const routeMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'reception': 'Reception',
      'nurse-station': 'Nurse Station',
      'doctor-dashboard': 'Doctor Dashboard',
      'emr': 'EMR',
      'laboratory': 'Laboratory',
      'pharmacy': 'Pharmacy',
      'billing': 'Billing',
      'inventory': 'Inventory',
      'doctors': 'Doctors',
      'appointments': 'Appointments',
      'ipd': 'IPD',
      'patients': 'Patients',
      'visits': 'Visits',
      'encounters': 'Encounters',
      'audit': 'Audit',
      'users': 'Users',
      'queue': 'Queue Management'
    };

    pathSegments.forEach((segment, index) => {
      const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      
      items.push({ label, href });
    });

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
      // You can integrate with your search API here
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-900 px-6 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Left Section: Breadcrumbs and Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={() => {
            // Toggle sidebar on mobile
            const sidebar = document.querySelector('[data-sidebar]');
            if (sidebar) {
              sidebar.classList.toggle('hidden');
            }
          }}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5 text-slate-500" />
        </button>

        {/* Breadcrumbs */}
        <div className="hidden md:block">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Search className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search') + " (Patients, Doctors, Appointments...)"}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg transition-all"
              onFocus={() => setIsSearchOpen(true)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="h-3 w-3 bg-slate-400 rounded-full block" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs font-bold"
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </div>
          
          {/* Search Suggestions (when search is open) */}
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Quick Actions
                </p>
              </div>
              <div className="p-2 space-y-1">
                {['Patient Search', 'Doctor Search', 'Appointment Search', 'Billing Search'].map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setSearchQuery(action.toLowerCase().replace(' ', ''));
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Right Section: Actions and User */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border-r pr-3 mr-1 border-slate-200 dark:border-slate-800">
          <LanguageSwitcher />
        </div>

        <NotificationsPanel />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Settings className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800 ml-1">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
              {userEmail.split('@')[0]}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {userRole}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
            <User className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
