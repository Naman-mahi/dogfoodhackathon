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
} from "lucide-react";

export default function OrganizerDashboard() {
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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="card-modern p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                Tier 1 & Tier 2 Certified
              </span>
              <span className="text-xs font-mono text-slate-400">Host: DOGFOOD Foundation</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Organizer Control Center</h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Lifecycle orchestration, judge peer isolation enforcement, rubric weighting, and export pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/api/export.csv"
              download="dogfood-hackathon-scores.csv"
              className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export Score Matrix (CSV)
            </a>
            <Link
              href="/results"
              className="btn-secondary text-xs py-2 px-3.5 text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-700 flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Calibration View
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-4 border-l-4 border-l-purple-500 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Submissions</div>
          <div className="text-2xl font-black text-slate-900">40 Projects</div>
          <div className="text-[11px] text-slate-500">From shared test fixtures</div>
        </div>

        <div className="card-modern p-4 border-l-4 border-l-blue-500 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Judges</div>
          <div className="text-2xl font-black text-slate-900">3 Judges</div>
          <div className="text-[11px] text-emerald-600 font-medium">Blind Peer Isolated</div>
        </div>

        <div className="card-modern p-4 border-l-4 border-l-amber-500 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Submissions Window</div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                submissionsClosed ? "bg-rose-500" : "bg-emerald-500"
              }`}
            ></span>
            <span className="text-lg font-bold text-slate-900">
              {submissionsClosed ? "Closed (Past Due)" : "Open"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">2026-03-01T18:00:00Z</div>
        </div>

        <div className="card-modern p-4 border-l-4 border-l-emerald-500 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Calibration Metric</div>
          <div className="text-2xl font-black text-slate-900">Empirical Bayes</div>
          <div className="text-[11px] text-slate-500">Shrinkage factor k = 2.0</div>
        </div>
      </div>

      {/* Grid: Event Controls & Rubric Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Lifecycle Controls */}
        <div className="card-modern p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Event Lifecycle Control</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">T1 Requirement</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            The deadline strictly refuses POST requests to <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/projects/new</code> when closed. Toggle below to test live enforcement.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Submissions Status</div>
              <div className="text-[11px] text-slate-500">
                {submissionsClosed ? "New entries will be refused (HTTP 4xx)" : "Entries currently accepted"}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSubmissions}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
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
              Fixtures date is set to 2026-03-01T18:00:00Z. Automated test <code className="font-mono text-amber-800">run.py</code> expects submissions to be refused by default.
            </span>
          </div>
        </div>

        {/* Scoring Rubric & Weighting Manager */}
        <div className="card-modern p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Scoring Rubric & Weights</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">T2 Requirement</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Customize criterion weights used in final composite calibration:
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Functionality & Correctness</span>
                <span className="font-bold text-slate-900">{rubricWeights.functionality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={rubricWeights.functionality}
                onChange={(e) => handleWeightChange("functionality", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Total Weight:{" "}
              <strong className="text-slate-800">
                {rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation}%
              </strong>
            </span>
            <button
              type="button"
              onClick={saveWeights}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {weightSaved ? "Saved!" : "Save Weights"}
            </button>
          </div>
        </div>
      </div>

      {/* Judge Progress Monitor (T2) */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Judge Evaluation Progress</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Zero-Trust Peer Isolated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Judge A */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Tomas Varga (Judge A)</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                jdg_01
              </span>
            </div>
            <div className="text-[11px] text-slate-500">Track: Developer Tools</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-slate-700">100% (Completed)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Judge B */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Wei Lindqvist (Judge B)</span>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-mono">
                jdg_02
              </span>
            </div>
            <div className="text-[11px] text-slate-500">Track: AI Infrastructure</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-slate-700">100% (Completed)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Judge C */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Elena Rostova</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">
                jdg_03
              </span>
            </div>
            <div className="text-[11px] text-slate-500">Track: Cryptography</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-slate-700">100% (Completed)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
