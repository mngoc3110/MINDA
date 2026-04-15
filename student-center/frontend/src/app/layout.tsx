import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

const outfit = Inter({
  variable: "--font-outfit",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "MINDA | AI-Powered Learning Center",
  description: "Next Generation Interactive Learning Management System",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
