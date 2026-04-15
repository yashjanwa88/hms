import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  searchable = false,
  disabled = false,
  className,
  label,
  error,
  size = 'md',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || defaultValue || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !opt.disabled
      )
    : options.filter(opt => !opt.disabled);

  // Group options if they have groups
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const group = opt.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  const hasGroups = Object.keys(groupedOptions).length > 1 || 
    (Object.keys(groupedOptions).length === 1 && Object.keys(groupedOptions)[0] !== 'Other');

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-sm',
    lg: 'h-12 text-base',
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    if (onChange) onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 rounded-lg border transition-all duration-200',
          'bg-white dark:bg-slate-900',
          isOpen 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800',
          error && 'border-rose-500 ring-2 ring-rose-200',
          sizeClasses[size]
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={cn(
          'truncate',
          !displayValue && 'text-slate-400'
        )}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-slate-400 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in zoom-in-95 fade-in slide-in-from-top-1 duration-200"
          role="listbox"
        >
          {/* Search */}
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No options found
              </div>
            ) : hasGroups ? (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    {group}
                  </div>
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between',
                        'transition-colors duration-150',
                        option.value === value
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                        option.disabled && 'text-slate-400 cursor-not-allowed'
                      )}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between',
                    'transition-colors duration-150',
                    option.value === value
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                    option.disabled && 'text-slate-400 cursor-not-allowed'
                  )}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}