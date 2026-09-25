'use client';

import { useState } from 'react';
import { NativeSelect } from '@/components/ui/native-select';
import { humanize } from '@/lib/admin/format';
import { HOTEL_STATUSES } from '@/lib/validation/admin';
import { useAdminMutation } from './useAdminMutation';

/** Inline status + manager pickers for one hotel row; each change saves immediately. */
export function HotelControls({
  hotelId,
  status,
  managerId,
  managers
}: {
  hotelId: string;
  status: string;
  managerId: string | null;
  managers: { id: string; name: string }[];
}) {
  const { mutate, pending, error } = useAdminMutation();
  const [value, setValue] = useState({ status, managerId: managerId ?? '' });

  async function save(patch: Partial<typeof value>) {
    const previous = value;
    setValue({ ...value, ...patch });
    const body = 'managerId' in patch ? { managerId: patch.managerId || null } : { status: patch.status };
    // Put the picker back if the server rejected the change.
    if (!(await mutate(`/api/admin/hotels/${hotelId}`, 'PATCH', body))) setValue(previous);
  }

  return (
    <div className="flex min-w-[20rem] flex-col gap-1.5">
      <div className="flex gap-2">
        <NativeSelect
          aria-label="Hotel status"
          className="h-9"
          value={value.status}
          disabled={pending}
          onChange={(e) => save({ status: e.target.value })}
        >
          {HOTEL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Hotel manager"
          className="h-9"
          value={value.managerId}
          disabled={pending}
          onChange={(e) => save({ managerId: e.target.value })}
        >
          <option value="">No manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
