"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Shuffle,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchJudgeEvaluationProgress,
  JudgeEvaluationProgressResponse,
  JudgeProgressItem,
} from "../lib/api";
import { formatDateSafe } from "../lib/dateUtils";

interface JudgeProgressViewProps {
  onAutoAssignSuccess?: () => void;
}

export default function JudgeProgressView({ onAutoAssignSuccess }: JudgeProgressViewProps) {
  const [data, setData] = useState<JudgeEvaluationProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [expandedJudgeId, setExpandedJudgeId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const loadProgress = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchJudgeEvaluationProgress();
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load judge progress:", err);
      toast.error("Failed to load evaluation progress.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const res = await fetch("/api/v1/judges/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Judges automatically distributed across event tracks!");
        await loadProgress(true);
        onAutoAssignSuccess?.();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to auto-assign judges.");
      }
    } catch (err) {
      toast.error("Network error during auto-assignment.");
    } finally {
      setAutoAssigning(false);
    }
  };

  const judgesList = data?.judges || [];
  const summary = data?.summary || {
    total_judges: 0,
    total_projects: 0,
    total_evaluations_submitted: 0,
    total_evaluations_assigned: 0,
    overall_completion_rate: 0,
    completed_judges_count: 0,
    in_progress_judges_count: 0,
    not_started_judges_count: 0,
  };

  // Collect all unique tracks across judges
  const allTracks = Array.from(
    new Set(judgesList.flatMap((j) => j.tracks || []))
  );

  // Filtered judges
  const filteredJudges = judgesList.filter((j) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.tracks || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && j.status === "Completed") ||
      (statusFilter === "in_progress" && j.status === "In Progress") ||
      (statusFilter === "not_started" && j.status === "Not Started");

    const matchesTrack =
      trackFilter === "all" ||
      (j.tracks || []).some((t) => t.toLowerCase() === trackFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesTrack;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Judge Evaluation Progress
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              Live Dynamic Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of evaluator queues, peer-isolated score submissions, and track coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => loadProgress(true)}
            disabled={refreshing || loading}
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
            title="Refresh data from database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-600" : "text-slate-500"}`}
            />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleAutoAssign}
            disabled={autoAssigning}
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-600" />
            <span>{autoAssigning ? "Distributing..." : "Auto-Assign Tracks"}</span>
          </button>

          <a
            href="/api/export.csv"
            download="dogfood-evaluation-scores.csv"
            className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ── KPI METRICS CARDS (100% REAL DATABASE COUNTS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-modern p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold">Registered Judges</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary.total_judges}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-purple-600 font-bold">
              {summary.completed_judges_count}
            </span>{" "}
            completed evaluation queue
          </div>
        </div>

        <div className="card-modern p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold">Evaluations Submitted</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {summary.total_evaluations_submitted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary.total_projects} submissions
          </div>
        </div>

        <div className="card-modern p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold">Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {summary.overall_completion_rate}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.overall_completion_rate}%` }}
            />
          </div>
        </div>

        <div className="card-modern p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold">Active Evaluators</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary.in_progress_judges_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-amber-600 font-bold">
              {summary.not_started_judges_count}
            </span>{" "}
            pending queue start
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="card-modern p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search evaluators by name, email, ID, or track..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 text-slate-700"
            >
              <option value="all">All Statuses ({judgesList.length})</option>
              <option value="completed">Completed ({summary.completed_judges_count})</option>
              <option value="in_progress">In Progress ({summary.in_progress_judges_count})</option>
              <option value="not_started">Not Started ({summary.not_started_judges_count})</option>
            </select>
          </div>

          {allTracks.length > 0 && (
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 text-slate-700"
            >
              <option value="all">All Tracks</option>
              {allTracks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── JUDGE PROGRESS LIST ── */}
      {loading ? (
        <div className="card-modern p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Fetching dynamic evaluation matrix from database...
          </p>
        </div>
      ) : filteredJudges.length === 0 ? (
        <div className="card-modern p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No evaluators match filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or track filter, or invite new evaluators via the Manage Judges console.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJudges.map((j) => {
            const isExpanded = expandedJudgeId === j.id;
            const statusConfig = {
              Completed: {
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                dot: "bg-emerald-500",
                bar: "bg-emerald-500",
              },
              "In Progress": {
                badge: "bg-blue-50 text-blue-700 border-blue-200",
                dot: "bg-blue-500",
                bar: "bg-blue-600",
              },
              "Not Started": {
                badge: "bg-amber-50 text-amber-700 border-amber-200",
                dot: "bg-amber-500",
                bar: "bg-amber-400",
              },
            }[j.status] || {
              badge: "bg-slate-100 text-slate-700 border-slate-200",
              dot: "bg-slate-400",
              bar: "bg-slate-400",
            };

            return (
              <div
                key={j.id}
                className="card-modern bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                {/* Main Card Header */}
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0">
                        {j.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{j.name}</span>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {j.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{j.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {j.status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedJudgeId(isExpanded ? null : j.id)
                        }
                        className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Details" : "View Breakdown"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tracks Tag List */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400">Assigned Tracks:</span>
                    {j.tracks && j.tracks.length > 0 ? (
                      j.tracks.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md font-medium"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        All Tracks (Universal Evaluator)
                      </span>
                    )}
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">
                        Queue Progress:{" "}
                        <strong className="text-slate-800">
                          {j.total_scored} of {j.total_assigned} submissions scored
                        </strong>
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {j.progress_percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusConfig.bar}`}
                        style={{ width: `${j.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-4 animate-in fade-in duration-150">
                    {/* Scored Submissions List */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed Evaluations ({j.scored_projects.length})
                      </h4>

                      {j.scored_projects.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-slate-200">
                          No evaluations submitted yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {j.scored_projects.map((proj) => (
                            <div
                              key={proj.project_id}
                              className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-900 truncate">
                                    {proj.project_title}
                                  </h5>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-semibold text-purple-600">
                                      {proj.track}
                                    </span>
                                    <span>•</span>
                                    <span>Team {proj.team}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono shrink-0">
                                  ★ {proj.average_score} / 10
                                </span>
                              </div>

                              {/* Criteria breakdown */}
                              {proj.criteria && Object.keys(proj.criteria).length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {Object.entries(proj.criteria).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                                    >
                                      {k}: <strong>{v}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Evaluator Comment */}
                              {proj.comment && (
                                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                                  "{proj.comment}"
                                </div>
                              )}

                              {proj.scored_at && (
                                <div className="text-[10px] text-slate-400 text-right">
                                  Scored: {formatDateSafe(proj.scored_at)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Submissions in Queue */}
                    {j.pending_projects.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Pending In Queue ({j.pending_projects.length})
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {j.pending_projects.map((p) => (
                            <div
                              key={p.project_id}
                              className="bg-white border border-dashed border-slate-200 rounded-xl p-2.5 space-y-1"
                            >
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {p.project_title}
                              </div>
                              <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                <span>{p.track}</span>
                                <span className="text-amber-600 font-medium">Awaiting Score</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
