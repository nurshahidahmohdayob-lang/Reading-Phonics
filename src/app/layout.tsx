import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGate from "@/components/AuthGate";
import InstallApp from "@/components/InstallApp";
import ServiceWorker from "@/components/ServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#A6D9FF",
};

export const metadata: Metadata = {
  title: "Phonics Pals & Guided Reading",
  description:
    "Playful phonics plus read-aloud guided reading with a friendly coach.",
  applicationName: "Phonics Pals",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // Home-screen behaviour on iPhone and iPad: its own window, no browser bars.
  appleWebApp: {
    capable: true,
    title: "Phonics Pals",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthGate>{children}</AuthGate>
        <InstallApp />
        <ServiceWorker />
      </body>
    </html>
  );
}
