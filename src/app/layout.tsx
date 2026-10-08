import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PANS Courseware Hub | Pharmacy Academic Repository & Past Questions",
  description: "Curated lecture notes, official past questions, and student-led video tutorials structured for every pharmacy student from 100L to 600L.",
  icons: {
    icon: "/assets/pans_academic_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8f9ff] text-[#0b1c30]">{children}</body>
    </html>
  );
}
