import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  onSelect?: (item: DropdownItem) => void;
}

export function Dropdown({
  items,
  trigger,
  align = 'left',
  className,
  disabled = false,
  onSelect,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    
    setIsOpen(false);
    if (item.onClick) item.onClick();
    if (onSelect) onSelect(item);
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger || (
          <Button variant="outline" size="sm">
            Options
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] bg-white dark:bg-slate-900',
            'rounded-xl border border-slate-200 dark:border-slate-800',
            'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
            'py-2 animate-in zoom-in-95 fade-in slide-in-from-top-1 duration-200',
            align === 'left' ? 'left-0' : 'right-0',
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={index}
                  className="my-2 h-px bg-slate-200 dark:bg-slate-800"
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.value}
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm font-medium',
                  'flex items-center gap-3',
                  'transition-colors duration-150',
                  item.disabled
                    ? 'text-slate-400 cursor-not-allowed'
                    : item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
                role="menuitem"
              >
                {item.icon && (
                  <span className={cn(
                    'h-4 w-4 shrink-0',
                    item.danger && 'text-rose-500'
                  )}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Context Menu variant
interface ContextMenuProps {
  items: DropdownItem[];
  children: ReactNode;
  className?: string;
}

export function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      
      {position && (
        <div
          ref={menuRef}
          className={cn(
            'fixed z-50 min-w-[180px] bg-white dark:bg-slate-900',
            'rounded-xl border border-slate-200 dark:border-slate-800',
            'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
            'py-2 animate-in zoom-in-95 fade-in duration-200',
          )}
          style={{
            left: Math.min(position.x, window.innerWidth - 200),
            top: Math.min(position.y, window.innerHeight - (items.length * 40)),
          }}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={index}
                  className="my-2 h-px bg-slate-200 dark:bg-slate-800"
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.value}
                onClick={() => {
                  setPosition(null);
                  if (item.onClick) item.onClick();
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm font-medium',
                  'flex items-center gap-3',
                  'transition-colors duration-150',
                  item.disabled
                    ? 'text-slate-400 cursor-not-allowed'
                    : item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
                role="menuitem"
              >
                {item.icon && (
                  <span className="h-4 w-4 shrink-0">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}