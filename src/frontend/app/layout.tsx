import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/ToastProvider";

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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <ToastProvider />
        {/* Navbar is handled per-layout for dashboard/events routes */}
        <Navbar />
        <main className="flex-1 bg-slate-50">{children}</main>
        {/* Footer hides itself for organizer/judge via role check */}
        <Footer />
      </body>
    </html>
  );
}
