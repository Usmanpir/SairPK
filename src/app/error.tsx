'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-2xl py-20">
      <EmptyState
        tone="error"
        icon={<AlertTriangle />}
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. Please try again in a moment."
        action={
          <>
            <Button onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
