import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { userService, type LoginHistoryEntry, type UserSession } from '../services/userService';
import { toast } from 'sonner';
import { History, LogOut, X } from 'lucide-react';

type Props = {
  open: boolean;
  userId: string;
  displayName: string;
  onClose: () => void;
};

export function UserSecurityOversightModal({ open, userId, displayName, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['adminUserLoginHistory', userId],
    queryFn: () => userService.getUserLoginHistoryAdmin(userId, 40),
    enabled: open && !!userId,
  });

  const { data: sessionsRes, isLoading: sessionsLoading } = useQuery({
    queryKey: ['adminUserSessions', userId],
    queryFn: () => userService.getUserSessionsAdmin(userId),
    enabled: open && !!userId,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => userService.revokeUserSessionAdmin(userId, sessionId),
    onSuccess: () => {
      toast.success('Session revoked for user');
      void queryClient.invalidateQueries({ queryKey: ['adminUserSessions', userId] });
    },
    onError: () => toast.error('Could not revoke session'),
  });

  if (!open) return null;

  const entries: LoginHistoryEntry[] = historyRes?.data ?? [];
  const sessions: UserSession[] = sessionsRes?.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oversight-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-card p-6 shadow-lg border">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="oversight-title" className="text-xl font-semibold">
              Security overview
            </h2>
            <p className="text-sm text-muted-foreground">{displayName}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <section className="mb-8" aria-labelledby="sessions-heading">
          <h3 id="sessions-heading" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <LogOut className="h-4 w-4" />
            Active sessions
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Refresh-token sessions for this user. Revoke if a device should be signed out.
          </p>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Started (UTC)</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-3 py-2 font-medium">Last use</th>
                    <th className="px-3 py-2 font-medium">IP</th>
                    <th className="px-3 py-2 font-medium w-[1%]" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-border/60">
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(s.expiresAt).toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 max-w-[120px] truncate" title={s.userAgent ?? ''}>
                        {s.ipAddress ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => revokeMutation.mutate(s.id)}
                          disabled={revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="history-heading">
          <h3 id="history-heading" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4" />
            Sign-in history
          </h3>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No login events recorded.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Time (UTC)</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                    <th className="px-3 py-2 font-medium">IP</th>
                    <th className="px-3 py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{row.isSuccessful ? 'OK' : 'Failed'}</td>
                      <td className="px-3 py-2">{row.ipAddress}</td>
                      <td className="px-3 py-2 max-w-xs truncate text-muted-foreground" title={row.userAgent}>
                        {row.failureReason || row.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
