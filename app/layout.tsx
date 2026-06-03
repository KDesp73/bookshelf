import type { Metadata, Viewport } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth/session-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Analytics } from "@vercel/analytics/next"
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
  themeColor: "#f6f1ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${sourceSans.variable} h-full`}>
      <body className="min-h-full bg-[#f6f1ea] font-sans text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <AuthProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-6 sm:py-6">{children}</main>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
