"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sliders,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface EvaluationForm {
  projectId: string;
  projectTitle: string;
  functionality: number;
  quality: number;
  innovation: number;
  comment: string;
}

export default function JudgeDashboard() {
  const [selectedProject, setSelectedProject] = useState<EvaluationForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [peerIsolationResult, setPeerIsolationResult] = useState<string | null>(null);
  const [testingIsolation, setTestingIsolation] = useState(false);

  // Sample assigned projects in judge's track
  const [projects, setProjects] = useState([
    {
      id: "prj_01",
      title: "Quiet Hours",
      team: "Nightshift",
      track: "Developer tools",
      summary: "Autonomous notification silencer during active deep-work flows.",
      scored: true,
      lastScore: 7.0,
    },
    {
      id: "prj_02",
      title: "Glass Signal",
      team: "Lighthouse Labs",
      track: "Developer tools",
      summary: "Distributed telemetry collector with sub-millisecond trace indexing.",
      scored: false,
      lastScore: null,
    },
    {
      id: "prj_03",
      title: "Small Meadow",
      team: "Greenfield Ops",
      track: "Developer tools",
      summary: "Ephemeral micro-environment orchestrator for pull request previews.",
      scored: false,
      lastScore: null,
    },
  ]);

  const handleOpenScoreModal = (prj: any) => {
    setSelectedProject({
      projectId: prj.id,
      projectTitle: prj.title,
      functionality: 7,
      quality: 8,
      innovation: 8,
      comment: "Well architected and matches track requirements.",
    });
    setSubmitMessage(null);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/v1/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: selectedProject.projectId,
          criteria: {
            functionality: selectedProject.functionality,
            quality: selectedProject.quality,
            innovation: selectedProject.innovation,
          },
          comment: selectedProject.comment,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit score to backend");
      }

      setSubmitMessage(`Evaluation saved successfully for ${selectedProject.projectTitle}!`);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.projectId
            ? {
                ...p,
                scored: true,
                lastScore:
                  (selectedProject.functionality +
                    selectedProject.quality +
                    selectedProject.innovation) /
                  3,
              }
            : p
        )
      );
      setTimeout(() => setSelectedProject(null), 1200);
    } catch (err: any) {
      setSubmitMessage(err.message || "Failed to record evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestPeerIsolation = async () => {
    setTestingIsolation(true);
    setPeerIsolationResult(null);

    try {
      // Intentionally request peer's scores (judge_a) as the current session
      const res = await fetch("/api/judge/scores?judge=judge_a");
      if (res.status === 403 || res.status === 401) {
        setPeerIsolationResult("VERIFIED: Backend returned HTTP 403 Forbidden. Peer isolation is strictly enforced.");
      } else if (res.status === 200) {
        setPeerIsolationResult("WARNING: Endpoint returned 200 OK. Peer scores should be forbidden to other judges.");
      } else {
        setPeerIsolationResult(`Status: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setPeerIsolationResult(`Request blocked: ${e.message}`);
    } finally {
      setTestingIsolation(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="card-modern p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                Tier 2 Judging Queue
              </span>
              <span className="text-xs font-mono text-slate-400">Track: Developer Tools</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Judge Review Portal</h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Conduct blind rubric evaluations. All scoring is zero-trust isolated from other reviewers.
            </p>
          </div>

          <button
            type="button"
            disabled={testingIsolation}
            onClick={handleTestPeerIsolation}
            className="btn-secondary text-xs py-2 px-3.5 text-slate-200 border-slate-700 bg-slate-800/80 hover:bg-slate-700 flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            {testingIsolation ? "Verifying..." : "Verify Peer Isolation (HTTP 403)"}
          </button>
        </div>
      </div>

      {/* Peer Isolation Test Result Notification */}
      {peerIsolationResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            peerIsolationResult.includes("VERIFIED")
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{peerIsolationResult}</span>
        </div>
      )}

      {/* Zero-Trust Peer Isolation Explainer Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Zero-Trust Peer Score Isolation Enforced</div>
          <div className="text-blue-800/80 leading-relaxed text-[11px]">
            In compliance with DOGFOOD 2026 Tier 2 specification, judges are cryptographically prohibited from querying peer judge scores. All evaluations are written blindly to prevent bias.
          </div>
        </div>
      </div>

      {/* Assigned Projects Review Queue */}
      <div className="card-modern p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Assigned Projects Queue</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">3 Projects Assigned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {p.id}
                  </span>
                  {p.scored ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Evaluated ({p.lastScore?.toFixed(1)}/10)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Pending Review
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                <div className="text-[11px] text-slate-500 font-medium">Team: {p.team}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{p.summary}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenScoreModal(p)}
                  className={`w-full text-xs py-2 rounded-lg font-bold transition-all ${
                    p.scored
                      ? "btn-secondary text-slate-700"
                      : "btn-primary text-white"
                  }`}
                >
                  {p.scored ? "Update Evaluation" : "Evaluate Project"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rubric Evaluation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-modern max-w-lg w-full p-6 bg-white shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-600 uppercase font-bold">
                  {selectedProject.projectId}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Evaluate: {selectedProject.projectTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submitMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitScore} className="space-y-4">
              {/* Functionality Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>Functionality & Feature Completeness</span>
                  <span className="font-bold text-blue-600">{selectedProject.functionality}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.functionality}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      functionality: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Code Quality Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>Code Quality & Architecture</span>
                  <span className="font-bold text-blue-600">{selectedProject.quality}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.quality}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      quality: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Innovation Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>Innovation & Track Relevance</span>
                  <span className="font-bold text-blue-600">{selectedProject.innovation}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.innovation}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      innovation: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Written Feedback */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Feedback & Remarks
                </label>
                <textarea
                  rows={3}
                  value={selectedProject.comment}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      comment: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 btn-secondary text-xs py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary text-xs py-2.5"
                >
                  {submitting ? "Submitting..." : "Submit Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
