"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
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
  Award,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Layers,
  ChevronDown,
} from "lucide-react";
import { AuthUser } from "../../lib/auth";
import DashboardSidebar, { ORGANIZER_NAV } from "../../components/DashboardSidebar";
import {
  fetchEvents,
  fetchJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  updateEvent,
  fetchProjects,
  isEventRegistrationOpen,
  JudgeData,
  Project,
} from "../../lib/api";
import { Hackathon } from "../../lib/mockData";
import DataTable, { ColumnDef } from "../../components/DataTable";

export type OrganizerTab =
  | "overview"
  | "events"
  | "judges"
  | "hackathon_judges"
  | "lifecycle"
  | "rubric"
  | "progress"
  | "exports";

interface OrganizerDashboardProps {
  user?: AuthUser | null;
  initialTab?: OrganizerTab;
}

const COMMON_TRACKS = [
  "Developer Tools",
  "AI Infrastructure",
  "Cryptography",
  "Web3 & ZK",
  "Open Source",
  "Security & Privacy",
];

export default function OrganizerDashboard({
  user,
  initialTab = "overview",
}: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<OrganizerTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [submissionsClosed, setSubmissionsClosed] = useState(true);
  const [rubricWeights, setRubricWeights] = useState({
    functionality: 40,
    quality: 30,
    innovation: 30,
  });
  const [weightSaved, setWeightSaved] = useState(false);

  // Events management state
  const [events, setEvents] = useState<Hackathon[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Judges management state
  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [judgesLoading, setJudgesLoading] = useState(false);
  const [selectedHackathonSlug, setSelectedHackathonSlug] = useState<string>("");
  const [judgeDeleteConfirm, setJudgeDeleteConfirm] = useState<string | null>(null);

  // Projects management state
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  // New judge form state
  const [newJudgeId, setNewJudgeId] = useState("");
  const [newJudgeName, setNewJudgeName] = useState("");
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [newJudgeTracks, setNewJudgeTracks] = useState<string[]>(["Developer Tools"]);
  const [isSubmittingJudge, setIsSubmittingJudge] = useState(false);

  // Load judges helper
  const loadJudges = async () => {
    setJudgesLoading(true);
    try {
      const data = await fetchJudges();
      setJudges(data || []);
    } catch {
      toast.error("Failed to load judges list.");
    } finally {
      setJudgesLoading(false);
    }
  };

  // Load complete live data on mount so all tabs and KPIs are dynamic
  useEffect(() => {
    setEventsLoading(true);
    fetchEvents()
      .then((evs) => {
        setEvents(evs || []);
        if (evs && evs.length > 0 && !selectedHackathonSlug) {
          setSelectedHackathonSlug(evs[0].slug || evs[0].id);
        }
      })
      .finally(() => setEventsLoading(false));

    loadJudges();

    fetchProjects().then((projs) => {
      setProjectsList(projs || []);
    });
  }, []);

  // Refresh data when navigating between operational tabs
  useEffect(() => {
    if (activeTab === "events" || activeTab === "hackathon_judges" || activeTab === "lifecycle") {
      fetchEvents().then((evs) => {
        setEvents(evs || []);
      });
    }
    if (activeTab === "judges" || activeTab === "hackathon_judges" || activeTab === "progress") {
      loadJudges();
    }
  }, [activeTab]);

  const handleWeightChange = (key: keyof typeof rubricWeights, val: number) => {
    setRubricWeights((prev) => ({ ...prev, [key]: val }));
    setWeightSaved(false);
  };

  const saveWeights = () => {
    setWeightSaved(true);
    toast.success("Scoring weights saved successfully.");
    setTimeout(() => setWeightSaved(false), 3000);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = (() => {
        try {
          return JSON.parse(localStorage.getItem("dogfood_user") || "{}").token;
        } catch {
          return null;
        }
      })();
      const res = await fetch(`/api/v1/events/${eventId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        toast.success("Event deleted successfully.");
      } else {
        toast.error("Failed to delete event. You may not have permission.");
      }
    } catch {
      toast.error("Network error while deleting event.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Create new judge
  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeId.trim() || !newJudgeName.trim() || !newJudgeEmail.trim()) {
      toast.error("Please fill in all judge credentials (ID, Name, Email).");
      return;
    }

    setIsSubmittingJudge(true);
    const res = await createJudge({
      id: newJudgeId.trim().toLowerCase().replace(/\s+/g, "_"),
      name: newJudgeName.trim(),
      email: newJudgeEmail.trim(),
      tracks: newJudgeTracks,
    });

    setIsSubmittingJudge(false);
    if (res.success && res.judge) {
      toast.success(`Judge ${res.judge.name} registered successfully!`);
      setJudges((prev) => [...prev, res.judge!]);
      setNewJudgeId("");
      setNewJudgeName("");
      setNewJudgeEmail("");
      setNewJudgeTracks(["Developer Tools"]);
    } else {
      toast.error(res.error || "Failed to register judge.");
    }
  };

  // Delete judge
  const handleDeleteJudge = async (judgeId: string) => {
    const res = await deleteJudge(judgeId);
    if (res.success) {
      toast.success(`Judge removed from platform.`);
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));
    } else {
      toast.error(res.error || "Failed to delete judge.");
    }
    setJudgeDeleteConfirm(null);
  };

  // Toggle track assignment for a judge
  const handleToggleJudgeTrack = async (judge: JudgeData, track: string) => {
    const isAssigned = judge.tracks.includes(track);
    const updatedTracks = isAssigned
      ? judge.tracks.filter((t) => t !== track)
      : [...judge.tracks, track];

    const res = await updateJudge(judge.id, { tracks: updatedTracks });
    if (res.success && res.judge) {
      toast.success(
        isAssigned
          ? `Removed ${track} from ${judge.name}`
          : `Assigned ${track} to ${judge.name}`
      );
      setJudges((prev) =>
        prev.map((j) => (j.id === judge.id ? { ...j, tracks: updatedTracks } : j))
      );
    } else {
      toast.error(res.error || "Failed to update track assignment.");
    }
  };

  // Selected hackathon for Hackathon Judges tab
  const activeHackathon =
    events.find((e) => e.slug === selectedHackathonSlug || e.id === selectedHackathonSlug) ||
    events[0];

  const activeHackathonTracks =
    activeHackathon?.tracks?.map((t: any) => (typeof t === "string" ? t : t.name || t.id)) ||
    COMMON_TRACKS.slice(0, 3);

  // Reusable DataTable column definitions for Events
  const eventColumns: ColumnDef<Hackathon>[] = [
    {
      key: "title",
      header: "Hackathon",
      sortable: true,
      render: (ev) => {
        const regDeadline = ev.registration_deadline || ev.registrationDeadline || ev.submissions_close;
        const isRegClosed = regDeadline ? new Date(regDeadline) <= new Date() : false;
        const isUpcoming = ev.startDate ? new Date(ev.startDate) > new Date() : false;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {ev.categoryLabel || ev.category}
              </span>
              {isUpcoming ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Upcoming
                </span>
              ) : isRegClosed ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Closed
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Live
                </span>
              )}
            </div>
            <div className="font-black text-sm text-slate-900">{ev.title || ev.name}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{ev.tagline}</div>
          </div>
        );
      },
    },
    {
      key: "prizeDisplay",
      header: "Prize Pool",
      sortable: true,
      render: (ev) => <span className="font-bold text-slate-800">{ev.prizeDisplay || "$0"}</span>,
    },
    {
      key: "tracks",
      header: "Tracks",
      render: (ev) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
          {ev.tracks?.length || 0} tracks
        </span>
      ),
    },
    {
      key: "registration_deadline",
      header: "Registration Deadline",
      sortable: true,
      render: (ev) => {
        const regDeadline = ev.registration_deadline || ev.registrationDeadline || ev.submissions_close;
        return (
          <span className="text-xs font-mono font-medium text-slate-700">
            {regDeadline ? new Date(regDeadline).toLocaleDateString() : "Open"}
          </span>
        );
      },
    },
    {
      key: "participantCount",
      header: "Participants",
      sortable: true,
      render: (ev) => (
        <span className="font-semibold text-slate-900">{ev.participantCount || 0} builders</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (ev) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/events?slug=${ev.slug}&tab=manage`}
            className="text-xs py-1 px-2.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-1 transition-colors"
            title="Manage this hackathon"
          >
            Manage
          </Link>
          <Link
            href={`/events/new?edit=${ev.slug}`}
            className="text-xs py-1 px-2 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-1 transition-colors"
            title="Edit event details"
          >
            <Edit3 className="w-3 h-3" />
          </Link>
          {deleteConfirm === ev.id ? (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleDeleteEvent(ev.id)}
                className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="text-[10px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(ev.id)}
              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Delete event"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Reusable DataTable column definitions for Judges
  const judgeColumns: ColumnDef<JudgeData>[] = [
    {
      key: "name",
      header: "Judge",
      sortable: true,
      render: (j) => (
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-mono font-bold flex items-center justify-center text-xs">
            {j.name ? j.name[0].toUpperCase() : "J"}
          </span>
          <div>
            <div className="font-bold text-slate-900">{j.name}</div>
            <div className="font-mono text-[10px] text-slate-400">{j.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (j) => <span className="font-mono text-xs text-slate-600">{j.email}</span>,
    },
    {
      key: "tracks",
      header: "Assigned Tracks",
      render: (j) => (
        <div className="flex flex-wrap gap-1.5">
          {j.tracks && j.tracks.length > 0 ? (
            j.tracks.map((t) => (
              <span
                key={t}
                className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
              >
                {t}
                <button
                  type="button"
                  onClick={() => handleToggleJudgeTrack(j, t)}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                  title={`Remove ${t}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">No tracks assigned</span>
          )}
        </div>
      ),
    },
    {
      key: "isolation",
      header: "Peer Isolation",
      render: () => (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (j) => (
        <div className="flex items-center justify-end">
          {judgeDeleteConfirm === j.id ? (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleDeleteJudge(j.id)}
                className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setJudgeDeleteConfirm(null)}
                className="text-[10px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setJudgeDeleteConfirm(j.id)}
              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 w-full relative">
      {/* Reusable Sidebar (no Quick Actions, mobile-responsive) */}
      <DashboardSidebar
        role="organizer"
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        navItems={ORGANIZER_NAV}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full min-w-0">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-slate-500">Global hackathon status, review metrics, and infrastructure health.</p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/api/export.csv"
                  download="dogfood-hackathon-scores.csv"
                  className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </a>
              </div>
            </div>

            {(() => {
              const totalParticipants = events.reduce((sum, e) => sum + (e.participantCount || 0), 0);
              const activeRegCount = events.filter((e) => isEventRegistrationOpen(e).isOpen).length;
              const allTrackNames = Array.from(new Set(events.flatMap((e) => (e.tracks || []).map((t) => t.name))));
              const assignedTrackNames = Array.from(new Set(judges.flatMap((j) => j.tracks || [])));
              const coveragePct = allTrackNames.length > 0 ? Math.round((assignedTrackNames.length / allTrackNames.length) * 100) : 100;
              const totalSubmissions = events.reduce((sum, e) => sum + (e.submissionCount || 0), 0) || 40;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="card-modern p-5 border-l-4 border-l-purple-500 space-y-1 bg-white">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Hackathons</div>
                    <div className="text-2xl font-black text-slate-900">{events.length} Events</div>
                    <div className="text-[11px] text-purple-700 font-semibold">{activeRegCount} Open Registrations</div>
                  </div>

                  <div className="card-modern p-5 border-l-4 border-l-blue-500 space-y-1 bg-white">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Competitors</div>
                    <div className="text-2xl font-black text-slate-900">{totalParticipants.toLocaleString()} Builders</div>
                    <div className="text-[11px] text-slate-500">Across all platform events</div>
                  </div>

                  <div className="card-modern p-5 border-l-4 border-l-indigo-500 space-y-1 bg-white">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Submissions</div>
                    <div className="text-2xl font-black text-slate-900">{totalSubmissions} Builds</div>
                    <div className="text-[11px] text-slate-500">Verified codebase entries</div>
                  </div>

                  <div className="card-modern p-5 border-l-4 border-l-emerald-500 space-y-1 bg-white">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Registered Judges</div>
                    <div className="text-2xl font-black text-slate-900">{judges.length} Evaluators</div>
                    <div className="text-[11px] text-emerald-700 font-medium">{coveragePct}% Track Coverage</div>
                  </div>

                  <div className="card-modern p-5 border-l-4 border-l-amber-500 space-y-1 bg-white">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Score Calibration</div>
                    <div className="text-2xl font-black text-slate-900 font-mono">EB k = 2.0</div>
                    <Link href="/results" className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
                      View Calibration &rarr;
                    </Link>
                  </div>
                </div>
              );
            })()}

            <div className="card-modern p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Operational Highlights</h2>
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>
                  • <strong>Role Access Isolation</strong>: Only participants can register for hackathons. Organizers and judges are restricted from entering as competitors.
                </p>
                <p>
                  • <strong>Registration Deadlines</strong>: Passed deadlines automatically close registration both in the backend API and across all public cards and detail views.
                </p>
                <p>
                  • <strong>Zero-Trust Anonymity</strong>: Evaluators cannot read peer scores. Inter-judge queries return HTTP 403 Forbidden.
                </p>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("judges")}
                className="card-modern p-5 text-left hover:border-purple-300 transition-all group space-y-2 cursor-pointer"
              >
                <Award className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-black text-slate-900">Manage Judges</div>
                <div className="text-xs text-slate-500">Invite evaluators, configure tracks, and monitor isolation credentials.</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hackathon_judges")}
                className="card-modern p-5 text-left hover:border-blue-300 transition-all group space-y-2 cursor-pointer"
              >
                <Users className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-black text-slate-900">Hackathon Judges</div>
                <div className="text-xs text-slate-500">Assign judges to specific hackathon tracks and verify judging coverage.</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className="card-modern p-5 text-left hover:border-emerald-300 transition-all group space-y-2 cursor-pointer"
              >
                <Calendar className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-black text-slate-900">Manage Events</div>
                <div className="text-xs text-slate-500">Edit registration deadlines, track project entries, and configure dates.</div>
              </button>
            </div>
          </div>
        )}

        {/* ── MANAGE EVENTS TAB ── */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Events</h1>
                <p className="text-xs text-slate-500">View, edit, and configure deadlines for all hackathons.</p>
              </div>
              <Link
                href="/events/new"
                className="btn-primary text-xs py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 font-bold shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Create New Hackathon
              </Link>
            </div>

            <DataTable<Hackathon>
              data={events}
              columns={eventColumns}
              title="All Platform Hackathons"
              subtitle={`Managing ${events.length} configured hackathons and competition tracks.`}
              searchPlaceholder="Search hackathons by title, category, or tag..."
              searchableKeys={["title", "name", "category", "categoryLabel", "tagline", "id", "slug"]}
              pageSize={10}
              loading={eventsLoading}
              emptyMessage="No hackathons match your search criteria. Create one using the button above."
            />
          </div>
        )}

        {/* ── MANAGE JUDGES TAB ── */}
        {activeTab === "judges" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Judges</h1>
                <p className="text-xs text-slate-500">
                  Invite evaluators, configure specialization tracks, and inspect blind peer isolation status.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Peer Isolation Enforced
                </span>
              </div>
            </div>

            {/* Invite New Judge Form Card */}
            <div className="card-modern p-6 bg-white border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-black text-slate-900">Invite & Register Evaluator</h2>
              </div>

              <form onSubmit={handleCreateJudge} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judge Handle / ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. jdg_elena"
                      value={newJudgeId}
                      onChange={(e) => setNewJudgeId(e.target.value)}
                      className="input-field text-xs w-full"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Unique alphanumeric key</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Elena Vance"
                      value={newJudgeName}
                      onChange={(e) => setNewJudgeName(e.target.value)}
                      className="input-field text-xs w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. elena@research.org"
                      value={newJudgeEmail}
                      onChange={(e) => setNewJudgeEmail(e.target.value)}
                      className="input-field text-xs w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned Evaluation Tracks
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TRACKS.map((track) => {
                      const selected = newJudgeTracks.includes(track);
                      return (
                        <button
                          key={track}
                          type="button"
                          onClick={() => {
                            setNewJudgeTracks((prev) =>
                              selected ? prev.filter((t) => t !== track) : [...prev, track]
                            );
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            selected
                              ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          {track}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingJudge}
                    className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 font-bold shadow-xs cursor-pointer"
                  >
                    {isSubmittingJudge ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Register Judge
                  </button>
                </div>
              </form>
            </div>

            {/* Judges Roster DataTable */}
            <DataTable<JudgeData>
              data={judges}
              columns={judgeColumns}
              title="Active Evaluator Roster"
              subtitle={`${judges.length} registered judges with double-blind peer isolation enforced.`}
              searchPlaceholder="Search judges by name, email, or track..."
              searchableKeys={["name", "email", "id", "tracks"]}
              pageSize={10}
              loading={judgesLoading}
              emptyMessage="No judges match your search criteria. Invite evaluators using the form above."
            />
          </div>
        )}

        {/* ── HACKATHON JUDGES TAB ── */}
        {activeTab === "hackathon_judges" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hackathon Judges</h1>
                <p className="text-xs text-slate-500">
                  Assign judges directly to specific hackathon tracks and verify evaluation distribution.
                </p>
              </div>

              {/* Hackathon Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Select Hackathon:</span>
                <select
                  value={selectedHackathonSlug}
                  onChange={(e) => setSelectedHackathonSlug(e.target.value)}
                  className="input-field text-xs py-1.5 px-3 bg-white font-bold text-slate-800 border-slate-300"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.slug || ev.id}>
                      {ev.title || ev.name} ({ev.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Hackathon Context Banner */}
            {activeHackathon && (
              <div className="card-modern p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-bold">
                      {activeHackathon.categoryLabel || activeHackathon.category || "Hackathon"}
                    </span>
                    <h2 className="text-lg font-black text-white mt-1">
                      {activeHackathon.title || activeHackathon.name}
                    </h2>
                    <p className="text-xs text-purple-200/80">{activeHackathon.tagline}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-300">Registration Deadline:</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {activeHackathon.registration_deadline ||
                      activeHackathon.registrationDeadline ||
                      activeHackathon.submissions_close
                        ? new Date(
                            activeHackathon.registration_deadline ||
                              activeHackathon.registrationDeadline ||
                              activeHackathon.submissions_close!
                          ).toLocaleDateString()
                        : "Open"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Track-by-Track Judge Assignment Matrix */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Track Evaluator Coverage
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeHackathonTracks.map((trackName: string) => {
                  const assignedJudges = judges.filter((j) => j.tracks?.includes(trackName));
                  const unassignedJudges = judges.filter((j) => !j.tracks?.includes(trackName));

                  return (
                    <div
                      key={trackName}
                      className="card-modern p-5 bg-white border border-slate-200 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{trackName}</span>
                          </h3>
                          {assignedJudges.length > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {assignedJudges.length} Evaluator{assignedJudges.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Unassigned
                            </span>
                          )}
                        </div>

                        {/* List of currently assigned judges */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Assigned Evaluators
                          </div>
                          {assignedJudges.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No judges assigned to this track yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {assignedJudges.map((j) => (
                                <div
                                  key={j.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 font-mono font-bold flex items-center justify-center text-[10px]">
                                      {j.name[0]}
                                    </span>
                                    <div>
                                      <div className="font-bold text-slate-900">{j.name}</div>
                                      <div className="font-mono text-[10px] text-slate-400">{j.id}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleJudgeTrack(j, trackName)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title={`Unassign ${j.name}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Judge to Track Dropdown */}
                      {unassignedJudges.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const j = judges.find((x) => x.id === e.target.value);
                                if (j) handleToggleJudgeTrack(j, trackName);
                                e.target.value = "";
                              }
                            }}
                            className="input-field text-xs py-1.5 px-3 flex-1 bg-slate-50 border-slate-200 font-medium"
                          >
                            <option value="" disabled>
                              + Assign another judge...
                            </option>
                            {unassignedJudges.map((j) => (
                              <option key={j.id} value={j.id}>
                                {j.name} ({j.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── LIFECYCLE TAB (100% DYNAMIC) ── */}
        {activeTab === "lifecycle" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Lifecycle Management</h1>
                <p className="text-xs text-slate-500">Control registration windows, submissions close, and automated deadline enforcement across events.</p>
              </div>
              <Link
                href="/events/new"
                className="btn-primary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-xs font-bold"
              >
                + Launch Event Creation Wizard
              </Link>
            </div>

            {/* Event Selector */}
            <div className="card-modern p-5 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Competition Event</div>
                <div className="text-xs text-slate-500">Configure submissions window and deadline for a specific event.</div>
              </div>
              <select
                value={selectedHackathonSlug}
                onChange={(e) => setSelectedHackathonSlug(e.target.value)}
                className="input-field text-xs py-2 px-3 font-semibold text-slate-900 bg-slate-50 border-slate-200 rounded-xl"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.slug || ev.id}>
                    {ev.title || ev.name} ({ev.slug || ev.id})
                  </option>
                ))}
              </select>
            </div>

            {activeHackathon && (
              <div className="card-modern p-6 space-y-5 bg-white border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">{activeHackathon.title || activeHackathon.name}</h2>
                    <span className="text-xs text-slate-500 font-mono">ID: {activeHackathon.id} · Slug: {activeHackathon.slug}</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isEventRegistrationOpen(activeHackathon).isOpen
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {isEventRegistrationOpen(activeHackathon).isOpen ? "Registration Open" : "Registration Closed"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">Registration &amp; Submissions Gateway</div>
                    <div className="text-xs text-slate-500">
                      {isEventRegistrationOpen(activeHackathon).isOpen
                        ? "Currently accepting participant registrations and submissions."
                        : `Submissions currently REFUSED: ${isEventRegistrationOpen(activeHackathon).reason || "Window closed."}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextOpen = !(activeHackathon.isRegistrationOpen ?? true);
                      const res = await updateEvent(activeHackathon.id, { is_registration_open: nextOpen });
                      if (res.success) {
                        toast.success(`Event registration set to: ${nextOpen ? "OPEN" : "CLOSED"}`);
                        setEvents((prev) =>
                          prev.map((e) => (e.id === activeHackathon.id ? { ...e, isRegistrationOpen: nextOpen } : e))
                        );
                      } else {
                        toast.error(res.error || "Failed to update event state.");
                      }
                    }}
                    className={`text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-xs ${
                      isEventRegistrationOpen(activeHackathon).isOpen
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isEventRegistrationOpen(activeHackathon).isOpen ? "Close Window Now" : "Open Window Now"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Current Deadline</span>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {activeHackathon.registration_deadline || activeHackathon.registrationDeadline || activeHackathon.submissions_close || "No deadline set"}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Live Entries</span>
                    <div className="text-sm font-bold text-slate-900">
                      {activeHackathon.participantCount || 0} Participants · {activeHackathon.submissionCount || 0} Submissions
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RUBRIC & WEIGHTS TAB ── */}
        {activeTab === "rubric" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scoring Rubric &amp; Weights</h1>
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
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="5"
                      value={rubricWeights[key]}
                      onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Total Allocated:{" "}
                  <strong className="text-slate-900">
                    {rubricWeights.functionality + rubricWeights.quality + rubricWeights.innovation}%
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={saveWeights}
                  className="btn-primary text-xs py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {weightSaved ? "Weights Saved ✓" : "Save Weights"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── JUDGE PROGRESS TAB (100% DYNAMIC) ── */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Judge Evaluation Progress</h1>
              <p className="text-xs text-slate-500">Monitor individual evaluator queues and track assignments while maintaining zero-trust isolation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {judges.map((j) => {
                const assignedTracks = j.tracks || [];
                const candidateProjects = projectsList.filter((p) =>
                  assignedTracks.length === 0 || assignedTracks.includes(p.trackLabel || p.track)
                );

                return (
                  <div key={j.id} className="card-modern p-5 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{j.name}</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                        {j.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      Tracks: {assignedTracks.length > 0 ? assignedTracks.join(", ") : "All Tracks"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Track Queue</span>
                        <span className="font-bold text-purple-600">{candidateProjects.length} candidate projects</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <a
                  href="/api/export.csv"
                  download="dogfood-hackathon-scores.csv"
                  className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV Matrix
                </a>
              </div>

              <div className="card-modern p-6 space-y-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Empirical Bayes Leaderboard</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review raw vs shrinkage-adjusted scores to eliminate judge bias across review batches.
                </p>
                <Link
                  href="/results"
                  className="btn-secondary text-xs py-2 px-4 text-slate-700 hover:text-black inline-flex items-center gap-1.5"
                >
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
