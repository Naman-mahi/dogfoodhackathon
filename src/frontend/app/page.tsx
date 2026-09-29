"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Clock, CheckCircle2, ArrowRight, ShieldCheck, Flame, Users, Trophy } from "lucide-react";
import { fetchEvents, isEventRegistrationOpen, Hackathon } from "@/lib/api";
import { getStoredUser, fetchCurrentUser } from "@/lib/auth";
import { formatDateSafe, parseSafeDate } from "@/lib/dateUtils";

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect authenticated users away from root landing page to their dashboard
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === "organizer") router.replace("/dashboard/organizer");
      else if (user.role === "judge") router.replace("/dashboard/judge");
      else if (user.role === "admin") router.replace("/admin");
      else router.replace("/dashboard");
      return;
    }

    fetchCurrentUser().then((remote) => {
      if (remote) {
        if (remote.role === "organizer") router.replace("/dashboard/organizer");
        else if (remote.role === "judge") router.replace("/dashboard/judge");
        else if (remote.role === "admin") router.replace("/admin");
        else router.replace("/dashboard");
      } else {
        setIsCheckingAuth(false);
      }
    });
  }, [router]);

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        setEvents(data || []);
      })
      .catch((err) => console.error("Failed to load events on home:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalBuilders = events.reduce((sum, e) => sum + (e.participantCount || 0), 0);
  const totalSubmissions = events.reduce((sum, e) => sum + (e.submissionCount || 0), 0);
  const displayedEvents = events.slice(0, 3);

  if (isCheckingAuth && getStoredUser()) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="hero-glow pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center w-full space-y-6">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-widest shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          DOGFOOD HACKATHON EVALUATION PLATFORM
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
          The hackathon platform that <span className="text-blue-600">judges you.</span>
        </h1>

        {/* Script Accent */}
        <div className="script-font text-3xl sm:text-4xl text-slate-800 -rotate-2 font-bold select-none">
          Participate Now!
        </div>

        {/* Subtitle */}
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Fair evaluation scoring, real-time submission tracking, and automated certificate generation for modern engineering competitions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <Link
            href="/hackathons"
            className="w-full sm:w-auto btn-primary"
          >
            Explore Hackathons
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto btn-secondary"
          >
            View Public Gallery
          </Link>
        </div>

        {/* Dynamic Platform Live Counters */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-slate-700">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900">{events.length || 5} Active Hackathons</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-900">{totalBuilders > 0 ? totalBuilders.toLocaleString() : "1,400+"} Builders</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-900">{totalSubmissions > 0 ? totalSubmissions : "40+"} Submissions</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-slate-900">EB k=2.0 Calibrated</span>
          </div>
        </div>

        {/* Trusted By Logos */}
        <div className="pt-10 space-y-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Trusted by leading engineering ecosystems
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-70 grayscale hover:grayscale-0 transition-all text-slate-700 font-bold text-sm">
            <span className="flex items-center gap-1.5 text-base tracking-tight font-black">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </span>
            <span className="font-extrabold text-base tracking-wider text-slate-800">
              AWS
            </span>
            <span className="font-extrabold text-base tracking-tight text-blue-600">
              intel.
            </span>
            <span className="font-semibold text-base flex items-center gap-1">
              <span className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5">
                <span className="bg-red-500 rounded-xs"></span>
                <span className="bg-green-500 rounded-xs"></span>
                <span className="bg-blue-500 rounded-xs"></span>
                <span className="bg-yellow-500 rounded-xs"></span>
              </span>
              Microsoft
            </span>
            <span className="font-black text-base text-blue-800 tracking-tighter">
              DELL
            </span>
            <span className="font-extrabold text-base tracking-tight text-purple-600">
              SOLANA
            </span>
          </div>
        </div>
      </section>

      {/* 2. ONGOING & UPCOMING HACKATHONS (100% DYNAMIC) */}
      <section className="w-full px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Browse Events</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Ongoing &amp; Upcoming Hackathons
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore active competitions and submit your builds for peer-reviewed evaluation.
            </p>
          </div>
          <Link
            href="/hackathons"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all {events.length > 0 ? `(${events.length})` : ""} hackathons with filters &rarr;
          </Link>
        </div>

        {/* Hackathon Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card-modern h-96 animate-pulse bg-slate-100/70" />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="card-modern p-12 text-center text-slate-500 text-sm">
            No active hackathons found. Organizers can create an event via the dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedEvents.map((h) => {
              const regState = isEventRegistrationOpen(h);
              const isUpcoming = h.startDate ? (parseSafeDate(h.startDate)?.getTime() || 0) > Date.now() : false;
              const gradientClass = h.gradient || "from-blue-600 via-indigo-600 to-sky-500";
              const deadlineDate = h.registration_deadline || h.registrationDeadline || h.submissions_close || h.endDate;
              const formattedDeadline = formatDateSafe(deadlineDate, "Open");

              return (
                <div key={h.id || h.slug} className="card-modern overflow-hidden flex flex-col justify-between group">
                  <div>
                    <div className={`h-44 bg-gradient-to-tr ${gradientClass} relative p-4 flex flex-col justify-between text-white`}>
                      <div className="flex justify-between items-center">
                        {isUpcoming ? (
                          <span className="badge-pill bg-blue-500 text-white flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            UPCOMING
                          </span>
                        ) : regState.isOpen ? (
                          <span className="badge-pill bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            LIVE NOW
                          </span>
                        ) : (
                          <span className="badge-pill bg-rose-600 text-white flex items-center gap-1.5 shadow-sm">
                            <Clock className="w-3 h-3" />
                            CLOSED
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-white text-[10px] font-medium">
                          {h.format ? h.format.toUpperCase() : "ONLINE"}
                        </span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-xs rounded-lg p-2 text-white text-xs font-mono">
                        Deadline: {formattedDeadline}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                        {h.categoryLabel || h.category || "General"}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {h.title || h.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {h.tagline || (h.overview && h.overview.description) || "Official hackathon challenge with calibrated peer scoring."}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                        <span className="font-bold text-slate-800">{h.prizeDisplay || "$25,000 USD"}</span>
                        <span>{h.participantCount ? `${h.participantCount.toLocaleString()} Builders` : "Open registration"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex gap-2">
                    <Link
                      href={`/events?id=${h.slug || h.id}`}
                      className="flex-1 text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      Event Details &rarr;
                    </Link>
                    <Link
                      href={`/projects?hackathon=${h.slug || h.id}`}
                      className="text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all"
                    >
                      Gallery
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            Explore All Hackathons with Filters &rarr;
          </Link>
        </div>
      </section>

      {/* 3. PLATFORM ARCHITECTURE & FAIRNESS */}
      <section className="w-full px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Built for Integrity</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Engineered for fair, reproducible evaluations.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            We eliminate spreadsheet chaos, reviewer severity bias, and leaked scores with a mathematically sound evaluation pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-modern p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 className="font-bold text-sm text-slate-900">Independent Peer Evaluation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Judges evaluate submissions independently without reviewer bias. Every score is securely committed.
            </p>
            <Link href="/about" className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-2">
              Learn about evaluation privacy &rarr;
            </Link>
          </div>

          <div className="card-modern p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
            </div>
            <h3 className="font-bold text-sm text-slate-900">Automated Score Calibration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluator scores are automatically normalized across tracks and categories to prevent rating variance and bias.
            </p>
            <Link href="/results" className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-2">
              View live standings &rarr;
            </Link>
          </div>

          <div className="card-modern p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 className="font-bold text-sm text-slate-900">Single-Command Appliance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Spins up completely offline on port 8080 with zero external cloud dependencies. Fully deterministic and testable.
            </p>
            <Link href="/events?id=sample-hack-2026&tab=rules" className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-2">
              View competition rules &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. BOTTOM BANNER CTA */}
      <section className="w-full px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-10">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Ready to showcase your engineering build?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Join thousands of developers competing in verified hackathons. Submit your project, get calibrated peer evaluations, and earn verified credentials.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto btn-primary"
          >
            Create Builder Account
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto btn-secondary"
          >
            Explore Public Projects
          </Link>
        </div>
      </section>
    </div>
  );
}
