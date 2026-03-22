import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, Building2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const mfaSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code').max(10),
});

type MfaFormData = z.infer<typeof mfaSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mfaForm = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
  });

  const applyAuthSuccess = (data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    tenantId: string;
    email: string;
    role: string;
    permissions?: string[];
    forcePasswordChange?: boolean;
  }) => {
    const force = data.forcePasswordChange === true;
    dispatch(
      setCredentials({
        user: {
          userId: data.userId,
          tenantId: data.tenantId,
          email: data.email,
          role: data.role,
          permissions: data.permissions ?? [],
          forcePasswordChangeRequired: force,
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        forcePasswordChangeRequired: force,
      })
    );
    toast.success(force ? 'Set a new password to continue.' : 'Login successful!');
    navigate(force ? '/change-password' : '/dashboard');
  };

  const onLoginSubmit = async (form: LoginFormData) => {
    setLoading(true);
    try {
      const response = await authService.login(form);

      if (!response.success || !response.data) {
        toast.error(response.message || 'Login failed');
        return;
      }

      const d = response.data;

      if (d.mfaRequired && d.mfaChallengeToken) {
        setMfaToken(d.mfaChallengeToken);
        toast.message('Enter the code from your authenticator app');
        return;
      }

      if (d.accessToken && d.refreshToken) {
        applyAuthSuccess({
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          userId: d.userId,
          tenantId: d.tenantId,
          email: d.email,
          role: d.role,
          permissions: d.permissions,
          forcePasswordChange: d.forcePasswordChange,
        });
      }
    } catch {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onMfaSubmit = async (form: MfaFormData) => {
    if (!mfaToken) return;
    setLoading(true);
    try {
      const response = await authService.verifyMfa(mfaToken, form.code.replace(/\s/g, ''));
      if (!response.success || !response.data?.accessToken) {
        toast.error(response.message || 'Invalid code');
        return;
      }
      const d = response.data;
      applyAuthSuccess({
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
        userId: d.userId,
        tenantId: d.tenantId,
        email: d.email,
        role: d.role,
        permissions: d.permissions,
        forcePasswordChange: d.forcePasswordChange,
      });
    } catch {
      toast.error('Verification failed');
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
            Digital hospital operations — sign in with your tenant and credentials
          </p>
        </div>

        <Card className="w-full border-border/80 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-1 pb-4 text-center sm:text-left">
            <CardTitle className="text-xl font-semibold">
              {!mfaToken ? 'Welcome back' : 'Verify your identity'}
            </CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              {!mfaToken
                ? 'Enter your tenant ID, email, and password to continue.'
                : 'Enter the code from your authenticator app.'}
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            {!mfaToken ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="tenantId" className="text-foreground">
                    Tenant ID
                  </Label>
                  <div className="relative">
                    <Building2
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="tenantId"
                      type="text"
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      className="h-11 pl-10"
                      autoComplete="organization"
                      {...loginForm.register('tenantId')}
                    />
                  </div>
                  {loginForm.formState.errors.tenantId && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.tenantId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@hospital.com"
                      className="h-11 pl-10"
                      autoComplete="email"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11 pl-10"
                      autoComplete="current-password"
                      {...loginForm.register('password')}
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="h-11 w-full text-base font-semibold shadow-sm" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/40 p-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    Multi-factor authentication is enabled. Open your authenticator app and enter the current code.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-foreground">
                    Authenticator code
                  </Label>
                  <Input
                    id="code"
                    className="h-11 text-center text-lg tracking-[0.35em] placeholder:tracking-normal"
                    placeholder="000000"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={10}
                    {...mfaForm.register('code')}
                  />
                  {mfaForm.formState.errors.code && (
                    <p className="text-sm text-destructive">{mfaForm.formState.errors.code.message}</p>
                  )}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1"
                    onClick={() => setMfaToken(null)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="h-11 flex-1 font-semibold" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify & continue'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MedLedger · Secure access for authorized staff only
        </p>
      </div>
    </div>
  );
}
