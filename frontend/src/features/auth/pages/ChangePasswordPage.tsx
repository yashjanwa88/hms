import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, KeyRound, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const res = await authService.changePassword(values.currentPassword, values.newPassword);
      if (!res.success) {
        toast.error(res.message || 'Could not update password');
        return;
      }

      const rt = localStorage.getItem('refreshToken');
      if (!rt) {
        toast.error('Session missing. Please sign in again.');
        navigate('/login', { replace: true });
        return;
      }

      const refreshed = await authService.refreshToken(rt);
      if (!refreshed.success || !refreshed.data?.accessToken) {
        toast.error(refreshed.message || 'Password updated but session refresh failed. Sign in again.');
        navigate('/login', { replace: true });
        return;
      }

      const d = refreshed.data;
      const force = d.forcePasswordChange === true;
      dispatch(
        setCredentials({
          user: {
            userId: d.userId,
            tenantId: d.tenantId,
            email: d.email,
            role: d.role,
            permissions: d.permissions ?? [],
            forcePasswordChangeRequired: force,
          },
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          forcePasswordChangeRequired: force,
        })
      );
      toast.success('Password updated.');
      navigate('/dashboard', { replace: true });
    } catch {
      // Error toast from api interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--muted)/0.35),transparent_40%)]"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/10">
            <Activity className="h-7 w-7" strokeWidth={2.25} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <span className="text-primary">MedLedger</span>
            <span className="font-semibold text-muted-foreground"> Hospital</span>
          </h1>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Your administrator requires a new password before you can continue.
          </p>
        </div>

        <Card className="w-full border-border/80 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-1 pb-4 text-center sm:text-left">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <KeyRound className="h-5 w-5 text-primary" aria-hidden />
              Change password
            </CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Choose a strong password you have not used here before.
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    className="h-11 pl-10"
                    {...form.register('currentPassword')}
                  />
                </div>
                {form.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className="h-11 pl-10"
                    {...form.register('newPassword')}
                  />
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="h-11 pl-10"
                    {...form.register('confirmPassword')}
                  />
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
