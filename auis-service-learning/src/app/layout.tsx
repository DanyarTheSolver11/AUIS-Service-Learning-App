import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AUIS Volunteering Hours Tracker",
  description: "Track, confirm, and manage AUIS student volunteering hours",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-parchment-50 font-body text-ink-900 antialiased">
        <div className="pointer-events-none fixed inset-0 z-50 bg-grain" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
