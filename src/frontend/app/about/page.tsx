import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Scale, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          About DOGFOOD
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          The Hackathon Platform That <span className="text-blue-600">Judges You</span>
        </h1>
        <p className="text-slate-600 text-base max-w-2xl mx-auto leading-relaxed">
          DOGFOOD is an open-source, self-hostable submission and judging platform engineered for offline resilience, rigorous Bayesian score calibration, and zero-trust backend role isolation.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-modern p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">The One-Command Rule</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Spins up completely offline on port 8080 with zero external cloud dependencies. A deterministic appliance that seeds fixtures instantly.
          </p>
        </div>

        <div className="card-modern p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Zero-Trust Role Isolation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hiding buttons is zero security. Authorization gates at the database and HTTP layer prevent judges from peeking at peer scores.
          </p>
        </div>

        <div className="card-modern p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Empirical Bayes Normalization</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Eliminates judge severity bias and protects against zero-variance scores and dropout reviewers with prior shrinkage ($k=2.0$).
          </p>
        </div>
      </div>

      {/* The Story */}
      <div className="card-modern p-8 sm:p-10 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            At competitive hackathons, raw average scores break down: lenient judges give high marks to mediocre projects, while harsh judges penalize brilliant builds. Furthermore, judges may drop out or score flat 4.0s across their entire batch.
          </p>
          <p>
            DOGFOOD solves this by standardizing review distributions using Empirical Bayes shrinkage toward global priors. Every project receives an unbiased, calibrated score that organizer consoles can export with cryptographic audit trails.
          </p>
        </div>
        <div className="pt-4 flex flex-wrap gap-3">
          <Link
            href="/hackathons"
            className="btn-primary text-xs py-2.5 px-6"
          >
            Explore Hackathons
          </Link>
          <Link
            href="/register"
            className="btn-secondary text-xs py-2.5 px-6"
          >
            Join as Participant
          </Link>
        </div>
      </div>
    </div>
  );
}
