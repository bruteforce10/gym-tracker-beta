import type { Metadata, Viewport } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import DevServiceWorkerReset from "@/components/dev-service-worker-reset";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0F",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  applicationName: "Grynx",
  title: {
    default: "GRYNX - Gym Workout Tracker | Track Your Strength Progress",
    template: "%s | GRYNX",
  },
  description:
    "GRYNX is a free gym workout tracker. Log exercises, track strength progress, view weekly summaries, and build your best. Start training smarter today.",
  keywords: [
    "gym tracker",
    "workout tracker",
    "strength training log",
    "exercise tracker",
    "gym app",
    "fitness tracker",
    "workout log",
    "gym progress tracker",
    "weightlifting tracker",
    "free workout app",
  ],
  authors: [{ name: "Grynx" }],
  creator: "Grynx",
  publisher: "Grynx",
  metadataBase: new URL("https://grynx.app"),
  alternates: {
    canonical: "https://grynx.app",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://grynx.app",
    siteName: "GRYNX",
    title: "GRYNX - Gym Workout Tracker | Track Your Strength Progress",
    description:
      "Free gym workout tracker. Log exercises, track strength progress, and build your best.",
    images: [
      {
        url: "/grynx-logo-horizontal.png",
        width: 1200,
        height: 630,
        alt: "GRYNX - Gym Workout Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GRYNX - Gym Workout Tracker",
    description:
      "Free gym workout tracker. Log exercises, track strength progress, and build your best.",
    images: ["/grynx-logo-horizontal.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grynx",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "3a8KmjePwdvr14tttO55wIGqwdrVKZjnm2U02tjtzuk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Grynx" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#F5F5F7]">
        <DevServiceWorkerReset />
        {children}
      </body>
    </html>
  );
}
