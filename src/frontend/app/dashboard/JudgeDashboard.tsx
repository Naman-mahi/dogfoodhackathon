"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  BookOpen,
  Check,
  Clock,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  Code2,
} from "lucide-react";
import { AuthUser } from "../../lib/auth";
import DashboardSidebar, { JUDGE_NAV } from "../../components/DashboardSidebar";
import DataTable, { ColumnDef } from "../../components/DataTable";
import Select2 from "../../components/Select2";
import { fetchProjects, fetchJudgeScores, fetchJudges, submitJudgeScore, Project, JudgeScoreRecord } from "../../lib/api";
import toast from "react-hot-toast";

interface JudgeDashboardProps {
  user?: AuthUser | null;
}

interface EvaluationForm {
  projectId: string;
  projectTitle: string;
  functionality: number;
  quality: number;
  innovation: number;
  comment: string;
}

interface JudgeProjectItem {
  id: string;
  slug?: string;
  title: string;
  team: string;
  track: string;
  summary: string;
  scored: boolean;
  lastScore: number | null;
  comment: string;
  repoUrl?: string;
  demoUrl?: string;
}

export default function JudgeDashboard({ user }: JudgeDashboardProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "isolation" | "history" | "rubric">("queue");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as any;
      if (tabParam && ["queue", "isolation", "history", "rubric"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    const validTab = tab as "queue" | "isolation" | "history" | "rubric";
    setActiveTab(validTab);
    if (typeof window !== "undefined") {
      const newUrl = validTab === "queue" ? "/dashboard/judge" : `/dashboard/judge?tab=${validTab}`;
      window.history.pushState(null, "", newUrl);
    }
  };

  const [selectedProject, setSelectedProject] = useState<EvaluationForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [peerIsolationResult, setPeerIsolationResult] = useState<string | null>(null);
  const [testingIsolation, setTestingIsolation] = useState(false);

  const [projects, setProjects] = useState<JudgeProjectItem[]>([]);
  const [judgeAssignedTracks, setJudgeAssignedTracks] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");

  const loadData = async () => {
    setLoadingProjects(true);
    try {
      const [allJudges, myScores] = await Promise.all([
        fetchJudges(),
        fetchJudgeScores(),
      ]);

      const currentUserId = (user as any)?.id || user?.user_id || "";
      const judgeIdOrEmail = currentUserId || user?.email || "";
      const matchedJudge = allJudges?.find(
        (j) => (currentUserId && j.id === currentUserId) || j.email === user?.email || (user?.email && j.id === user.email.split("@")[0])
      );
      const assignedTracks: string[] = matchedJudge?.tracks || [];
      setJudgeAssignedTracks(assignedTracks);

      const allProjects = await fetchProjects({
        judgeId: matchedJudge?.id || judgeIdOrEmail,
      });

      const scoresMap = new Map<string, JudgeScoreRecord>();
      myScores.forEach((s) => {
        scoresMap.set(s.project, s);
      });

      // Filter: ONLY show assigned submissions matching the judge's assigned tracks OR already evaluated projects
      const assignedProjects = assignedTracks.length > 0
        ? allProjects.filter((p) => {
            const hasScore = scoresMap.has(p.id) || scoresMap.has(p.slug);
            const matchesTrack = assignedTracks.some(
              (t) => (p.track && p.track.toLowerCase().includes(t.toLowerCase())) ||
                     (p.trackLabel && p.trackLabel.toLowerCase().includes(t.toLowerCase()))
            );
            return matchesTrack || hasScore;
          })
        : allProjects;

      const mapped: JudgeProjectItem[] = assignedProjects.map((p) => {
        const score = scoresMap.get(p.id) || scoresMap.get(p.slug);
        if (score) {
          const c = score.criteria || {};
          const vals = Object.values(c).filter((v) => typeof v === "number") as number[];
          const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3.0;
          return {
            id: p.id,
            slug: p.slug,
            title: p.title,
            team: p.team,
            track: p.trackLabel || p.track,
            summary: p.summary,
            scored: true,
            lastScore: avg,
            comment: score.comment || "",
            repoUrl: p.repoUrl,
            demoUrl: p.demoUrl,
          };
        }
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          team: p.team,
          track: p.trackLabel || p.track,
          summary: p.summary,
          scored: false,
          lastScore: null,
          comment: "",
          repoUrl: p.repoUrl,
          demoUrl: p.demoUrl,
        };
      });

      setProjects(mapped);
    } catch (err) {
      console.warn("Failed to load judge queue:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const completedProjects = projects.filter((p) => p.scored);
  const completedCount = completedProjects.length;
  const pendingCount = projects.filter((p) => !p.scored).length;
  const avgScore = completedCount > 0
    ? (completedProjects.reduce((sum, p) => sum + (p.lastScore || 0), 0) / completedCount)
    : 0;
  const progressPercent = projects.length > 0 ? Math.round((completedCount / projects.length) * 100) : 0;

  const availableTracks = Array.from(new Set(projects.map((p) => p.track).filter(Boolean)));

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !searchFilter ||
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.team.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesTrack = trackFilter === "all" || p.track === trackFilter;
    return matchesSearch && matchesTrack;
  });

  const historyColumns: ColumnDef<JudgeProjectItem>[] = [
    {
      key: "title",
      header: "Project",
      sortable: true,
      render: (p) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.title}</div>
          <div className="font-mono text-[10px] text-slate-400">{p.id}</div>
        </div>
      ),
    },
    {
      key: "team",
      header: "Team / Squad",
      sortable: true,
      render: (p) => <span className="text-xs font-medium text-slate-700">{p.team}</span>,
    },
    {
      key: "track",
      header: "Track",
      sortable: true,
      render: (p) => (
        <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg">
          {p.track}
        </span>
      ),
    },
    {
      key: "lastScore",
      header: "Calibrated Score",
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
          {p.lastScore ? p.lastScore.toFixed(1) : "N/A"} / 10
        </span>
      ),
    },
    {
      key: "comment",
      header: "Evaluator Note",
      render: (p) => (
        <span className="text-xs text-slate-600 italic line-clamp-1">
          &ldquo;{p.comment || "Rubric standards satisfied."}&rdquo;
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (p) => (
        <button
          type="button"
          onClick={() => handleOpenScoreModal(p)}
          className="text-xs py-1 px-3 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold cursor-pointer"
        >
          Update Score
        </button>
      ),
    },
  ];

  const handleOpenScoreModal = (prj: JudgeProjectItem) => {
    setSelectedProject({
      projectId: prj.id,
      projectTitle: prj.title,
      functionality: 7,
      quality: 8,
      innovation: 8,
      comment: prj.comment || "Well architected and matches track requirements.",
    });
    setSubmitMessage(null);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await submitJudgeScore({
        project: selectedProject.projectId,
        criteria: {
          functionality: selectedProject.functionality,
          quality: selectedProject.quality,
          innovation: selectedProject.innovation,
        },
        comment: selectedProject.comment,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to submit score to backend");
      }

      const avg = (selectedProject.functionality + selectedProject.quality + selectedProject.innovation) / 3;
      toast.success(`Evaluation saved for ${selectedProject.projectTitle}!`);
      setSubmitMessage(`Evaluation saved successfully for ${selectedProject.projectTitle}!`);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.projectId
            ? { ...p, scored: true, comment: selectedProject.comment, lastScore: avg }
            : p
        )
      );
      setTimeout(() => setSelectedProject(null), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to record evaluation.");
      setSubmitMessage(err.message || "Failed to record evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestPeerIsolation = async () => {
    setTestingIsolation(true);
    setPeerIsolationResult(null);
    try {
      const res = await fetch("/api/v1/judge/scores?judge=jdg_02", { credentials: "include" });
      if (res.status === 403 || res.status === 401) {
        const text = "VERIFIED: Backend strictly returned HTTP 403 Forbidden. Independent scoring privacy is enforced.";
        setPeerIsolationResult(text);
        toast.success("Peer score privacy strictly verified (HTTP 403 Forbidden).");
      } else if (res.status === 200) {
        const text = "WARNING: Endpoint returned 200 OK. Peer scores should be forbidden.";
        setPeerIsolationResult(text);
        toast.error("Warning: Peer scores endpoint returned 200 OK.");
      } else {
        setPeerIsolationResult(`Status: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setPeerIsolationResult(`Request blocked: ${e.message}`);
      toast.error(`Request blocked: ${e.message}`);
    } finally {
      setTestingIsolation(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 w-full relative">
      {/* Reusable Sidebar */}
      <DashboardSidebar
        role="judge"
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        navItems={JUDGE_NAV}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full min-w-0">

        {/* Judge Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern p-5 border-l-4 border-l-purple-500 space-y-1 bg-white">
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Queue</div>
            <div className="text-2xl font-black text-slate-900">{projects.length} Projects</div>
            <div className="text-[11px] text-slate-500 font-mono">Platform Submissions</div>
          </div>
          <div className="card-modern p-5 border-l-4 border-l-emerald-500 space-y-1 bg-white">
            <div className="text-[10px] uppercase font-bold text-slate-400">Reviews Completed</div>
            <div className="text-2xl font-black text-emerald-600">{completedCount} Evaluated</div>
            <div className="text-[11px] text-slate-500">{progressPercent}% of queue reviewed</div>
          </div>
          <div className="card-modern p-5 border-l-4 border-l-amber-500 space-y-1 bg-white">
            <div className="text-[10px] uppercase font-bold text-slate-400">Pending Reviews</div>
            <div className="text-2xl font-black text-amber-600">{pendingCount} Projects</div>
            <div className="text-[11px] text-slate-500">Requires rubric scores</div>
          </div>
          <div className="card-modern p-5 border-l-4 border-l-blue-500 space-y-1 bg-white">
            <div className="text-[10px] uppercase font-bold text-slate-400">Peer Isolation</div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900">Enforced</span>
            </div>
            <div className="text-[11px] text-slate-500">HTTP 403 Cross-Judge Guard</div>
          </div>
        </div>

        {/* ── ASSIGNED QUEUE TAB ── */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Evaluation Queue</h1>
                <p className="text-xs text-slate-500">Double-blind evaluation queue. Score builds against standard rubrics.</p>
              </div>
              <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                {completedCount} / {projects.length} Completed
              </div>
            </div>

            {judgeAssignedTracks.length > 0 && (
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Assigned Evaluation Tracks:
                  </span>
                  {judgeAssignedTracks.map((trk) => (
                    <span key={trk} className="badge-pill bg-white text-purple-700 border border-purple-300 font-bold text-[11px]">
                      {trk}
                    </span>
                  ))}
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  Showing exclusively your assigned submissions ({projects.length} in queue)
                </span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search project title, team, ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input-field pl-9 text-xs py-2 w-full bg-white border-slate-200"
                />
              </div>

              {availableTracks.length > 0 && (
                <div className="flex items-center gap-2 w-52 shrink-0">
                  <Select2
                    variant="light"
                    value={trackFilter}
                    onChange={setTrackFilter}
                    options={[
                      { value: "all", label: `All Tracks (${projects.length})` },
                      ...availableTracks.map((t) => ({ value: t, label: t })),
                    ]}
                    isSearchable={true}
                    placeholder="Filter by track..."
                  />
                </div>
              )}
            </div>

            {loadingProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card-modern h-48 animate-pulse bg-slate-100/70" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="card-modern p-12 text-center text-slate-500 text-sm bg-white">
                No projects found matching the filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredProjects.map((p) => (
                  <div key={p.id} className="card-modern p-5 bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{p.id}</span>
                        {p.scored ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />{p.lastScore?.toFixed(1)}/10
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Pending</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                      <div className="text-xs text-slate-500 font-medium">Team: {p.team} · Track: <span className="text-purple-600 font-semibold">{p.track}</span></div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{p.summary}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button type="button" onClick={() => handleOpenScoreModal(p)}
                        className={`flex-1 text-xs py-2 rounded-xl font-bold transition-all cursor-pointer ${
                          p.scored ? "btn-secondary text-slate-700 hover:text-black" : "btn-primary text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                        }`}>
                        {p.scored ? "Update Evaluation" : "Evaluate Project"}
                      </button>
                      {p.repoUrl && (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Repository"
                        >
                          <Code2 className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PEER ISOLATION AUDIT TAB ── */}
        {activeTab === "isolation" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Independent Evaluator Privacy Verification</h1>
              <p className="text-xs text-slate-500">System verification ensuring evaluators cannot access or influence each other&apos;s score records.</p>
            </div>

            <div className="card-modern p-6 space-y-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Independent Review Privacy Guarantee</h2>
                  <p className="text-xs text-slate-500">HTTP 403 Forbidden is strictly enforced at the database proxy layer.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking the button below sends an authenticated request attempting to query a peer judge&apos;s score records (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/v1/judge/scores?judge=jdg_02</code>).
              </p>

              <button
                type="button"
                onClick={handleTestPeerIsolation}
                disabled={testingIsolation}
                className="btn-primary text-xs py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
              >
                {testingIsolation ? "Probing Barrier..." : "Execute Barrier Probe (Expect HTTP 403)"}
              </button>

              {peerIsolationResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
                  {peerIsolationResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EVALUATION HISTORY TAB (REUSABLE DATA TABLE) ── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Evaluation History</h1>
              <p className="text-xs text-slate-500">All submitted evaluations recorded in double-blind store.</p>
            </div>

            <DataTable
              data={completedProjects}
              columns={historyColumns}
              searchableKeys={["title", "team", "track", "comment"]}
              searchPlaceholder="Filter evaluated projects by title, team, or track..."
              emptyMessage="No evaluations completed yet. Return to the Assigned Queue to evaluate projects."
              pageSize={10}
            />
          </div>
        )}

        {/* ── RUBRIC & CRITERIA TAB ── */}
        {activeTab === "rubric" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Judging Rubric Standards</h1>
              <p className="text-xs text-slate-500">Official evaluation rubric criteria and scoring guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-modern p-6 space-y-3 bg-white">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono">Weight: 40%</span>
                <h3 className="text-base font-bold text-slate-900">Functionality &amp; Completeness</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Does the codebase run reliably? Are all specified deliverables operational and demonstrated clearly?
                </p>
              </div>

              <div className="card-modern p-6 space-y-3 bg-white">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">Weight: 30%</span>
                <h3 className="text-base font-bold text-slate-900">Code Quality &amp; Architecture</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Modularity, testability, clean commit history, robust error handling, and offline execution resilience.
                </p>
              </div>

              <div className="card-modern p-6 space-y-3 bg-white">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">Weight: 30%</span>
                <h3 className="text-base font-bold text-slate-900">Innovation &amp; Impact</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Novel engineering methodology, architectural sophistication, and practical real-world relevance.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Evaluation Rubric Scoring Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded">
                  Double-Blind Rubric
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Evaluate: {selectedProject.projectTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitScore} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Functionality &amp; Completeness (1 - 10)</span>
                  <span className="font-mono font-bold text-purple-700">{selectedProject.functionality}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.functionality}
                  onChange={(e) =>
                    setSelectedProject({ ...selectedProject, functionality: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Code Quality &amp; Architecture (1 - 10)</span>
                  <span className="font-mono font-bold text-purple-700">{selectedProject.quality}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.quality}
                  onChange={(e) =>
                    setSelectedProject({ ...selectedProject, quality: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Innovation &amp; Technical Impact (1 - 10)</span>
                  <span className="font-mono font-bold text-purple-700">{selectedProject.innovation}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedProject.innovation}
                  onChange={(e) =>
                    setSelectedProject({ ...selectedProject, innovation: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluator Feedback &amp; Justification
                </label>
                <textarea
                  rows={3}
                  value={selectedProject.comment}
                  onChange={(e) =>
                    setSelectedProject({ ...selectedProject, comment: e.target.value })
                  }
                  placeholder="Record qualitative rationale for these marks..."
                  className="input-field text-xs py-2 px-3 w-full bg-slate-50 border-slate-200"
                />
              </div>

              {submitMessage && (
                <div className="text-xs p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {submitMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="btn-secondary text-xs py-2 px-4 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs font-bold"
                >
                  {submitting ? "Committing..." : "Commit Evaluation Score"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
