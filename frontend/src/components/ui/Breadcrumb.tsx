import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-xs font-bold uppercase tracking-widest', className)}>
      <Link
        to="/"
        className="flex items-center gap-1 text-slate-400 hover:text-primary transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-3 w-3 text-slate-400 mx-1" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="flex items-center gap-1 text-slate-400 hover:text-primary transition-colors"
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              'flex items-center gap-1',
              index === items.length - 1 
                ? 'text-primary' 
                : 'text-slate-400 hover:text-primary transition-colors cursor-pointer'
            )}>
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}