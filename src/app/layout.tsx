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
  title: "GRYNX - Track Your Strength. Build Your Best.",
  description:
    "GRYNX helps you track strength progress, log workouts, and build your best with clear weekly summaries.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grynx",
  },
  formatDetection: {
    telephone: false,
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
