import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  userId: string;
  displayName: string;
  onClose: () => void;
};

export function AdminResetPasswordModal({ open, userId, displayName, onClose }: Props) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [requireChange, setRequireChange] = useState(true);

  const mutation = useMutation({
    mutationFn: () => userService.adminResetPassword(userId, password, requireChange),
    onSuccess: () => {
      toast.success('Password updated. User must sign in again on all devices.');
      setPassword('');
      setConfirm('');
      setRequireChange(true);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['adminUserSessions', userId] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Could not reset password');
    },
  });

  if (!open) return null;

  const canSubmit =
    password.length >= 8 && password === confirm && !mutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pw-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="reset-pw-title" className="text-lg font-semibold">
              Set new password
            </h2>
            <p className="text-sm text-muted-foreground">{displayName}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Meets tenant password policy. This signs the user out everywhere (all refresh sessions revoked).
        </p>

        <div className="space-y-3">
          <div>
            <Label htmlFor="admin-new-pw">New password</Label>
            <Input
              id="admin-new-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admin-confirm-pw">Confirm password</Label>
            <Input
              id="admin-confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireChange}
              onChange={(e) => setRequireChange(e.target.checked)}
            />
            Require password change on next sign-in
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </div>
    </div>
  );
}
