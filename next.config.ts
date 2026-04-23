import type { NextConfig } from "next";
import withPWA, { runtimeCaching as defaultRuntimeCaching } from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";
const pwaEnabledInDev = process.env.ENABLE_DEV_PWA === "true";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/grynx-logo.webp",
        search: "",
      },
      {
        pathname: "/exercises/images/**",
        search: "",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "gym-fit.s3.fr-par.scw.cloud",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com",
      },
    ],
  },
};

const runtimeCaching = [
  {
    urlPattern: ({ url }: { url: URL }) =>
      url.pathname.startsWith("/api/auth") ||
      url.pathname.startsWith("/api/uploadthing"),
    handler: "NetworkOnly" as const,
    method: "GET" as const,
  },
  {
    urlPattern: ({
      request,
      url,
    }: {
      request: Request;
      url: URL;
    }) =>
      request.destination === "image" &&
      (url.hostname.endsWith(".ufs.sh") ||
        url.hostname === "utfs.io" ||
        url.hostname === "gym-fit.s3.fr-par.scw.cloud" ||
        url.hostname === "ucarecdn.com"),
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "exercise-remote-images",
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      },
    },
  },
  ...defaultRuntimeCaching,
];

export default withPWA({
  dest: "public",
  disable: isDev && !pwaEnabledInDev,
  register: true,
  reloadOnOnline: true,
  cacheStartUrl: false,
  cacheOnFrontEndNav: false,
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    runtimeCaching,
  },
})(nextConfig);
