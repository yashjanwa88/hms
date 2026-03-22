import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, Building2, Lock, Mail, ShieldCheck, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '../services/authService';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation();
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
    <div className="flex min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Left Side: Illustration & Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-12 lg:flex">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-600/20 blur-[100px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Activity className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">MedLedger</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
            Next-Gen <span className="text-primary underline underline-offset-8 decoration-4">Digital</span> Health Infrastructure.
          </h2>
          <p className="mt-6 text-xl text-slate-400 font-medium">
            Empowering healthcare providers with world-class automation, security, and patient-centric tools.
          </p>
          
          <div className="mt-12 space-y-6">
            {[
              'Enterprise-Grade Security (HIPAA/GDPR)',
              'Multi-Tenant Global Deployment',
              'Integrated EMR & Lab Management',
              'Real-time Financial Analytics'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 border-t border-slate-800 pt-8 text-slate-500">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Secure Bank-Level Encryption</span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex lg:hidden mb-6 h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Activity className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {!mfaToken ? t('common.welcome') : t('auth.mfa_verify')}
            </h3>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
              {!mfaToken 
                ? 'Sign in to access your medical facility dashboard.' 
                : 'Your account is protected by MFA. Please enter your code.'}
            </p>
          </div>

          {!mfaToken ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tenantId" className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Facility Tenant ID
                </Label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="tenantId"
                    placeholder="e.g. facility-alpha-01"
                    className="pl-11 h-12 border-slate-200 dark:border-slate-800 focus:border-primary transition-all"
                    {...loginForm.register('tenantId')}
                  />
                </div>
                {loginForm.formState.errors.tenantId && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{loginForm.formState.errors.tenantId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Staff Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@hospital.com"
                    className="pl-11 h-12 border-slate-200 dark:border-slate-800 focus:border-primary transition-all"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Security Password
                  </Label>
                  <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-12 border-slate-200 dark:border-slate-800 focus:border-primary transition-all"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-black shadow-xl shadow-primary/20 group" 
                disabled={loading}
              >
                {loading ? 'Authenticating Staff...' : (
                  <span className="flex items-center justify-center gap-2">
                    {t('common.login')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={mfaForm.handleSubmit(onMfaSubmit)} className="space-y-6">
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-5 border border-blue-100 dark:border-blue-800">
                <div className="flex gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    Two-factor authentication is active. Please enter the secure code from your device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  className="h-14 text-center text-3xl font-black tracking-[0.5em] border-slate-200 dark:border-slate-800"
                  placeholder="000000"
                  maxLength={6}
                  {...mfaForm.register('code')}
                />
                {mfaForm.formState.errors.code && (
                  <p className="text-xs font-bold text-rose-500 mt-1">{mfaForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={() => setMfaToken(null)}
                >
                  Go Back
                </Button>
                <Button type="submit" className="flex-1 h-12 font-black shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? 'Verifying...' : 'Confirm Identity'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              © {new Date().getFullYear()} MedLedger Global HMS. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
