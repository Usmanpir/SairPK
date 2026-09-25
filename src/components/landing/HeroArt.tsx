/**
 * Layered Karakoram-style mountain scene drawn in SVG — no external images,
 * so the hero always renders crisply at any size.
 */
export function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Sky */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_0%,hsl(170_45%_18%)_0%,hsl(var(--ink))_55%)]" />
      <div className="bg-grid-light mask-fade-b absolute inset-0 opacity-60" />

      {/* Sun glow */}
      <div className="absolute right-[12%] top-[14%] h-72 w-72 rounded-full bg-secondary/30 blur-[90px]" />
      <div className="absolute right-[18%] top-[22%] hidden h-24 w-24 animate-float sm:block rounded-full bg-gradient-to-br from-amber-200 to-secondary opacity-90 shadow-[0_0_80px_20px_hsl(var(--secondary)/0.35)]" />
      <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-primary/30 blur-[100px]" />

      {/* Stars */}
      <svg className="absolute inset-x-0 top-0 h-1/2 w-full opacity-70" preserveAspectRatio="none" viewBox="0 0 100 50">
        {[
          [8, 6], [16, 14], [27, 4], [34, 18], [45, 9], [53, 3], [61, 15], [70, 7], [88, 12], [94, 4], [12, 26], [40, 28], [58, 24], [80, 22]
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.18 : 0.12} fill="white" opacity={0.4 + (i % 4) * 0.15} />
        ))}
      </svg>

      {/* Mountains */}
      <svg className="absolute inset-x-0 bottom-0 h-[42%] w-full sm:h-[40%]" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="hero-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(168 30% 32%)" />
            <stop offset="1" stopColor="hsl(166 38% 16%)" />
          </linearGradient>
          <linearGradient id="hero-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(163 44% 20%)" />
            <stop offset="1" stopColor="hsl(164 44% 11%)" />
          </linearGradient>
          <linearGradient id="hero-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(162 50% 12%)" />
            <stop offset="1" stopColor="hsl(164 42% 7%)" />
          </linearGradient>
        </defs>

        {/* Far range with snow caps */}
        <path
          d="M0 300 120 220 210 260 330 120 420 210 520 150 640 250 760 80 880 200 980 140 1100 230 1220 110 1340 200 1440 160V560H0Z"
          fill="url(#hero-far)"
          opacity="0.9"
        />
        <path d="M330 120 362 160 344 170 322 152 300 162Z M760 80 800 132 778 140 756 122 730 136Z M1220 110 1254 152 1232 160 1214 146 1192 156Z" fill="white" opacity="0.8" />

        {/* Mid range */}
        <path
          d="M0 380 140 290 250 350 380 250 500 330 620 270 720 340 860 230 990 330 1110 280 1240 350 1340 300 1440 340V560H0Z"
          fill="url(#hero-mid)"
        />

        {/* Near hills */}
        <path d="M0 460 180 400 340 450 520 390 700 450 900 400 1080 460 1260 410 1440 450V560H0Z" fill="url(#hero-near)" />
      </svg>

      {/* Blend into page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
