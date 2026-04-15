import { ReactNode, ComponentType } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string | ReactNode;
  icon?: ComponentType<{ className?: string }>;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: ReactNode;
  className?: string;
}

const variantConfig = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-300',
    iconColor: 'text-blue-500',
    defaultIcon: Info,
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
    defaultIcon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-300',
    iconColor: 'text-amber-500',
    defaultIcon: AlertTriangle,
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-900 dark:text-rose-300',
    iconColor: 'text-rose-500',
    defaultIcon: AlertCircle,
  },
};

export function Alert({
  variant = 'info',
  title,
  message,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  actions,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.defaultIcon;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        {showIcon && (
          <div className="shrink-0">
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-bold text-sm mb-1', config.text)}>
              {title}
            </h4>
          )}
          
          {message && (
            <div className={cn('text-sm', config.text, 'opacity-80')}>
              {message}
            </div>
          )}
          
          {actions && (
            <div className="flex gap-2 mt-3">
              {actions}
            </div>
          )}
        </div>

        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className={cn('shrink-0 -mr-2 -mt-2 h-6 w-6', config.iconColor)}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Inline Alert (smaller, for inline messages)
interface InlineAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  message: string | ReactNode;
  className?: string;
}

export function InlineAlert({
  variant = 'info',
  message,
  className,
}: InlineAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.defaultIcon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm font-medium',
        config.text,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-4 w-4 shrink-0', config.iconColor)} />
      <span>{message}</span>
    </div>
  );
}