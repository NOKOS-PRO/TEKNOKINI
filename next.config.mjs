/** @type {import('next').NextConfig} */
const supabaseProjectHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle for Docker/VPS (Dokploy). Vercel ignores it.
  output: "standalone",
  images: {
    // Featured images and media are served from Supabase Storage.
    // Falls back to no remote patterns during build if env var isn't set yet.
    remotePatterns: [
      // Foto stok yang dipilih bot (lib/services/stock-photo.ts).
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...(supabaseProjectHost
        ? [
            {
              protocol: "https",
              hostname: supabaseProjectHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
