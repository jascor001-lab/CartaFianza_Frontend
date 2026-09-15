import type { NextConfig } from "next";
// @ts-expect-error next-pwa no tipado oficial compatible con Next 16
import withPWAInit from "next-pwa";

const apiOrigin =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4006";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  // En desarrollo el SW suele romper el login por IP; PWA en build/prod o npm run dev:https
  disable:
    process.env.DISABLE_PWA === "true" ||
    process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  // En dev el fallback a /offline rompe el login (navegación falla → “offline” silencioso)
  fallbacks:
    process.env.NODE_ENV === "production"
      ? { document: "/offline" }
      : undefined,
  runtimeCaching: [
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkOnly",
      options: {
        cacheName: "cfm-api-proxy",
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cfm-google-fonts",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cfm-next-static",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\/icons\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cfm-icons",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 60 * 24 * 60,
        },
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "cfm-pages",
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/auth") || url.pathname.startsWith("/users"),
      handler: "NetworkOnly",
      options: {
        cacheName: "cfm-api-auth",
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Permite HMR/assets de desarrollo desde la IP de red
  allowedDevOrigins: ["192.168.7.223", "localhost", "127.0.0.1"],
  async rewrites() {
    // Solo proxy de rutas Nest. /api/web-login y /api/web-users quedan en Next.
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiOrigin}/auth/:path*`,
      },
      {
        source: "/api/users",
        destination: `${apiOrigin}/users`,
      },
      {
        source: "/api/users/:id",
        destination: `${apiOrigin}/users/:id`,
      },
    ];
  },
};

export default withPWA(nextConfig);
