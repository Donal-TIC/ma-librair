const headersSecurite = [
  { key: 'X-Frame-Options', value: 'DENY' },                         // anti-clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },                // anti sniffing MIME
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(), microphone=()' }, // camera=self requis pour le scan code-barre
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // masque l'en-tête "X-Powered-By: Next.js" (moins d'infos données à un attaquant)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: headersSecurite }];
  },
};

module.exports = nextConfig;
