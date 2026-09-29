"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Edit3,
  Download,
  AlertTriangle,
  FolderGit2,
  Send,
  Loader2,
  Settings,
  Scale,
  Sparkles,
  ArrowLeft,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import {
  fetchEvent,
  fetchEventRegistrations,
  removeParticipantRegistration,
  fetchJudges,
  updateJudge,
  createJudge,
  deleteJudge,
  fetchProjects,
  updateEvent,
  isEventRegistrationOpen,
  JudgeData,
  RegistrationItem,
} from "@/lib/api";
import { Hackathon, Project } from "@/lib/types";
import DashboardSidebar, { ORGANIZER_NAV } from "@/components/DashboardSidebar";
import DataTable, { ColumnDef } from "@/components/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";

type ManageTab = "overview" | "participants" | "judges" | "submissions" | "lifecycle" | "rubric";

const COMMON_TRACKS = [
  "Developer Tools",
  "AI Infrastructure",
  "Cryptography",
  "Web3 & ZK",
  "Open Source",
  "Security & Privacy",
];

export default function ManageHackathonBySlugPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <ManageHackathonContent />
    </Suspense>
  );
}

function ManageHackathonContent() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const slug = params?.slug || searchParams.get("slug") || "sample-hack-2026";
  const initialTab = (searchParams.get("tab") as ManageTab) || "overview";

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ManageTab>(initialTab);
  const [event, setEvent] = useState<Hackathon | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Sub-data states
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [deleteRegConfirmId, setDeleteRegConfirmId] = useState<string | null>(null);
  const [deletingReg, setDeletingReg] = useState(false);

  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [judgesLoading, setJudgesLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Lifecycle states
  const [submissionsClosed, setSubmissionsClosed] = useState(false);
  const [regDeadline, setRegDeadline] = useState("");
  const [savingLifecycle, setSavingLifecycle] = useState(false);

  // Rubric state
  const [rubricWeights, setRubricWeights] = useState({
    functionality: 40,
    quality: 30,
    innovation: 30,
  });

  // Check auth
  useEffect(() => {
    async function initAuth() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
        if (remote.role !== "organizer" && remote.role !== "admin") {
          toast.error("Organizer permissions required.");
          router.push("/dashboard");
          return;
        }
      } else if (!stored) {
        router.push(`/login?redirect=/manage-events/${slug}`);
        return;
      }
      setAuthLoading(false);
    }
    initAuth();
  }, [router, slug]);

  // Load Hackathon Data
  const loadEventData = async () => {
    setEventLoading(true);
    try {
      const found = await fetchEvent(slug);
      if (found) {
        setEvent(found);
        const deadlineDate = found.submissions_close || found.endDate;
        const isClosed = deadlineDate ? new Date(deadlineDate) <= new Date() : false;
        setSubmissionsClosed(isClosed);
        setRegDeadline(found.registration_deadline || found.submissions_close || "");
      } else {
        toast.error(`Hackathon "${slug}" not found.`);
      }
    } catch (err) {
      console.error("Failed to load hackathon:", err);
      toast.error("Failed to load hackathon data.");
    } finally {
      setEventLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadEventData();
    }
  }, [slug]);

  // Load Registrations
  const loadRegistrations = async () => {
    if (!slug) return;
    setRegistrationsLoading(true);
    try {
      const regs = await fetchEventRegistrations(slug);
      setRegistrations(regs || []);
    } catch {
      toast.error("Failed to load registrations.");
    } finally {
      setRegistrationsLoading(false);
    }
  };

  // Load Judges
  const loadJudgesData = async () => {
    setJudgesLoading(true);
    try {
      const jdgs = await fetchJudges();
      setJudges(jdgs || []);
    } catch {
      toast.error("Failed to load judges list.");
    } finally {
      setJudgesLoading(false);
    }
  };

  // Load Submissions
  const loadProjectsData = async () => {
    if (!slug) return;
    setProjectsLoading(true);
    try {
      const projs = await fetchProjects({ hackathon: slug });
      const filtered = projs.filter(
        (p) =>
          p.hackathonSlug === slug ||
          p.hackathonId === slug ||
          (event?.id && p.hackathonId === event.id)
      );
      setProjects(filtered.length > 0 ? filtered : projs);
    } catch {
      toast.error("Failed to load submitted projects.");
    } finally {
      setProjectsLoading(false);
    }
  };

  // Refresh tab data
  useEffect(() => {
    if (activeTab === "participants") loadRegistrations();
    if (activeTab === "judges") loadJudgesData();
    if (activeTab === "submissions") loadProjectsData();
  }, [activeTab, slug, event?.id]);

  // Handle participant removal
  const handleConfirmRemoveParticipant = async () => {
    if (!deleteRegConfirmId || !event) return;
    setDeletingReg(true);
    try {
      const res = await removeParticipantRegistration(event.id || event.slug, deleteRegConfirmId);
      if (res.success) {
        toast.success("Participant removed from this hackathon.");
        setRegistrations((prev) => prev.filter((r) => r.user_id !== deleteRegConfirmId));
        setEvent((prev) =>
          prev ? { ...prev, participantCount: Math.max(0, prev.participantCount - 1) } : prev
        );
      } else {
        toast.error(res.error || "Failed to remove participant.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove participant.");
    } finally {
      setDeletingReg(false);
      setDeleteRegConfirmId(null);
    }
  };

  // Handle Judge track assignment
  const handleToggleJudgeTrack = async (judge: JudgeData, track: string) => {
    const isAssigned = (judge.tracks || []).includes(track);
    const updatedTracks = isAssigned
      ? (judge.tracks || []).filter((t) => t !== track)
      : [...(judge.tracks || []), track];

    try {
      const res = await updateJudge(judge.id, { tracks: updatedTracks });
      if (res.success && res.judge) {
        toast.success(
          isAssigned
            ? `Removed "${track}" from ${judge.name}`
            : `Assigned "${track}" to ${judge.name}`
        );
        setJudges((prev) =>
          prev.map((j) => (j.id === judge.id ? res.judge! : j))
        );
      } else {
        toast.error(res.error || "Failed to update track assignment.");
      }
    } catch {
      toast.error("Network error while updating judge.");
    }
  };

  // Handle Auto-Assign Judges
  const handleAutoAssignJudges = async () => {
    if (!event) return;
    setAutoAssigning(true);
    try {
      const res = await fetch(`/api/v1/judges/auto-assign?event_id=${event.id || event.slug}&judges_per_track=2`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Judges evenly distributed across tracks!");
        await loadJudgesData();
      } else {
        toast.error("Failed to auto-assign judges.");
      }
    } catch {
      toast.error("Network error while auto-assigning judges.");
    } finally {
      setAutoAssigning(false);
    }
  };

  // Save Lifecycle Changes
  const handleSaveLifecycle = async () => {
    if (!event) return;
    setSavingLifecycle(true);
    try {
      const updatedSubClose = submissionsClosed
        ? new Date(Date.now() - 3600000).toISOString()
        : new Date(Date.now() + 86400000 * 7).toISOString();

      const res = await updateEvent(event.id || event.slug, {
        submissions_close: updatedSubClose,
        registration_deadline: regDeadline || undefined,
        status: submissionsClosed ? "completed" : "live",
      });

      if (res.success && res.event) {
        setEvent(res.event);
        toast.success("Lifecycle & deadline settings updated successfully!");
      } else {
        toast.error(res.error || "Failed to update event lifecycle.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update lifecycle.");
    } finally {
      setSavingLifecycle(false);
    }
  };

  // Save Rubric Weights
  const [savingRubric, setSavingRubric] = useState(false);
  const handleSaveRubric = async () => {
    const total = rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation;
    if (total !== 100) {
      toast.error(`Rubric weights must sum to 100% (currently ${total}%).`);
      return;
    }
    setSavingRubric(true);
    try {
      const criteria = [
        { title: "Functionality & System Reliability", weight: `${rubricWeights.functionality}%`, description: "System operates reliably with automated verification passes." },
        { title: "Code Quality & Architecture", weight: `${rubricWeights.quality}%`, description: "Clean abstractions, minimal dependencies, and solid code structure." },
        { title: "Innovation & Technical Novelty", weight: `${rubricWeights.innovation}%`, description: "Novel problem-solving and unique technical implementation." },
      ];
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const storedUser = JSON.parse(localStorage.getItem("dogfood_user") || "{}");
        if (storedUser?.token) authHeaders["Authorization"] = `Bearer ${storedUser.token}`;
      } catch {}

      const res = await fetch(`/api/v1/events/${event?.id || event?.slug || slug}`, {
        method: "PUT",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({ judging_criteria: criteria }),
      });
      if (res.ok) {
        toast.success("Scoring rubric weights updated and saved to server!");
        setEvent((prev: any) => (prev ? { ...prev, judgingCriteria: criteria } : null));
      } else {
        toast.error("Failed to update rubric weights on server.");
      }
    } catch {
      toast.error("Network error while updating rubric weights.");
    } finally {
      setSavingRubric(false);
    }
  };

  // Column definitions for Participants
  const participantColumns: ColumnDef<RegistrationItem>[] = [
    {
      key: "user_name",
      header: "Participant",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
            {(r.user_name || r.user_email || "U")[0].toUpperCase()}
          </span>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              {r.user_name || r.user_email?.split("@")[0] || "Competitor"}
            </div>
            <div className="font-mono text-[10px] text-slate-400">{r.user_id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "user_email",
      header: "Email Address",
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.user_email || "N/A"}</span>,
    },
    {
      key: "team_id",
      header: "Squad / Team",
      sortable: true,
      render: (r) => (
        <span className="text-xs font-medium text-slate-700">
          {r.team_id ? (
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
              {r.team_id}
            </span>
          ) : (
            <span className="text-slate-400 italic text-[11px]">Solo Builder</span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {r.status || "confirmed"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Registration Date",
      sortable: true,
      render: (r) => (
        <span className="text-xs font-mono text-slate-600">
          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Active"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => (
        <button
          type="button"
          onClick={() => setDeleteRegConfirmId(r.user_id)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          Remove
        </button>
      ),
    },
  ];

  // Column definitions for Submissions
  const projectColumns: ColumnDef<Project>[] = [
    {
      key: "title",
      header: "Submitted Project",
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{p.title}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{p.summary}</div>
        </div>
      ),
    },
    {
      key: "track",
      header: "Track",
      sortable: true,
      render: (p) => (
        <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
          {p.trackLabel || p.track}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (p) => <span className="font-mono text-xs text-slate-600">{p.team}</span>,
    },
    {
      key: "repoUrl",
      header: "Repository",
      render: (p) =>
        p.repoUrl ? (
          <a
            href={p.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-mono"
          >
            <FolderGit2 className="w-3.5 h-3.5" /> Code &rarr;
          </a>
        ) : (
          <span className="text-slate-400 text-xs">None</span>
        ),
    },
    {
      key: "actions",
      header: "Inspect",
      className: "text-right",
      headerClassName: "text-right",
      render: (p) => (
        <Link
          href={`/projects?id=${p.id || p.slug}`}
          className="text-xs font-semibold text-purple-600 hover:underline"
        >
          Inspect &rarr;
        </Link>
      ),
    },
  ];

  if (authLoading || (eventLoading && !event)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold">Hackathon Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested hackathon slug <code className="text-purple-300 font-mono">{slug}</code> could not be found in the database.
        </p>
        <Link
          href="/manage-events"
          className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold"
        >
          &larr; Back to Manage Events Console
        </Link>
      </div>
    );
  }

  const isClosed = event.submissions_close ? new Date(event.submissions_close) <= new Date() : false;
  const tracksList = event.tracks?.map((t: any) => (typeof t === "string" ? t : t.name || t.id)) || COMMON_TRACKS.slice(0, 3);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] w-full bg-slate-50 text-slate-900">
      {/* Organizer Reusable Sidebar */}
      <DashboardSidebar
        role="organizer"
        user={user}
        activeTab="events"
        onTabChange={(tab) => {
          if (tab === "events") router.push("/manage-events");
          else router.push(`/dashboard?tab=${tab}`);
        }}
        navItems={ORGANIZER_NAV}
      />

      {/* Main Hackathon Workspace */}
      <main className="flex-1 overflow-y-auto min-w-0 p-6 sm:p-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link
            href="/manage-events"
            className="hover:text-purple-600 transition-colors flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Hackathons
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-mono font-medium">{event.slug}</span>
        </div>

        {/* Hackathon Management Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-bold">
                {event.categoryLabel || event.category}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isClosed
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isClosed ? (
                  <>
                    <Clock className="w-3 h-3 text-rose-500" /> Submissions Locked
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Hackathon
                  </>
                )}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                slug: {event.slug}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/events?slug=${event.slug}`}
                target="_blank"
                className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Public View
              </Link>
              <Link
                href={`/events/new?edit=${event.slug}`}
                className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </Link>
              <a
                href={`/api/export.csv?hackathon=${encodeURIComponent(event.slug)}`}
                download={`dogfood-${event.slug}-scores.csv`}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </a>
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manage {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {event.tagline}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Prize Pool</div>
              <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                {event.prizeDisplay}
              </div>
            </div>
            <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Registered Builders</div>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {event.participantCount || registrations.length}
              </div>
            </div>
            <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Submitted Builds</div>
              <div className="text-xl font-black text-purple-600 font-mono mt-0.5">
                {event.submissionCount || projects.length}
              </div>
            </div>
            <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Competition Format</div>
              <div className="text-xl font-black text-blue-600 capitalize mt-0.5">
                {event.format}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-2 sm:space-x-4 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Overview & Controls", icon: <Settings className="w-4 h-4" /> },
            { id: "participants", label: `Builders (${registrations.length})`, icon: <Users className="w-4 h-4" /> },
            { id: "judges", label: `Track Judges (${judges.length})`, icon: <ShieldCheck className="w-4 h-4" /> },
            { id: "submissions", label: `Submissions (${projects.length})`, icon: <FolderGit2 className="w-4 h-4" /> },
            { id: "lifecycle", label: "Deadlines & Lifecycle", icon: <Clock className="w-4 h-4" /> },
            { id: "rubric", label: "Rubric Weights", icon: <Scale className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManageTab)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & CONTROLS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Competition Metadata */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Hackathon Specification
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Start Date</span>
                    <span className="text-slate-800 font-mono font-bold mt-1 block">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">End Date</span>
                    <span className="text-slate-800 font-mono font-bold mt-1 block">
                      {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                    <span className="text-slate-800 font-semibold mt-1 block">
                      {event.location}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Host</span>
                    <span className="text-slate-800 font-semibold mt-1 block">{event.host}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Team Limits</span>
                    <span className="text-slate-800 font-mono mt-1 block">{event.teamSizeLimit}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Entry Fee</span>
                    <span className="text-emerald-600 font-bold mt-1 block">{event.entryFeeDisplay}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">Assigned Tracks</span>
                  <div className="flex flex-wrap gap-2">
                    {tracksList.map((trk: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl font-mono font-medium"
                      >
                        {trk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Calibration / Leaderboard Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Score Calibration &amp; Standings</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Evaluations submitted by track judges are automatically calibrated to ensure fair, unbiased scoring across all projects.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Link
                    href={`/results?hackathon=${event.slug}`}
                    className="w-full btn-primary text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    View Calibrated Standings &rarr;
                  </Link>
                  <a
                    href={`/api/export.csv?hackathon=${encodeURIComponent(event.slug)}`}
                    download={`dogfood-${event.slug}-scores.csv`}
                    className="w-full btn-secondary text-xs py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Score Matrix CSV
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUILDERS & REGISTRATIONS */}
        {activeTab === "participants" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Registered Builders</h3>
                <p className="text-xs text-slate-500">
                  Verified competitors registered for {event.title}.
                </p>
              </div>
              <button
                type="button"
                onClick={loadRegistrations}
                className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            <DataTable<RegistrationItem>
              data={registrations}
              columns={participantColumns}
              keyExtractor={(r) => r.user_id}
              pageSize={10}
              searchPlaceholder="Search builders by name, email, or team..."
              loading={registrationsLoading}
              emptyMessage="No participants registered yet. Builders who register on the public event page will appear here."
            />
          </div>
        )}

        {/* TAB 3: JUDGES & TRACKS */}
        {activeTab === "judges" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Track Evaluators &amp; Double-Blind Judges
                </h3>
                <p className="text-xs text-slate-500">
                  Assign judges to specific competition tracks. Backend enforces strict peer score isolation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoAssignJudges}
                  disabled={autoAssigning}
                  className="btn-secondary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  {autoAssigning ? "Auto-Assigning..." : "Auto-Distribute (2 Judges/Track)"}
                </button>
              </div>
            </div>

            {judgesLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {judges.map((j) => (
                  <div
                    key={j.id}
                    className="p-5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center font-mono text-sm border border-purple-200">
                          {j.name[0]}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{j.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{j.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                        {j.id}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Assigned Competition Tracks
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tracksList.map((trackName: string) => {
                          const assigned = (j.tracks || []).includes(trackName);
                          return (
                            <button
                              key={trackName}
                              type="button"
                              onClick={() => handleToggleJudgeTrack(j, trackName)}
                              className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                                assigned
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                              }`}
                            >
                              {assigned && <CheckCircle2 className="w-3 h-3" />}
                              {trackName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Submitted Projects ({projects.length})</h3>
                <p className="text-xs text-slate-500">
                  Codebases and prototypes submitted to {event.title}.
                </p>
              </div>
              <button
                type="button"
                onClick={loadProjectsData}
                className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Submissions
              </button>
            </div>

            <DataTable<Project>
              data={projects}
              columns={projectColumns}
              keyExtractor={(p) => p.id}
              pageSize={10}
              searchPlaceholder="Search submitted projects by title or team..."
              loading={projectsLoading}
              emptyMessage="No project submissions yet. Submitted builds will be displayed here for evaluation."
            />
          </div>
        )}

        {/* TAB 5: LIFECYCLE & DEADLINES */}
        {activeTab === "lifecycle" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lifecycle &amp; Deadlines</h3>
              <p className="text-xs text-slate-500">
                Lock submissions or extend the registration cutoff for this event.
              </p>
            </div>

            <div className="space-y-5 bg-slate-50/60 p-6 rounded-xl border border-slate-200">
              {/* Toggle Submissions */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">Lock Submissions</div>
                  <div className="text-xs text-slate-500">
                    When enabled, competitors cannot submit new projects or modify drafts.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmissionsClosed(!submissionsClosed)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    submissionsClosed ? "bg-rose-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      submissionsClosed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Deadline Date */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Registration Cutoff Date (ISO UTC)
                </label>
                <input
                  type="text"
                  value={regDeadline}
                  onChange={(e) => setRegDeadline(e.target.value)}
                  placeholder="2026-03-01T18:00:00Z"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveLifecycle}
                disabled={savingLifecycle}
                className="w-full btn-primary text-xs py-3 rounded-xl font-bold cursor-pointer"
              >
                {savingLifecycle ? "Saving Lifecycle State..." : "Save Lifecycle Settings"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: RUBRIC WEIGHTS */}
        {activeTab === "rubric" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Scoring Rubric Calibration Weights</h3>
              <p className="text-xs text-slate-500">
                Define the percentage weight of each evaluation axis for this hackathon.
              </p>
            </div>

            <div className="space-y-5 bg-slate-50/60 p-6 rounded-xl border border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Functionality &amp; System Reliability</span>
                  <span className="font-mono text-purple-600">{rubricWeights.functionality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rubricWeights.functionality}
                  onChange={(e) =>
                    setRubricWeights((prev) => ({ ...prev, functionality: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Code Quality &amp; Architecture</span>
                  <span className="font-mono text-blue-600">{rubricWeights.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rubricWeights.quality}
                  onChange={(e) =>
                    setRubricWeights((prev) => ({ ...prev, quality: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Innovation &amp; Technical Novelty</span>
                  <span className="font-mono text-emerald-600">{rubricWeights.innovation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rubricWeights.innovation}
                  onChange={(e) =>
                    setRubricWeights((prev) => ({ ...prev, innovation: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">Total Weight Sum:</span>
                <span
                  className={`font-mono font-bold ${
                    rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation === 100
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation}% / 100%
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveRubric}
                className="w-full btn-primary text-xs py-3 rounded-xl font-bold cursor-pointer"
              >
                Save Rubric Weights
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Dialog for participant removal */}
      <ConfirmDialog
        isOpen={Boolean(deleteRegConfirmId)}
        title="Remove Participant Registration?"
        description="This builder will be unregistered from this hackathon and their team associations will be revoked."
        confirmLabel="Remove Participant"
        variant="danger"
        loading={deletingReg}
        onConfirm={handleConfirmRemoveParticipant}
        onCancel={() => setDeleteRegConfirmId(null)}
      />
    </div>
  );
}
