import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // La caisse doit rester utilisable pendant une micro-coupure réseau :
  // les assets applicatifs sont mis en cache ; les données restent servies
  // en direct depuis Supabase (pas de synchronisation offline dans cette v1,
  // voir README > « Mode hors ligne »).
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
