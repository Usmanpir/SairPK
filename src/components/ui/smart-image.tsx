'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Curated landscape gradients (sky → valley) so fallbacks still feel like scenery.
const PALETTES = [
  ['#0f4c3a', '#1f7a5a', '#f2b541'],
  ['#12324a', '#2b6f8f', '#f4c979'],
  ['#3b2a4d', '#8a4f6d', '#f3a65a'],
  ['#0e3b43', '#2d8a7f', '#e8d17a'],
  ['#1d3557', '#457b9d', '#f1c27d'],
  ['#2f3e1f', '#6b8f3a', '#f5c451']
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Branded mountain-scene placeholder, deterministic per `seed`. */
export function SceneFallback({ seed, className }: { seed: string; className?: string }) {
  const [sky, valley, sun] = PALETTES[hash(seed) % PALETTES.length];
  const id = `g${hash(seed)}`;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor={valley} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-sky)`} />
      <circle cx="300" cy="90" r="38" fill={sun} opacity="0.9" />
      <path d="M0 210 70 120 120 170 190 80 260 175 310 130 400 200V300H0Z" fill="#fff" opacity="0.14" />
      <path d="M190 80 212 110 196 118 176 100Z" fill="#fff" opacity="0.5" />
      <path d="M0 240 90 170 160 220 240 150 330 225 400 190V300H0Z" fill="#000" opacity="0.22" />
      <path d="M0 270 110 225 210 262 300 230 400 258V300H0Z" fill="#000" opacity="0.3" />
    </svg>
  );
}

/**
 * <img> that swaps to a scenic SVG placeholder if the source is missing or
 * fails to load (e.g. a retired image CDN), so cards never render blank.
 */
export function SmartImage({
  src,
  alt,
  seed,
  className
}: {
  src?: string | null;
  alt: string;
  seed?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLImageElement>(null);

  // An image that errored before hydration never fires React's onError.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || !src) return <SceneFallback seed={seed ?? alt} className={className} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  );
}
