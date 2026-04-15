import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'custom';
  customColor?: string;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside';
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  custom: '',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  customColor,
  showLabel = false,
  labelPosition = 'outside',
  animated = true,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const fillColor = color === 'custom' ? customColor : colorClasses[color];

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillColor,
            animated && 'animate-pulse',
            labelPosition === 'inside' && size !== 'sm' && 'flex items-center justify-center px-2'
          )}
          style={{ width: `${percentage}%` }}
        >
          {labelPosition === 'inside' && showLabel && size !== 'sm' && (
            <span className="text-[10px] font-bold text-white whitespace-nowrap">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {value}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Circular Progress component
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  strokeWidth?: number;
  className?: string;
}

const circularSizeClasses = {
  sm: 48,
  md: 64,
  lg: 96,
};

const circularStrokeWidth = {
  sm: 4,
  md: 6,
  lg: 8,
};

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = true,
  label,
  strokeWidth: customStrokeWidth,
  className,
}: CircularProgressProps) {
  const dimension = circularSizeClasses[size];
  const stroke = customStrokeWidth || circularStrokeWidth[size];
  const radius = (dimension - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-all duration-700 ease-out',
            colorClasses[color]
          )}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-slate-900 dark:text-white">
            {percentage.toFixed(0)}%
          </span>
          {label && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}