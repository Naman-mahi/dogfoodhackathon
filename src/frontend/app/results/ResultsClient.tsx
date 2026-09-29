"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Download,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Sliders,
  Trophy,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { fetchCalibratedRankings, CalibrationResponse, CalibrationRanking, HackathonRef } from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/DataTable";
import Select2 from "@/components/Select2";
import toast from "react-hot-toast";

const FALLBACK_HACKATHONS: HackathonRef[] = [
  { id: "evt_01", name: "Sample Hack 2026", slug: "sample-hack-2026" },
  { id: "evt_02", name: "AI Catalyst Sprint", slug: "ai-catalyst-sprint" },
  { id: "evt_03", name: "Open Source Build India", slug: "open-source-build-india" },
  { id: "evt_04", name: "Zero-Knowledge Summit Hack", slug: "zero-knowledge-summit-hack" },
  { id: "evt_05", name: "Climate Tech Hackathon", slug: "climate-tech-hackathon" },
  { id: "evt_06", name: "Health Data Challenge", slug: "health-data-challenge" },
];

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeHackathonParam = searchParams.get("hackathon") || "all";

  const [selectedHackathon, setSelectedHackathon] = useState<string>(activeHackathonParam);
  const [data, setData] = useState<CalibrationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync param from URL
  useEffect(() => {
    const fromUrl = searchParams.get("hackathon") || "all";
    setSelectedHackathon(fromUrl);
  }, [searchParams]);

  // Fetch rankings whenever selectedHackathon changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchCalibratedRankings(selectedHackathon).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedHackathon]);

  const handleSelectHackathon = (val: string) => {
    setSelectedHackathon(val);
    const params = new URLSearchParams(window.location.search);
    if (val && val !== "all") {
      params.set("hackathon", val);
    } else {
      params.delete("hackathon");
    }
    router.replace(`/results?${params.toString()}`);
  };

  const availableHackathons = data?.available_hackathons?.length
    ? data.available_hackathons
    : FALLBACK_HACKATHONS;

  const rankings = data?.rankings || [];
  const globalMean = data?.global_prior_mean ?? 3.0;
  const shrinkageK = data?.shrinkage_k ?? 2.0;
  const activeHackathonName = data?.hackathon_name || (
    selectedHackathon === "all"
      ? "All Competitions"
      : availableHackathons.find((h) => h.id === selectedHackathon || h.slug === selectedHackathon)?.name || selectedHackathon
  );

  // Typed DataTable columns for calibrated rankings
  const rankingColumns: ColumnDef<CalibrationRanking>[] = [
    {
      key: "rank",
      header: "Rank",
      render: (r, idx) => (
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-xs ${
            idx === 0
              ? "bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-200/50"
              : idx === 1
              ? "bg-slate-200 text-slate-800 border border-slate-300"
              : idx === 2
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "text-slate-500 bg-slate-50"
          }`}
        >
          #{idx + 1}
        </span>
      ),
    },
    {
      key: "project_title",
      header: "Project / Submission",
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">
            {r.project_title || r.project_id}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
            <span>ID: {r.project_id}</span>
            {r.team && (
              <>
                <span>&bull;</span>
                <span className="text-slate-500 font-sans font-medium">Team {r.team}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "track",
      header: "Track",
      sortable: true,
      render: (r) => (
        <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px]">
          {r.track || "General Track"}
        </span>
      ),
    },
    {
      key: "review_count",
      header: "Reviews (n)",
      sortable: true,
      render: (r) => (
        <span className="text-slate-600 font-mono">
          {r.review_count} {r.review_count === 1 ? "review" : "reviews"}
        </span>
      ),
    },
    {
      key: "raw_mean",
      header: "Raw Mean",
      sortable: true,
      render: (r) => (
        <span className="text-slate-600 font-mono font-semibold">
          {r.raw_mean.toFixed(2)}
        </span>
      ),
    },
    {
      key: "calibrated_score",
      header: "Calibrated Score",
      sortable: true,
      render: (r) => (
        <span className="font-black text-blue-600 text-sm font-mono">
          {r.calibrated_score.toFixed(3)}
        </span>
      ),
    },
    {
      key: "shrinkage_delta",
      header: "Shrinkage Delta",
      sortable: true,
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
            r.shrinkage_delta > 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              : r.shrinkage_delta < 0
              ? "bg-rose-50 text-rose-700 border border-rose-200/60"
              : "text-slate-400"
          }`}
        >
          {r.shrinkage_delta > 0 ? `+${r.shrinkage_delta.toFixed(3)}` : r.shrinkage_delta.toFixed(3)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => (
        <Link
          href={`/projects?id=${r.project_id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
        >
          Inspect &rarr;
        </Link>
      ),
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-pill bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-semibold">
              <Trophy className="w-3.5 h-3.5 text-blue-600" />
              Live Leaderboard
            </span>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Calibrated Rankings
            </span>
            {selectedHackathon !== "all" && (
              <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                {activeHackathonName}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Competition Results &amp; Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time score calibration and official leaderboard standings, filtered per hackathon.
          </p>
        </div>

        {/* CSV Export Button */}
        <div>
          <a
            href={`/api/export.csv${selectedHackathon !== "all" ? `?hackathon=${encodeURIComponent(selectedHackathon)}` : ""}`}
            download={`dogfood-${selectedHackathon}-results.csv`}
            onClick={() => toast.success("Exporting calibrated score matrix CSV...")}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-6 rounded-full transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Score Matrix (CSV)
          </a>
        </div>
      </div>

      {/* Per-Hackathon Separate Leaderboard Selector */}
      <div className="card-modern p-4 bg-gradient-to-r from-slate-900 to-[#11192e] text-white border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase font-bold text-blue-400 tracking-wider">
                Competition Filter
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select Hackathon Leaderboard</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Scores calibrated separately)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Select2 Dropdown and Pill Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="w-full sm:w-64">
              <Select2
                variant="dark"
                value={selectedHackathon}
                onChange={(val) => handleSelectHackathon(val)}
                placeholder="Choose hackathon..."
                searchPlaceholder="Search competitions..."
                options={[
                  { value: "all", label: "All Competitions" },
                  ...availableHackathons.map((h) => ({
                    value: h.slug || h.id,
                    label: h.name,
                  })),
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => handleSelectHackathon("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedHackathon === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                All
              </button>
              {availableHackathons.map((h) => {
                const isSelected = selectedHackathon === h.id || selectedHackathon === h.slug;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleSelectHackathon(h.slug || h.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer truncate max-w-[170px] ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    title={h.name}
                  >
                    {h.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Prior Mean (&mu;<sub>0</sub>)</span>
            <Sliders className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {globalMean.toFixed(2)} / 5.0
          </div>
          <p className="text-[11px] text-slate-500">
            {selectedHackathon === "all" ? "Global prior mean" : `${activeHackathonName} prior mean`}
          </p>
        </div>

        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Shrinkage Factor (k)</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600">
            k = {shrinkageK.toFixed(1)}
          </div>
          <p className="text-[11px] text-slate-500">
            Regularizes evaluator variance across {rankings.length} submissions
          </p>
        </div>

        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluated Projects</span>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {rankings.length} Projects
          </div>
          <p className="text-[11px] text-slate-500">
            Rank-converged double-blind peer evaluations
          </p>
        </div>
      </div>

      {/* Calibrated Rankings Table */}
      <div className="card-modern overflow-hidden shadow-xs border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{activeHackathonName} &mdash; Official Standings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official ranked standings updated in real time from evaluator submissions
            </p>
          </div>
          <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Live Calibration
          </span>
        </div>

        <div className="p-4">
          <DataTable<CalibrationRanking>
            data={rankings}
            columns={rankingColumns}
            keyExtractor={(r) => r.project_id}
            pageSize={10}
            loading={loading}
            searchPlaceholder="Search calibrated rankings by title or track..."
            emptyMessage="No calibrated submissions found for this competition. Scores appear as assigned judges submit peer evaluations."
          />
        </div>
      </div>

      {/* Security & Verification Callout */}
      <div className="card-modern p-6 bg-slate-900 text-white rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold">Independent Review &amp; Score Privacy Guard</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          In DOGFOOD, evaluations are strictly private and independently submitted by each assigned judge.
          No evaluator can inspect another reviewer&apos;s pending scores, guaranteeing unbiased, merit-based grading for all submissions.
        </p>
      </div>
    </div>
  );
}
