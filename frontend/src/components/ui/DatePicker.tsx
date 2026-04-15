import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  label?: string;
  error?: string;
  showTimeSelect?: boolean;
  format?: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  minDate,
  maxDate,
  className,
  label,
  error,
  showTimeSelect = false,
  format = 'dd/MM/yyyy',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value?.getMonth() || new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value?.getFullYear() || new Date().getFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [time, setTime] = useState(
    value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '00:00'
  );
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedDate(value || null);
    if (value) {
      setCurrentMonth(value.getMonth());
      setCurrentYear(value.getFullYear());
      setTime(`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [value]);

  const formatDate = (date: Date): string => {
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear().toString();
    
    switch (format) {
      case 'dd/MM/yyyy':
        return `${dd}/${mm}/${yyyy}`;
      case 'MM/dd/yyyy':
        return `${mm}/${dd}/${yyyy}`;
      case 'yyyy-MM-dd':
        return `${yyyy}-${mm}-${dd}`;
      default:
        return `${dd}/${mm}/${yyyy}`;
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    if (isDateDisabled(day)) return;

    const newDate = new Date(currentYear, currentMonth, day);
    
    if (showTimeSelect && time) {
      const [hours, minutes] = time.split(':').map(Number);
      newDate.setHours(hours, minutes);
    }

    setSelectedDate(newDate);
    if (onChange) onChange(newDate);
    if (!showTimeSelect) setIsOpen(false);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes);
      setSelectedDate(newDate);
      if (onChange) onChange(newDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = isDateDisabled(day);
      const isSelected = selectedDate && isSameDay(selectedDate, new Date(currentYear, currentMonth, day));
      const isToday = isSameDay(new Date(), new Date(currentYear, currentMonth, day));

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={cn(
            'h-9 w-9 rounded-lg text-sm font-medium transition-all duration-150',
            'flex items-center justify-center',
            isDisabled && 'text-slate-300 dark:text-slate-600 cursor-not-allowed',
            !isDisabled && !isSelected && 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
            isSelected && 'bg-primary text-white font-bold shadow-md shadow-primary/30',
            !isSelected && isToday && 'bg-slate-100 dark:bg-slate-800 text-primary font-bold'
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const displayValue = value ? formatDate(value) : '';

  return (
    <div ref={datePickerRef} className={cn('relative', className)}>
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
          'h-11 text-sm'
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span className={cn(
            'truncate',
            !displayValue && 'text-slate-400'
          )}>
            {displayValue || placeholder}
          </span>
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 animate-in zoom-in-95 fade-in slide-in-from-top-1 duration-200"
          style={{ width: showTimeSelect ? '320px' : '280px' }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="h-9 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Time Selection */}
          {showTimeSelect && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateSelect(today.getDate());
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
              }}
              className="flex-1 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                if (onChange) onChange(null);
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}