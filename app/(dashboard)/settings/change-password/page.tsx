'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => router.back(), 1500);
  }

  return (
    <div className="p-5 md:p-10 md:pl-12">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-card flex h-9 w-9 items-center justify-center rounded-lg text-foreground"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-foreground">Change Password</h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-lg flex-col gap-5">
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            ✅ Password updated successfully
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
          <p className="text-xs text-foreground-secondary">At least 8 characters with a mix of letters and numbers</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
        </div>

        <button
          type="submit"
          disabled={saving || success}
          className="btn-primary-gradient rounded-lg py-3 text-base font-semibold"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
