import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="container relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-primary ring-8 ring-primary/5">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-8 font-display text-7xl font-medium italic text-primary sm:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">This trail doesn&apos;t lead anywhere</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The page you&apos;re looking for may have moved, or never existed. Let&apos;s get you back on the map.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/hotels">Browse hotels</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
