import React from "react";
import Link from "next/link";
import { Download, ShieldCheck, BarChart3, TrendingUp, Sliders, CheckCircle2 } from "lucide-react";
import { fetchCalibratedRankings } from "@/lib/api";

export default async function ResultsPage() {
  const calibrationData = await fetchCalibratedRankings();
  const rankings = calibrationData?.rankings || [];
  const globalMean = calibrationData?.global_prior_mean ?? 3.0;
  const shrinkageK = calibrationData?.shrinkage_k ?? 2.0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200">
              Empirical Bayes Engine
            </span>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-Trust Validated
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Score Calibration &amp; Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time peer evaluation convergence via Bayesian shrinkage normalization (k=2.0).
          </p>
        </div>

        {/* CSV Export Button */}
        <div>
          <a
            href="/api/export.csv"
            download="dogfood-evaluation-results.csv"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-6 rounded-full transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Score Matrix (CSV)
          </a>
        </div>
      </div>

      {/* Statistical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Global Prior Mean</span>
            <Sliders className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {globalMean.toFixed(2)} / 5.0
          </div>
          <p className="text-[11px] text-slate-500">
            Overall peer grading distribution mean (&mu;<sub>0</sub>)
          </p>
        </div>

        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Shrinkage Factor</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600">
            k = {shrinkageK.toFixed(1)}
          </div>
          <p className="text-[11px] text-slate-500">
            Prior regularization weight regularizing grading variance
          </p>
        </div>

        <div className="card-modern p-6 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Calibrated Submissions</span>
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
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Converged Leaderboard &amp; Shrinkage Metrics
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            formula: (n&middot;y&#772; + k&middot;&mu;) / (n + k)
          </span>
        </div>

        {rankings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No peer scores submitted yet. Assigned judges evaluate in double-blind isolation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Project ID</th>
                  <th className="px-6 py-3.5">Reviews (n)</th>
                  <th className="px-6 py-3.5">Raw Mean</th>
                  <th className="px-6 py-3.5">Calibrated Score</th>
                  <th className="px-6 py-3.5">Shrinkage Delta</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rankings.map((r, idx) => (
                  <tr key={r.project_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800"
                          : idx === 1
                          ? "bg-slate-200 text-slate-700"
                          : idx === 2
                          ? "bg-amber-50 text-amber-700"
                          : "text-slate-400"
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {r.project_id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.review_count} independent reviews
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.raw_mean.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-black text-blue-600 text-sm">
                      {r.calibrated_score.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.shrinkage_delta > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : r.shrinkage_delta < 0
                          ? "bg-rose-50 text-rose-700"
                          : "text-slate-400"
                      }`}>
                        {r.shrinkage_delta > 0 ? `+${r.shrinkage_delta.toFixed(3)}` : r.shrinkage_delta.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/projects?id=${r.project_id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security & Verification Callout */}
      <div className="card-modern p-6 bg-slate-900 text-white rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold">Zero-Trust Peer Score Isolation Architecture</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          In DOGFOOD, no evaluator can observe or snoop on another reviewer&apos;s scorecards prior to final closure.
          The backend enforces strict database query filtering on <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">judge = session.user_id</code>.
          Any unauthorized attempt by a peer to query another judge&apos;s evaluations triggers an instant <code className="text-rose-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">HTTP 403 Forbidden</code> barrier.
        </p>
      </div>
    </div>
  );
}
