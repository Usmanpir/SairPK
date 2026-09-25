import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <div
        className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm font-medium text-destructive"
        role="alert"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {success}
      </div>
    );
  }
  return null;
}
