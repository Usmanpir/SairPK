'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Sends a JSON request to an /api/admin endpoint and refreshes the server
 * components on success, so tables and totals reflect the change.
 */
export function useAdminMutation() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  async function mutate(url: string, method: 'POST' | 'PATCH' | 'PUT', body: unknown): Promise<unknown | null> {
    setPending(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        setFieldErrors(data.details?.fieldErrors ?? {});
        return null;
      }
      setSaved(true);
      router.refresh();
      return data;
    } catch {
      setError('Network error — please check your connection and try again.');
      return null;
    } finally {
      setPending(false);
    }
  }

  return { mutate, pending, error, fieldErrors, saved, setSaved };
}
