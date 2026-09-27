import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DOGFOOD - Autonomous Hackathon Evaluation Platform",
  description: "Modern hackathon evaluation, peer review, and automated score calibration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
        {/* Navbar is handled per-layout for dashboard/events routes */}
        <Navbar />
        <main className="flex-1">{children}</main>
        {/* Footer hides itself for organizer/judge via role check */}
        <Footer />
      </body>
    </html>
  );
}
