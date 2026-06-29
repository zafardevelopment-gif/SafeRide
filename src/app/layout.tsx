import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SafeRide QR — Smart Vehicle Protection",
    template: "%s | SafeRide QR",
  },
  description:
    "Protect your vehicle with a smart QR sticker. Get instant alerts when someone scans your bike, car or scooter. Made for India.",
  keywords: ["vehicle safety", "QR sticker", "bike safety", "India", "emergency alert"],
  authors: [{ name: "SafeRide QR" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SafeRide QR",
  },
  openGraph: {
    type: "website",
    siteName: "SafeRide QR",
    title: "SafeRide QR — Smart Vehicle Protection",
    description: "Protect your vehicle with a smart QR sticker.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
