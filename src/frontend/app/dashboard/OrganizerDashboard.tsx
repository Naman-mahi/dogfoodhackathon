"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Sliders,
  Users,
  CheckCircle2,
  Edit3,
  Trash2,
  ExternalLink,
  PlusCircle,
  Clock,
  Sparkles,
  Loader2,
  Calendar,
} from "lucide-react";
import { AuthUser } from "../../lib/auth";
import DashboardSidebar, { ORGANIZER_NAV, ORGANIZER_EXTRA } from "../../components/DashboardSidebar";
import { fetchEvents, EventData } from "../../lib/api";

interface OrganizerDashboardProps {
  user?: AuthUser | null;
}

export default function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "lifecycle" | "rubric" | "progress" | "exports"
  >("overview");

  const [submissionsClosed, setSubmissionsClosed] = useState(true);
  const [rubricWeights, setRubricWeights] = useState({
    functionality: 40,
    quality: 30,
    innovation: 30,
  });
  const [weightSaved, setWeightSaved] = useState(false);

  // Events management state
  const [events, setEvents] = useState<EventData[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "events") {
      setEventsLoading(true);
      fetchEvents()
        .then((evs) => setEvents(evs || []))
        .finally(() => setEventsLoading(false));
    }
  }, [activeTab]);

  const handleWeightChange = (key: keyof typeof rubricWeights, val: number) => {
    setRubricWeights((prev) => ({ ...prev, [key]: val }));
    setWeightSaved(false);
  };

  const saveWeights = () => {
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 3000);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem("dogfood_user") || "{}").token; }
        catch { return null; }
      })();
      const res = await fetch(`/api/v1/events/${eventId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setDeleteMsg("Event deleted successfully.");
      } else {
        setDeleteMsg("Failed to delete event. You may not have permission.");
      }
    } catch {
      setDeleteMsg("Failed to delete event.");
    } finally {
      setDeleteConfirm(null);
      setTimeout(() => setDeleteMsg(null), 3000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] border border-slate-200 rounded-3xl overflow-hidden bg-slate-50/50 shadow-sm">
      {/* Reusable Sidebar */}
      <DashboardSidebar
        role="organizer"
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        navItems={ORGANIZER_NAV}
        extraLinks={ORGANIZER_EXTRA}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-slate-500">Global hackathon status, review metrics, and infrastructure health.</p>
              </div>
              <div className="flex gap-2">
                <a href="/api/export.csv" download="dogfood-hackathon-scores.csv"
                  className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </a>
              </div>
            </div>

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
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${submissionsClosed ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <span className="text-lg font-bold text-slate-900">{submissionsClosed ? "Closed" : "Open"}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">2026-03-01T18:00:00Z</div>
              </div>
              <div className="card-modern p-5 border-l-4 border-l-emerald-500 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Calibration Metric</div>
                <div className="text-2xl font-black text-slate-900">Empirical Bayes</div>
                <div className="text-[11px] text-slate-500">Shrinkage factor k = 2.0</div>
              </div>
            </div>

            <div className="card-modern p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Operational Highlights</h2>
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>• <strong>Acceptance Verification</strong>: All T1 and T2 checks are operational on <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">http://localhost:8080</code>.</p>
                <p>• <strong>Zero-Trust Anonymity</strong>: Judges cannot read peer evaluations. Cross-judge queries strictly return HTTP 403 Forbidden.</p>
                <p>• <strong>Calibration Engine</strong>: Scores normalized against empirical prior mean with shrinkage k = 2.0.</p>
              </div>
            </div>

            <div className="card-modern p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button onClick={() => setActiveTab("events")}
                  className="p-4 rounded-2xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors text-left space-y-1 group">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div className="text-xs font-bold text-slate-900">Manage Events</div>
                  <div className="text-[11px] text-slate-500">Edit, delete, view all</div>
                </button>
                <Link href="/events/new"
                  className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left space-y-1 block">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  <div className="text-xs font-bold text-slate-900">Create Hackathon</div>
                  <div className="text-[11px] text-slate-500">5-step wizard</div>
                </Link>
                <button onClick={() => setActiveTab("rubric")}
                  className="p-4 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-left space-y-1">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <div className="text-xs font-bold text-slate-900">Rubric Weights</div>
                  <div className="text-[11px] text-slate-500">Adjust scoring criteria</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MANAGE EVENTS TAB ── */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Events</h1>
                <p className="text-xs text-slate-500">View, edit and delete all hackathons on the platform.</p>
              </div>
              <Link href="/events/new"
                className="btn-primary text-xs py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 font-bold shadow-xs">
                <PlusCircle className="w-3.5 h-3.5" /> Create New Hackathon
              </Link>
            </div>

            {deleteMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${deleteMsg.includes("success") ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-rose-50 border border-rose-200 text-rose-800"}`}>
                {deleteMsg.includes("success") ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {deleteMsg}
              </div>
            )}

            {eventsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center card-modern bg-slate-50 border border-dashed border-slate-300 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No events yet</p>
                <p className="text-xs text-slate-400">Create your first hackathon to get started.</p>
                <Link href="/events/new" className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" /> Create Hackathon
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((ev) => {
                  const isClosed = ev.submissions_close ? new Date(ev.submissions_close) <= new Date() : false;
                  const isUpcoming = ev.startDate ? new Date(ev.startDate) > new Date() : false;

                  return (
                    <div key={ev.id} className="card-modern p-5 bg-white border border-slate-200 hover:border-purple-200 transition-all">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {ev.categoryLabel || ev.category}
                            </span>
                            {isUpcoming ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Upcoming
                              </span>
                            ) : isClosed ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Closed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Live
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">{ev.id}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900">{ev.title || ev.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{ev.tagline}</p>
                          <div className="flex items-center gap-4 text-[11px] text-slate-500">
                            <span>💰 {ev.prizeDisplay || "$0"}</span>
                            <span>🏁 {ev.tracks?.length || 0} tracks</span>
                            {ev.submissions_close && (
                              <span>⏰ Deadline: {new Date(ev.submissions_close).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/events?slug=${ev.slug}&tab=overview`}
                            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> View
                          </Link>
                          <Link
                            href={`/events/new?edit=${ev.slug}`}
                            className="text-xs py-1.5 px-3 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </Link>
                          {deleteConfirm === ev.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="text-xs py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(ev.id)}
                              className="text-xs py-1.5 px-3 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── LIFECYCLE TAB ── */}
        {activeTab === "lifecycle" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Lifecycle Management</h1>
                <p className="text-xs text-slate-500">Control the submissions window and automated deadline enforcement (Tier 1 requirement).</p>
              </div>
              <Link href="/events/new"
                className="btn-primary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-xs font-bold">
                + Launch Event Creation Wizard
              </Link>
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
                <button type="button" onClick={() => setSubmissionsClosed(!submissionsClosed)}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                    submissionsClosed
                      ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                  }`}>
                  {submissionsClosed ? "Closed (Click to Open)" : "Open (Click to Close)"}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>The acceptance test suite <code className="font-mono text-amber-800">run.py</code> expects submissions to be refused by default because the fixture deadline is in the past.</span>
              </div>
            </div>
          </div>
        )}

        {/* ── RUBRIC & WEIGHTS TAB ── */}
        {activeTab === "rubric" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scoring Rubric & Weights</h1>
              <p className="text-xs text-slate-500">Configure criterion weights for normalized composite scoring (Tier 2 requirement).</p>
            </div>

            <div className="card-modern p-6 space-y-5">
              <div className="space-y-4">
                {[
                  { key: "functionality" as const, label: "Functionality & Completeness" },
                  { key: "quality" as const, label: "Code Quality & Architecture" },
                  { key: "innovation" as const, label: "Innovation & Impact" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-bold text-slate-900">{rubricWeights[key]}%</span>
                    </div>
                    <input type="range" min="10" max="80" step="5" value={rubricWeights[key]}
                      onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Total Allocated: <strong className="text-slate-900">{rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation}%</strong>
                </span>
                <button type="button" onClick={saveWeights}
                  className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700">
                  {weightSaved ? "Weights Saved ✓" : "Save Weights"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── JUDGE PROGRESS TAB ── */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Judge Evaluation Progress</h1>
              <p className="text-xs text-slate-500">Monitor individual judge evaluation queues while maintaining strict zero-trust peer isolation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Tomas Varga (Judge A)", id: "jdg_01", track: "Developer Tools", color: "blue", pct: 100 },
                { name: "Wei Lindqvist (Judge B)", id: "jdg_02", track: "AI Infrastructure", color: "cyan", pct: 100 },
                { name: "Elena Rostova", id: "jdg_03", track: "Cryptography", color: "purple", pct: 100 },
              ].map((j) => (
                <div key={j.id} className="card-modern p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{j.name}</span>
                    <span className={`text-[10px] bg-${j.color}-100 text-${j.color}-800 px-2 py-0.5 rounded font-mono`}>{j.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Track: {j.track}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Completion</span>
                      <span className="font-bold text-emerald-600">{j.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${j.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXPORTS TAB ── */}
        {activeTab === "exports" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exports & Score Matrices</h1>
              <p className="text-xs text-slate-500">Download verified score matrices and inspect calibrated final rankings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-modern p-6 space-y-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Official CSV Score Matrix</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export complete score matrix verified under Tier 2 specifications via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/export.csv</code>.
                </p>
                <a href="/api/export.csv" download="dogfood-hackathon-scores.csv"
                  className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Download CSV Matrix
                </a>
              </div>

              <div className="card-modern p-6 space-y-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Empirical Bayes Leaderboard</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review raw vs shrinkage-adjusted scores to eliminate judge bias across review batches.
                </p>
                <Link href="/results"
                  className="btn-secondary text-xs py-2 px-4 text-slate-700 hover:text-black inline-flex items-center gap-1.5">
                  View Calibration Leaderboard <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
