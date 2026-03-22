import { Moon, Sun, User, Bell, Search, Settings, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/Input';

export function Header() {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const userRole = localStorage.getItem('role') || 'User';
  const userEmail = localStorage.getItem('email') || 'staff@hospital.com';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-slate-900 px-6 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={t('common.search') + "..."} 
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-primary h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border-r pr-3 mr-1 border-slate-200 dark:border-slate-800">
          <LanguageSwitcher />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 dark:text-slate-400"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="text-slate-500 dark:text-slate-400"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 dark:text-slate-400"
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
