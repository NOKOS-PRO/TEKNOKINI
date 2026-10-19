import { getCategoryStyle } from "@/lib/config/categories";

/**
 * Sampul cadangan bergaya foto, dipakai bila artikel belum punya gambar utama.
 * Bukan diagram: komposisinya meniru foto bokeh bernada hangat/dingin dengan
 * cahaya lembut, vinyet, dan grain film. Seed yang sama → gambar yang sama,
 * warna dasar mengikuti kategori. SVG murni, tanpa JavaScript klien.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** Geser hue sebuah warna hex sedikit supaya tiap artikel punya nuansa sendiri. */
function shift(hex: string, deg: number, light = 0): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + deg + 360) % 360;
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(Math.min(90, Math.max(8, (l + light) * 100)))}%)`;
}

export function CoverArt({
  seed,
  category,
  width = 400,
  height = 250,
  className = "",
  label,
}: {
  seed: string;
  category?: string | null;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
}) {
  const style = getCategoryStyle(category);
  const r = rng(hash(seed));
  const id = `c${hash(`${seed}-${category ?? ""}-${width}x${height}`)}`;
  const w = width;
  const h = height;
  const min = Math.min(w, h);

  const base = style.hex;
  const warm = shift(base, 150 + r() * 40, 0.12);
  const cool = shift(base, -25 + r() * 50, 0.02);
  const deep = shift(base, 8, -0.38);

  // Gumpalan cahaya besar yang sangat kabur (latar).
  const washes = Array.from({ length: 4 }, (_, i) => ({
    cx: w * (0.1 + r() * 0.8),
    cy: h * (0.1 + r() * 0.8),
    rad: min * (0.55 + r() * 0.5),
    color: i % 2 === 0 ? cool : warm,
    op: 0.35 + r() * 0.3,
  }));

  // Cakram bokeh bertepi lembut.
  const bokeh = Array.from({ length: 11 }, () => ({
    cx: w * r(),
    cy: h * (0.15 + r() * 0.75),
    rad: min * (0.04 + r() * 0.13),
    color: r() > 0.45 ? warm : "#ffffff",
    op: 0.1 + r() * 0.25,
  }));

  const angle = -18 + r() * 36;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={deep} />
          <stop offset="0.55" stopColor={shift(base, -6, -0.22)} />
          <stop offset="1" stopColor="#0a0f1c" />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur-xl`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f(min * 0.14)} />
        </filter>
        <filter id={`${id}-blur-md`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f(min * 0.012)} />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={hash(seed) % 997} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.09" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width={w} height={h} fill={`url(#${id}-bg)`} />

      <g filter={`url(#${id}-blur-xl)`}>
        {washes.map((p, i) => (
          <circle key={`w${i}`} cx={f(p.cx)} cy={f(p.cy)} r={f(p.rad)} fill={p.color} fillOpacity={p.op.toFixed(2)} />
        ))}
      </g>

      <g filter={`url(#${id}-blur-md)`}>
        {bokeh.map((p, i) => (
          <circle key={`b${i}`} cx={f(p.cx)} cy={f(p.cy)} r={f(p.rad)} fill={p.color} fillOpacity={p.op.toFixed(2)} />
        ))}
      </g>

      <rect
        x={f(-w * 0.2)}
        y={f(h * 0.35)}
        width={f(w * 1.4)}
        height={f(h * 0.22)}
        fill={`url(#${id}-streak)`}
        transform={`rotate(${f(angle)} ${f(w / 2)} ${f(h / 2)})`}
        filter={`url(#${id}-blur-md)`}
      />

      <rect width={w} height={h} fill={`url(#${id}-vig)`} />
      <rect width={w} height={h} filter={`url(#${id}-grain)`} />
    </svg>
  );
}
