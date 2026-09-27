"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredUser, fetchCurrentUser } from "../lib/auth";

export default function Footer() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) {
      setRole(user.role);
    }
    fetchCurrentUser().then((u) => {
      if (u?.role) setRole(u.role);
    });
  }, []);

  // The footer is shown on all visitor and public user routes (/, /hackathons, /projects, /results, /about, /events, etc.)
  // It is only omitted on internal console/dashboard workspace screens where sidebars or full consoles are active.
  const isDashboardWorkspace =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/events/new" ||
    pathname.startsWith("/organizer") ||
    pathname.startsWith("/judge");

  if (isDashboardWorkspace) {
    return null;
  }

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 text-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-black text-2xl tracking-tight text-slate-900">
                DOGFOOD
              </span>
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              The hackathon innovation and evaluation platform. Powered by blind peer review, zero-trust role isolation, and Empirical Bayes score calibration.
            </p>
            <div className="flex items-center space-x-3 text-slate-400">
              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:text-blue-600 cursor-pointer">
                𝕏
              </span>
              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:text-blue-600 cursor-pointer">
                in
              </span>
              <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:text-blue-600 cursor-pointer">
                gh
              </span>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 space-y-0.5">
              <p>📍 Global Developer Network</p>
              <p>✉️ support@dogfood.internal</p>
            </div>
          </div>

          {/* Links column 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Explore
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/hackathons" className="hover:text-blue-600">All Hackathons</Link></li>
              <li><Link href="/events?id=sample-hack-2026" className="hover:text-blue-600">Sample Hack 2026</Link></li>
              <li><Link href="/projects" className="hover:text-blue-600">Project Gallery</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">About DOGFOOD</Link></li>
            </ul>
          </div>

          {/* Links column 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Platform & Tech
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/about" className="hover:text-blue-600">Empirical Bayes Calibration</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">Zero-Trust Role Isolation</Link></li>
              <li><Link href="/events?id=sample-hack-2026&tab=rules" className="hover:text-blue-600">Rules &amp; Eligibility</Link></li>
              <li><Link href="/events?id=sample-hack-2026&tab=prizes" className="hover:text-blue-600">Prizes &amp; Accolades</Link></li>
            </ul>
          </div>

          {/* Links column 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Account
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/login" className="hover:text-blue-600">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-blue-600">Create Account</Link></li>
              <li><Link href="/forgot-password" className="hover:text-blue-600">Reset Password</Link></li>
              <li><Link href="/events?id=sample-hack-2026&tab=faq" className="hover:text-blue-600">Public FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-slate-400 text-[11px]">
          <p>&copy; 2026 DOGFOOD Platform. All rights reserved. Self-Hostable Offline Appliance.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span>Powered by Next.js &amp; FastAPI</span>
            <span>&bull;</span>
            <span>Single Port 8080</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
