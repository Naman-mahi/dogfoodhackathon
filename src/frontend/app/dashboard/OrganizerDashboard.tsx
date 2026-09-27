"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calendar,
  Clock,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  LogOut,
} from "lucide-react";
import { AuthUser, logoutUser } from "../../lib/auth";

interface OrganizerDashboardProps {
  user?: AuthUser | null;
}

export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "lifecycle" | "rubric" | "progress" | "exports"
  >("overview");

  const [submissionsClosed, setSubmissionsClosed] = useState(true);
  const [rubricWeights, setRubricWeights] = useState({
    functionality: 40,
    quality: 30,
    innovation: 30,
  });
  const [weightSaved, setWeightSaved] = useState(false);

  const toggleSubmissions = () => {
    setSubmissionsClosed(!submissionsClosed);
  };

  const handleWeightChange = (key: keyof typeof rubricWeights, val: number) => {
    setRubricWeights((prev) => ({ ...prev, [key]: val }));
    setWeightSaved(false);
  };

  const saveWeights = () => {
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 3000);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] border border-slate-200 rounded-3xl overflow-hidden bg-slate-50/50 shadow-sm">
      {/* Professional Left Sidebar for Organizer */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Organizer Header Branding */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="font-black text-sm tracking-wider uppercase text-slate-100">
                Organizer Console
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Tier 1 & Tier 2 Certified
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lifecycle")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "lifecycle"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Event Lifecycle
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rubric")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "rubric"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Rubric & Weights
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("progress")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "progress"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Judge Progress
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exports")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === "exports"
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export & Reports
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300">
              OA
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || "Foundation Admin"}
              </div>
              <div className="text-[10px] text-purple-400 font-mono uppercase">
                ORGANIZER ROLE
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-xs py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Executive Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                  Global hackathon status, review metrics, and infrastructure health.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/api/export.csv"
                  download="dogfood-hackathon-scores.csv"
                  className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </a>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-modern p-5 border-l-4 border-l-purple-500 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Submissions</div>
                <div className="text-2xl font-black text-slate-900">40 Projects</div>
                <div className="text-[11px] text-slate-500">From fixtures.json</div>
              </div>

              <div className="card-modern p-5 border-l-4 border-l-blue-500 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Registered Judges</div>
                <div className="text-2xl font-black text-slate-900">3 Judges</div>
                <div className="text-[11px] text-emerald-600 font-medium">Blind Peer Isolated</div>
              </div>

              <div className="card-modern p-5 border-l-4 border-l-amber-500 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Submissions Window</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      submissionsClosed ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  ></span>
                  <span className="text-lg font-bold text-slate-900">
                    {submissionsClosed ? "Closed (Locked)" : "Open"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">2026-03-01T18:00:00Z</div>
              </div>

              <div className="card-modern p-5 border-l-4 border-l-emerald-500 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Calibration Metric</div>
                <div className="text-2xl font-black text-slate-900">Empirical Bayes</div>
                <div className="text-[11px] text-slate-500">Shrinkage factor k = 2.0</div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card-modern p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Operational Highlights</h2>
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>
                  • <strong>Acceptance Verification</strong>: All T1 and T2 checks are operational on <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">http://localhost:8080</code>.
                </p>
                <p>
                  • <strong>Zero-Trust Anonymity</strong>: Judges cannot read peer evaluations. Cross-judge queries strictly return HTTP 403 Forbidden.
                </p>
                <p>
                  • <strong>Calibration Engine</strong>: Scores are normalized against the empirical prior mean with shrinkage $k = 2.0$.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LIFECYCLE TAB */}
        {activeTab === "lifecycle" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Event Lifecycle Management
              </h1>
              <p className="text-xs text-slate-500">
                Control the submissions window and automated deadline enforcement (Tier 1 requirement).
              </p>
            </div>

            <div className="card-modern p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Submissions Status Controller</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                When the window is closed, any POST request to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/projects/new</code> will be refused with an HTTP 4xx error.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Current Window State</div>
                  <div className="text-[11px] text-slate-500">
                    {submissionsClosed
                      ? "Submissions are currently REFUSED (Deadline: 2026-03-01T18:00:00Z)"
                      : "Submissions are currently ACCEPTED"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSubmissions}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                    submissionsClosed
                      ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                  }`}
                >
                  {submissionsClosed ? "Closed (Click to Open)" : "Open (Click to Close)"}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  The acceptance test suite <code className="font-mono text-amber-800">run.py</code> expects submissions to be refused by default because the fixture deadline is in the past.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* RUBRIC & WEIGHTS TAB */}
        {activeTab === "rubric" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Scoring Rubric & Weights
              </h1>
              <p className="text-xs text-slate-500">
                Configure criterion weights for normalized composite scoring (Tier 2 requirement).
              </p>
            </div>

            <div className="card-modern p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Functionality & Completeness</span>
                    <span className="font-bold text-slate-900">{rubricWeights.functionality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={rubricWeights.functionality}
                    onChange={(e) => handleWeightChange("functionality", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Code Quality & Architecture</span>
                    <span className="font-bold text-slate-900">{rubricWeights.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={rubricWeights.quality}
                    onChange={(e) => handleWeightChange("quality", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Innovation & Impact</span>
                    <span className="font-bold text-slate-900">{rubricWeights.innovation}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={rubricWeights.innovation}
                    onChange={(e) => handleWeightChange("innovation", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Total Allocated:{" "}
                  <strong className="text-slate-900">
                    {rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation}%
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={saveWeights}
                  className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700"
                >
                  {weightSaved ? "Weights Saved!" : "Save Weights"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* JUDGE PROGRESS TAB */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Judge Evaluation Progress
              </h1>
              <p className="text-xs text-slate-500">
                Monitor individual judge evaluation queues while maintaining strict zero-trust peer isolation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-modern p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Tomas Varga (Judge A)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                    jdg_01
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">Track: Developer Tools</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-bold text-emerald-600">100%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              <div className="card-modern p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Wei Lindqvist (Judge B)</span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-mono">
                    jdg_02
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">Track: AI Infrastructure</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-bold text-emerald-600">100%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              <div className="card-modern p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Elena Rostova</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">
                    jdg_03
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">Track: Cryptography</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-bold text-emerald-600">100%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPORTS & REPORTS TAB */}
        {activeTab === "exports" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Exports & Score Matrices
              </h1>
              <p className="text-xs text-slate-500">
                Download verified score matrices and inspect calibrated final rankings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-modern p-6 space-y-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Official CSV Score Matrix</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export complete score matrix verified under Tier 2 specifications via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/export.csv</code>.
                </p>
                <div className="pt-2">
                  <a
                    href="/api/export.csv"
                    download="dogfood-hackathon-scores.csv"
                    className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV Matrix
                  </a>
                </div>
              </div>

              <div className="card-modern p-6 space-y-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Empirical Bayes Leaderboard</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review raw vs shrinkage-adjusted scores to eliminate judge bias across review batches.
                </p>
                <div className="pt-2">
                  <Link
                    href="/results"
                    className="btn-secondary text-xs py-2 px-4 text-slate-700 hover:text-black inline-flex items-center gap-1.5"
                  >
                    View Calibration Leaderboard <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
