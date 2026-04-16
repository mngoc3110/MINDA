import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const outfit = Inter({
  variable: "--font-outfit",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "MINDA | AI-Powered Learning Center",
  description: "Next Generation Interactive Learning Management System",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MINDA",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/logo.png",
    apple: "/icons/icon-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased scroll-smooth`} suppressHydrationWarning>
      <body className="font-outfit min-h-screen bg-bg-main text-text-primary flex flex-col">
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

