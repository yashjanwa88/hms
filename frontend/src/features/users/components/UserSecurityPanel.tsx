import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { userService, type LoginHistoryEntry, type MfaEnrollmentResult, type UserSession } from '../services/userService';
import { toast } from 'sonner';
import { History, ShieldCheck, Copy, MonitorSmartphone, LogOut } from 'lucide-react';

/**
 * Login history + MFA enrollment for the signed-in user (enterprise session visibility).
 */
export function UserSecurityPanel() {
  const queryClient = useQueryClient();
  const [mfaPayload, setMfaPayload] = useState<MfaEnrollmentResult | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['loginHistory'],
    queryFn: () => userService.getLoginHistory(40),
  });

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: () => userService.getActiveSessions(),
  });

  const entries: LoginHistoryEntry[] = historyRes?.data ?? [];
  const sessions: UserSession[] = sessionsRes?.data ?? [];

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => userService.revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Session ended');
      void queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: () => toast.error('Could not revoke session'),
  });

  const enrollMutation = useMutation({
    mutationFn: () => userService.startMfaEnrollment(),
    onSuccess: (apiRes: { data?: MfaEnrollmentResult }) => {
      const payload = apiRes?.data;
      if (payload?.otpAuthUri) {
        setMfaPayload(payload);
        toast.message('Scan the QR in your authenticator app or use the manual key.');
      }
    },
    onError: () => toast.error('Could not start MFA enrollment'),
  });

  const confirmMutation = useMutation({
    mutationFn: (code: string) => userService.confirmMfaEnrollment(code),
    onSuccess: () => {
      toast.success('MFA enabled');
      setMfaPayload(null);
      setMfaCode('');
      queryClient.invalidateQueries({ queryKey: ['loginHistory'] });
    },
    onError: () => toast.error('Invalid code — try again'),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Multi-factor authentication (TOTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use an authenticator app (Google Authenticator, Microsoft Authenticator, etc.). After enabling, sign-in will ask for a code.
          </p>
          {!mfaPayload ? (
            <Button type="button" variant="outline" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Starting…' : 'Start MFA setup'}
            </Button>
          ) : (
            <div className="space-y-3 rounded-md border p-4">
              <p className="text-sm font-medium">1. Add account in your app using this link or key:</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded bg-muted px-2 py-1 text-xs">{mfaPayload.manualEntryKeyBase32}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Copy manual key"
                  onClick={() => {
                    void navigator.clipboard.writeText(mfaPayload.manualEntryKeyBase32);
                    toast.success('Key copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <a
                href={mfaPayload.otpAuthUri}
                className="text-sm text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                Open otpauth link (mobile)
              </a>
              <div className="space-y-2">
                <Label htmlFor="mfa-confirm">2. Enter 6-digit code to confirm</Label>
                <div className="flex gap-2">
                  <Input
                    id="mfa-confirm"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                  />
                  <Button type="button" onClick={() => confirmMutation.mutate(mfaCode.trim())} disabled={mfaCode.trim().length < 6}>
                    Confirm
                  </Button>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMfaPayload(null)}>
                Cancel setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MonitorSmartphone className="h-5 w-5" />
            Active sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Each row is a signed-in device or browser (refresh token). Revoke any session you do not recognize.
          </p>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other active refresh sessions (or all expired).</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Started (UTC)</th>
                    <th className="py-2 pr-2 font-medium">Expires</th>
                    <th className="py-2 pr-2 font-medium">Last use</th>
                    <th className="py-2 pr-2 font-medium">IP</th>
                    <th className="py-2 font-medium w-[1%]" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-border/60">
                      <td className="py-2 pr-2 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">{new Date(s.expiresAt).toLocaleString()}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 pr-2 max-w-[140px] truncate" title={s.userAgent ?? ''}>
                        {s.ipAddress ?? '—'}
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`Revoke session from ${s.ipAddress ?? 'unknown IP'}`}
                          onClick={() => revokeSessionMutation.mutate(s.id)}
                          disabled={revokeSessionMutation.isPending}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Sign-in history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No login events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Time (UTC)</th>
                    <th className="py-2 pr-2 font-medium">Result</th>
                    <th className="py-2 pr-2 font-medium">IP</th>
                    <th className="py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 pr-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-2">{row.isSuccessful ? 'OK' : 'Failed'}</td>
                      <td className="py-2 pr-2">{row.ipAddress}</td>
                      <td className="py-2 max-w-xs truncate text-muted-foreground" title={row.userAgent}>
                        {row.failureReason || row.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
