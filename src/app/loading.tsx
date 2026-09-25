export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
      </div>
    </div>
  );
}
