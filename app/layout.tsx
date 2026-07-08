import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Lora, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth/session-provider";
import { AppHeader } from "@/components/layout/app-header";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { ShelfPresetStyles } from "@/components/shelf/shelf-preset-styles";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Analytics } from "@vercel/analytics/next"
import { EasterEggDetector } from "@/components/easter-eggs/easter-egg-detector";
import { AdSlideshow } from "@/components/layout/ad-slideshow";
import "./globals.css";

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookShelf — Social Library",
  description: "Catalog your books, rate your reads, and discover other readers' collections.",
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BookShelf",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${lora.variable} ${sourceSans.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://covers.openlibrary.org" />
        <link rel="preconnect" href="https://openlibrary.org" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://covers.openlibrary.org" />
        <link rel="dns-prefetch" href="https://openlibrary.org" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <ShelfPresetStyles />
          <AuthProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <AppHeader />
            <AdSlideshow />
            <EasterEggDetector />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-6 sm:py-6">{children}</main>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
