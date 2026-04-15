import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const bgColor = name
    ? `bg-gradient-to-br from-primary/80 to-primary`
    : 'bg-slate-200 dark:bg-slate-700';

  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
    >
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-bold text-white',
          sizeClasses[size],
          src ? '' : bgColor
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900',
            statusColors[status],
            size === 'xs' ? 'h-2 w-2' :
            size === 'sm' ? 'h-2.5 w-2.5' :
            size === 'md' ? 'h-3 w-3' :
            size === 'lg' ? 'h-3.5 w-3.5' :
            'h-4 w-4'
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

// Avatar Group component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white dark:ring-slate-900"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}