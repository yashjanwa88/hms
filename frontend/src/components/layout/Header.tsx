import { Moon, Sun, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const userEmail = localStorage.getItem('role') || 'User';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Welcome back!</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
