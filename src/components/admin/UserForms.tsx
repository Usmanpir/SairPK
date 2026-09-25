'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { ROLE_LABELS, type Role } from '@/lib/roles';
import { FormMessage } from './FormMessage';
import { useAdminMutation } from './useAdminMutation';

export function CreateUserForm({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const { mutate, pending, error, fieldErrors } = useAdminMutation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER', password: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = (await mutate('/api/admin/users', 'POST', form)) as { id: string } | null;
    if (data) router.push(`/admin/users/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required leftIcon={<User />} value={form.name} onChange={set('name')} error={fieldErrors.name?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required leftIcon={<Mail />} value={form.email} onChange={set('email')} error={fieldErrors.email?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" leftIcon={<Phone />} placeholder="+923001234567" value={form.phone} onChange={set('phone')} error={fieldErrors.phone?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <NativeSelect id="role" value={form.role} onChange={set('role')}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="password">Temporary password</Label>
          <Input
            id="password"
            type="text"
            required
            minLength={8}
            autoComplete="new-password"
            leftIcon={<Lock />}
            value={form.password}
            onChange={set('password')}
            error={fieldErrors.password?.[0]}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters. Share it securely and ask them to change it.</p>
        </div>
      </div>
      <FormMessage error={error} />
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Create account
        </Button>
      </div>
    </form>
  );
}

export function EditUserForm({
  user,
  roles,
  isSelf,
  canEdit
}: {
  user: { id: string; name: string; email: string; phone: string | null; role: Role; isActive: boolean };
  roles: Role[];
  isSelf: boolean;
  canEdit: boolean;
}) {
  const { mutate, pending, error, fieldErrors, saved } = useAdminMutation();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.role });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // The current role is always shown, even if this actor couldn't assign it themselves.
  const roleOptions = roles.includes(user.role) ? roles : [user.role, ...roles];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate(`/api/admin/users/${user.id}`, 'PATCH', form);
      }}
      className="space-y-5"
    >
      <fieldset disabled={!canEdit} className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required leftIcon={<User />} value={form.name} onChange={set('name')} error={fieldErrors.name?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required leftIcon={<Mail />} value={form.email} onChange={set('email')} error={fieldErrors.email?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" leftIcon={<Phone />} placeholder="+923001234567" value={form.phone} onChange={set('phone')} error={fieldErrors.phone?.[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <NativeSelect id="role" value={form.role} onChange={set('role')} disabled={isSelf}>
            {roleOptions.map((r) => (
              <option key={r} value={r} disabled={r !== user.role && !roles.includes(r)}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
          {isSelf && <p className="text-xs text-muted-foreground">You can&apos;t change your own role.</p>}
        </div>
      </fieldset>
      <FormMessage error={error} success={saved ? 'Account details saved.' : null} />
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}

export function AccountAccessControls({ userId, isActive, isSelf }: { userId: string; isActive: boolean; isSelf: boolean }) {
  const status = useAdminMutation();
  const reset = useAdminMutation();
  const [password, setPassword] = useState('');

  async function toggleActive() {
    const verb = isActive ? 'Suspend' : 'Reactivate';
    if (!window.confirm(`${verb} this account?${isActive ? ' They will no longer be able to log in.' : ''}`)) return;
    await status.mutate(`/api/admin/users/${userId}`, 'PATCH', { isActive: !isActive });
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (await reset.mutate(`/api/admin/users/${userId}`, 'PATCH', { password })) setPassword('');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={resetPassword} className="space-y-3">
        <Label htmlFor="new-password">Set a new password</Label>
        <Input
          id="new-password"
          type="text"
          minLength={8}
          required
          autoComplete="new-password"
          leftIcon={<KeyRound />}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={reset.fieldErrors.password?.[0]}
        />
        <FormMessage error={reset.error} success={reset.saved ? 'Password updated.' : null} />
        <Button type="submit" variant="outline" className="w-full" loading={reset.pending}>
          Reset password
        </Button>
      </form>

      {!isSelf && (
        <div className="space-y-3 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            {isActive
              ? 'Suspending blocks new logins. Existing bookings are kept.'
              : 'This account is suspended and cannot log in.'}
          </p>
          <FormMessage error={status.error} />
          <Button
            type="button"
            variant={isActive ? 'destructive' : 'default'}
            className="w-full"
            onClick={toggleActive}
            loading={status.pending}
          >
            {isActive ? 'Suspend account' : 'Reactivate account'}
          </Button>
        </div>
      )}
    </div>
  );
}
