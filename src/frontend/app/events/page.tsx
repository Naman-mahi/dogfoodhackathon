"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Scale,
  Award,
  Globe,
  AlertTriangle,
  FolderGit2,
  Users,
  Copy,
  Check,
  Send,
  Plus,
  Trash2,
  Mail,
  Loader2,
  Code2,
  Settings,
  Edit3,
  X,
  Layers,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { HACKATHONS_DATA, Project } from "@/lib/mockData";
import DataTable, { ColumnDef } from "@/components/DataTable";
import {
  fetchEvents,
  fetchRegistrationStatus,
  fetchEventRegistrations,
  removeParticipantRegistration,
  fetchJudges,
  updateJudge,
  fetchProjects,
  JudgeData,
  RegistrationItem,
} from "@/lib/api";
import toast from "react-hot-toast";

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdentifier =
    searchParams.get("slug") || searchParams.get("id") || "sample-hack-2026";
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  // Find the hackathon by slug or id with dynamic API sync
  const [hackathon, setHackathon] = useState(() => {
    return (
      HACKATHONS_DATA.find(
        (h) => h.slug === eventIdentifier || h.id === eventIdentifier
      ) || HACKATHONS_DATA[0]
    );
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    import("@/lib/auth").then(({ getStoredUser, fetchCurrentUser }) => {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);
      fetchCurrentUser().then((u) => {
        if (u) setCurrentUser(u);
      });
    });
  }, []);

  useEffect(() => {
    fetchEvents().then((events) => {
      const found = events.find(
        (h) => h.slug === eventIdentifier || h.id === eventIdentifier
      );
      if (found) {
        setHackathon(found);
        fetchRegistrationStatus(found.id).then((st) => {
          setIsRegistered(st.registered);
        });
      }
    });
  }, [eventIdentifier]);

  // ── Hackathon Management State & Data (Inside Event) ──
  const [manageSubTab, setManageSubTab] = useState<"participants" | "judges" | "submissions" | "overview">("participants");
  const [eventRegistrations, setEventRegistrations] = useState<RegistrationItem[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [hackathonJudges, setHackathonJudges] = useState<JudgeData[]>([]);
  const [judgesLoading, setJudgesLoading] = useState(false);
  const [eventProjects, setEventProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [deleteRegConfirm, setDeleteRegConfirm] = useState<string | null>(null);

  // Sync registrations, judges, and projects when manage tab is opened or event changes
  useEffect(() => {
    if (activeTab === "manage" && (hackathon?.id || hackathon?.slug)) {
      const eventKey = hackathon.id || hackathon.slug;
      setRegistrationsLoading(true);
      fetchEventRegistrations(eventKey).then((regs) => {
        setEventRegistrations(regs);
        setRegistrationsLoading(false);
      });

      setJudgesLoading(true);
      fetchJudges().then((jdgs) => {
        setHackathonJudges(jdgs);
        setJudgesLoading(false);
      });

      setProjectsLoading(true);
      fetchProjects({ hackathon: hackathon.slug || hackathon.id }).then((projs) => {
        const filtered = projs.filter(
          (p) =>
            p.hackathonSlug === hackathon.slug ||
            p.hackathonId === hackathon.id ||
            p.hackathonId === hackathon.slug
        );
        setEventProjects(filtered.length > 0 ? filtered : projs);
        setProjectsLoading(false);
      });
    }
  }, [activeTab, hackathon.id, hackathon.slug]);

  // Remove participant handler
  const handleRemoveParticipant = async (userId: string) => {
    try {
      const res = await removeParticipantRegistration(hackathon.id || hackathon.slug, userId);
      if (res.success) {
        toast.success("Participant removed from this hackathon.");
        setEventRegistrations((prev) => prev.filter((r) => r.user_id !== userId));
        setHackathon((prev) => ({
          ...prev,
          participantCount: Math.max(0, prev.participantCount - 1),
        }));
      } else {
        toast.error(res.error || "Failed to remove participant.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove participant.");
    } finally {
      setDeleteRegConfirm(null);
    }
  };

  // Toggle judge track handler
  const handleToggleJudgeTrack = async (judge: JudgeData, trackName: string) => {
    const hasTrack = (judge.tracks || []).includes(trackName);
    const updatedTracks = hasTrack
      ? (judge.tracks || []).filter((t) => t !== trackName)
      : [...(judge.tracks || []), trackName];

    try {
      const res = await updateJudge(judge.id, { tracks: updatedTracks });
      if (res.success && res.judge) {
        setHackathonJudges((prev) =>
          prev.map((j) => (j.id === judge.id ? res.judge! : j))
        );
        toast.success(
          hasTrack
            ? `Removed ${judge.name} from track "${trackName}"`
            : `Assigned ${judge.name} to track "${trackName}"`
        );
      } else {
        toast.error(res.error || "Failed to update judge tracks.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error updating judge.");
    }
  };

  // Participant DataTable columns
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
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end">
          {deleteRegConfirm === r.user_id ? (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleRemoveParticipant(r.user_id)}
                className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setDeleteRegConfirm(null)}
                className="text-[10px] font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteRegConfirm(r.user_id)}
              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              title="Remove participant from hackathon"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      ),
    },
  ];

  // Hackathon Judge DataTable columns
  const hackathonJudgeColumns: ColumnDef<JudgeData>[] = [
    {
      key: "name",
      header: "Evaluator",
      sortable: true,
      render: (j) => (
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
            {(j.name || "J")[0].toUpperCase()}
          </span>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{j.name}</div>
            <div className="font-mono text-[10px] text-slate-400">{j.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email Address",
      sortable: true,
      render: (j) => <span className="font-mono text-xs text-slate-600">{j.email}</span>,
    },
    {
      key: "event_tracks",
      header: `Assigned Tracks (${hackathon.title})`,
      render: (j) => {
        const eventTrackNames = hackathon.tracks?.map((t) => t.name) || [];
        const matching = (j.tracks || []).filter((t) => eventTrackNames.includes(t));
        return (
          <div className="flex flex-wrap gap-1.5">
            {matching.length > 0 ? (
              matching.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleToggleJudgeTrack(j, t)}
                    className="hover:text-rose-600 transition-colors cursor-pointer"
                    title={`Unassign ${j.name} from ${t}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-400 italic">No tracks in this event</span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Assign Track",
      className: "text-right",
      headerClassName: "text-right",
      render: (j) => {
        const eventTrackNames = hackathon.tracks?.map((t) => t.name) || [];
        const unassigned = eventTrackNames.filter((t) => !j.tracks?.includes(t));
        if (unassigned.length === 0) {
          return (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Covered
            </span>
          );
        }
        return (
          <div className="flex items-center justify-end">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleToggleJudgeTrack(j, e.target.value);
                  e.target.value = "";
                }
              }}
              className="text-[11px] py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="" disabled>+ Assign to Track...</option>
              {unassigned.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        );
      },
    },
  ];

  // Submission DataTable columns
  const submissionColumns: ColumnDef<Project>[] = [
    {
      key: "title",
      header: "Project Submission",
      sortable: true,
      render: (p) => (
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.title}</div>
          <div className="text-xs text-slate-500 line-clamp-1">{p.summary}</div>
        </div>
      ),
    },
    {
      key: "track",
      header: "Track",
      sortable: true,
      render: (p) => (
        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg">
          {p.trackLabel || p.track}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team / Squad",
      sortable: true,
      render: (p) => <span className="text-xs font-medium text-slate-700">{p.team}</span>,
    },
    {
      key: "technologies",
      header: "Tech Stack",
      render: (p) => (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {p.technologies?.slice(0, 3).map((tech) => (
            <span key={tech} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
          {(p.technologies?.length || 0) > 3 && (
            <span className="text-[9px] font-mono text-slate-400">+{p.technologies.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Links & Review",
      className: "text-right",
      headerClassName: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Repository"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
            </a>
          )}
          {p.demoUrl && (
            <a
              href={p.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Live Demo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Link
            href={`/projects/${p.slug}`}
            className="text-xs py-1 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
          >
            Review
          </Link>
        </div>
      ),
    },
  ];

  const handleToggleRegister = async () => {
    const { getStoredUser } = await import("@/lib/auth");
    const user = getStoredUser();
    if (!user) {
      toast.error("Please sign in to register for hackathons.");
      router.push(`/login?redirect=/events?slug=${hackathon.slug || eventIdentifier}`);
      return;
    }

    // Role check: Only participants can register
    if (user.role && user.role !== "participant") {
      toast.error(`Only participants can register for hackathons. You are signed in as an '${user.role}'.`);
      return;
    }

    const { registerForEvent, unregisterFromEvent, isEventRegistrationOpen } = await import("@/lib/api");

    // Registration deadline check
    if (!isRegistered) {
      const regStatus = isEventRegistrationOpen(hackathon);
      if (!regStatus.isOpen) {
        toast.error(`Registration for "${hackathon.title}" has closed. ${regStatus.reason || ""}`);
        return;
      }
    }

    setRegistering(true);
    try {
      if (isRegistered) {
        const res = await unregisterFromEvent(hackathon.id);
        if (res.success) {
          setIsRegistered(false);
          setHackathon((prev) => ({
            ...prev,
            participantCount: res.participantCount ?? Math.max(0, prev.participantCount - 1),
          }));
          toast.success("Unregistered from hackathon.");
        } else {
          toast.error(res.error || "Failed to unregister.");
        }
      } else {
        const res = await registerForEvent(hackathon.id);
        if (res.success) {
          setIsRegistered(true);
          setHackathon((prev) => ({
            ...prev,
            participantCount: res.participantCount ?? (prev.participantCount + 1),
          }));
          toast.success(res.message || "Registered successfully! Confirmation email sent.");
        } else {
          toast.error(res.error || "Failed to register for hackathon.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update registration status.");
    } finally {
      setRegistering(false);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const slug = hackathon.slug || eventIdentifier;
    router.push(`/events?slug=${slug}&tab=${tabId}`);
  };

  // Timeline and Registration deadline checks
  const formattedStartDate = new Date(hackathon.startDate).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const formattedEndDate = new Date(hackathon.endDate).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  const deadlineDate = hackathon.submissions_close || hackathon.endDate;
  const isClosed = deadlineDate ? new Date(deadlineDate) <= new Date() : false;

  const regDeadlineDate = hackathon.registration_deadline || hackathon.submissions_close || hackathon.endDate;
  const isRegClosed = regDeadlineDate ? new Date(regDeadlineDate) <= new Date() : false;
  const formattedRegDeadline = regDeadlineDate
    ? new Date(regDeadlineDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : formattedEndDate;

  // Project Submission Form State
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    summary: "",
    track: hackathon.tracks?.[0]?.name || "General Track",
    problem: "",
    solution: "",
    repoUrl: "",
    demoUrl: "",
  });
  const [submitSubmitting, setSubmitSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSubmitting(true);
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);

    try {
      const pid = `prj_${Date.now().toString(36)}`;
      const slug = submissionForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const payload = {
        id: pid,
        slug: slug,
        title: submissionForm.title,
        summary: submissionForm.summary,
        track: submissionForm.track,
        track_label: submissionForm.track,
        team: "Autonomous Builders Squad",
        repo_url: submissionForm.repoUrl || "https://github.com/dogfood-hackathon/submission",
        demo_url: submissionForm.demoUrl || "https://demo.dogfood.dev",
        problem: submissionForm.problem,
        solution: submissionForm.solution,
        hackathon_id: hackathon.id || hackathon.slug,
        hackathon_slug: hackathon.slug,
        technologies: ["TypeScript", "FastAPI", "React", "Docker"],
      };

      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("dogfood_user") || "{}"); } catch { return {}; } })();
      const authToken = storedUser?.token;

      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit project.");
      }

      const successText = `Project "${submissionForm.title}" submitted successfully to ${hackathon.title}! Confirmation email sent.`;
      setSubmitSuccessMsg(successText);
      toast.success(successText);
      setHackathon((prev) => ({
        ...prev,
        submissionCount: prev.submissionCount + 1,
      }));
    } catch (err: any) {
      setSubmitErrorMsg(err.message || "Failed to submit project.");
      toast.error(err.message || "Failed to submit project.");
    } finally {
      setSubmitSubmitting(false);
    }
  };

  // Team squad state per hackathon
  const [teamMembers, setTeamMembers] = useState([
    { name: "Ada Lovelace", email: "ada@example.org", role: "Team Lead / Architect" },
    { name: "David K.", email: "david.k@example.org", role: "Backend Engineer" },
  ]);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const teamInviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/join-team?event=${hackathon.slug}&team=tm_squad_${hackathon.slug.slice(0, 5)}&token=inv_98f12`
    : `http://localhost:8080/join-team?event=${hackathon.slug}&team=tm_squad_${hackathon.slug.slice(0, 5)}&token=inv_98f12`;

  const handleCopyInviteLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(teamInviteLink);
      setInviteCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      const { inviteTeammate } = await import("@/lib/api");
      const res = await inviteTeammate(hackathon.id || hackathon.slug, inviteEmail, undefined, teamInviteLink);
      if (res.success) {
        if (!pendingInvites.includes(inviteEmail)) {
          setPendingInvites([...pendingInvites, inviteEmail]);
        }
        toast.success(res.message || `Invitation sent to ${inviteEmail}!`);
        setInviteEmail("");
      } else {
        toast.error(res.message || "Failed to send invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tracks", label: "Tracks & Bounties" },
    { id: "schedule", label: "Timeline & Schedule" },
    { id: "submit", label: "Submit Project" },
    { id: "teams", label: "Teams & Teammates" },
    { id: "rules", label: "Rules & Eligibility" },
    { id: "prizes", label: "Prizes & Honors" },
    { id: "faq", label: "FAQ" },
    { id: "manage", label: "Manage Event" },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Event Header Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                hackathon.status === "live"
                  ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                  : hackathon.status === "upcoming"
                  ? "bg-blue-500/20 border border-blue-400/30 text-blue-300"
                  : "bg-slate-500/20 border border-slate-400/30 text-slate-300"
              }`}
            >
              {hackathon.status === "live" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
              {hackathon.status === "live"
                ? "Live Hackathon"
                : hackathon.status === "upcoming"
                ? "Upcoming Event"
                : "Completed Event"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
              {hackathon.location}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
              {hackathon.categoryLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === "organizer" && (
              <button
                type="button"
                onClick={() => handleTabClick("manage")}
                className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" /> Manage Event
              </button>
            )}
            <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              slug: {hackathon.slug}
            </span>
          </div>
        </div>

        {/* Clean Main Heading without icons */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {hackathon.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {hackathon.tagline}
          </p>
        </div>

        {/* Highlight Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 pt-6 border-t border-white/10">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {hackathon.prizeDisplay}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Total Prize Pool
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.entryFeeDisplay}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Entry Type
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.participantCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Registered Builders
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-white">
              {hackathon.submissionCount > 0
                ? `${hackathon.submissionCount} Builds`
                : "Open"}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Submissions
            </div>
          </div>
          <div className="space-y-1">
            <div
              className={`text-xl sm:text-2xl font-black ${
                isRegClosed ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {isRegClosed ? "Closed" : "Open"}
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">
              Registration ({formattedRegDeadline})
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            disabled={registering || (!isRegistered && isRegClosed)}
            onClick={handleToggleRegister}
            className={`inline-flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-full transition-all ${
              isRegistered
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/40"
                : isRegClosed
                ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
            }`}
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegistered ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Registered Participant ✓
              </>
            ) : isRegClosed ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Registration Closed ({formattedRegDeadline})
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Register for Hackathon
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("submit")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all shadow-md shadow-blue-600/30"
          >
            Submit Hackathon Project
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("teams")}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-6 py-3 rounded-full transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Team &amp; Invites
          </button>
          <Link
            href="/hackathons"
            className="text-slate-400 hover:text-white font-semibold text-xs px-4 py-3 rounded-full transition-all"
          >
            View All Hackathons
          </Link>
        </div>
      </div>

      {/* TABS NAVIGATION - Bound to URL search params ?tab=... */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="card-modern p-6 sm:p-10 shadow-xs">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">
                About {hackathon.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {hackathon.overview?.description}
              </p>
            </div>

            {/* Highlights Grid */}
            {hackathon.overview?.highlights && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {hackathon.overview.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <h3 className="font-bold text-sm text-slate-900">
                      {highlight.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRACKS & BOUNTIES */}
        {activeTab === "tracks" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Competition Tracks &amp; Bounties
              </h2>
              <p className="text-xs text-slate-500">
                Select your focus area and submit your codebase to compete for dedicated bounties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {hackathon.tracks?.map((track, idx) => (
                <div
                  key={track.id || idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                      Track #{idx + 1}
                    </span>
                    <h3 className="font-black text-base text-slate-900">{track.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {track.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Bounty:</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      {track.prize}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE & SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Official Hackathon Schedule
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Track phase milestones from sprint kickoff through double-blind score calibration.
              </p>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 my-6">
              {hackathon.timeline?.map((milestone, idx) => (
                <div key={milestone.id || idx} className="relative group">
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
                      milestone.status === "completed"
                        ? "border-emerald-500 bg-emerald-500"
                        : milestone.status === "active"
                        ? "border-blue-600 ring-4 ring-blue-100 animate-pulse"
                        : "border-slate-300"
                    }`}
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          milestone.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : milestone.status === "active"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {milestone.statusLabel || milestone.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {milestone.timestamp}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {milestone.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMIT PROJECT (With Timeline Deadline Enforcement) */}
        {activeTab === "submit" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Project Submission &amp; Verification
              </h2>
              <p className="text-xs text-slate-500">
                Submit your project codebase, repository link, and problem brief before the hard lock.
              </p>
            </div>

            {/* Timeline Lock Alert if passed */}
            {isClosed ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-4">
                <div className="flex items-center gap-2 font-bold text-base text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  Submissions Window Closed ({new Date(deadlineDate).toISOString()})
                </div>
                <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                  In strict compliance with DOGFOOD 2026 Tier 1 specifications, the submissions deadline has elapsed. The portal strictly locks new submissions and modifications (HTTP 4xx refused) while double-blind peer evaluations take place.
                </p>
                <div className="pt-2 flex gap-3">
                  <Link
                    href="/projects"
                    className="btn-primary text-xs py-2.5 px-5 bg-amber-700 hover:bg-amber-800 text-white font-bold inline-flex items-center gap-2"
                  >
                    Browse Submitted Projects in Gallery <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Active Submission Form */
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Submissions are currently <strong>OPEN</strong>. Submissions close on {new Date(deadlineDate).toLocaleString()}.</span>
                  </div>
                </div>

                {submitSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{submitSuccessMsg}</span>
                  </div>
                )}

                {submitErrorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{submitErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitProject} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                      <input
                        type="text"
                        required
                        value={submissionForm.title}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                        placeholder="e.g. Distributed State Synchronizer"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Track</label>
                      <select
                        value={submissionForm.track}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, track: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {hackathon.tracks?.map((t) => (
                          <option key={t.id} value={t.name}>{t.name} ({t.prize})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">One-Line Summary</label>
                    <input
                      type="text"
                      required
                      value={submissionForm.summary}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, summary: e.target.value })}
                      placeholder="Brief overview of what this project accomplishes."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Problem</label>
                      <textarea
                        rows={3}
                        required
                        value={submissionForm.problem}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, problem: e.target.value })}
                        placeholder="What specific issue does this submission address?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Engineered Solution</label>
                      <textarea
                        rows={3}
                        required
                        value={submissionForm.solution}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, solution: e.target.value })}
                        placeholder="How did your team solve the problem architecturally?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Public Git Repository URL</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <FolderGit2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                        <input
                          type="url"
                          required
                          value={submissionForm.repoUrl}
                          onChange={(e) => setSubmissionForm({ ...submissionForm, repoUrl: e.target.value })}
                          placeholder="https://github.com/my-squad/project"
                          className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Live Demo / Deployment URL (optional)</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <ExternalLink className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                        <input
                          type="url"
                          value={submissionForm.demoUrl}
                          onChange={(e) => setSubmissionForm({ ...submissionForm, demoUrl: e.target.value })}
                          placeholder="https://demo.dogfood.dev"
                          className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitSubmitting}
                      className="btn-primary text-xs py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-bold shadow-md shadow-blue-600/20"
                    >
                      {submitSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting Project...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Project to Hackathon
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TEAMS & TEAMMATES (Per Hackathon Squad & Invite Links) */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Team Squad &amp; Teammate Invitations
              </h2>
              <p className="text-xs text-slate-500">
                Squad membership is scoped strictly per hackathon ({hackathon.title}). Form your squad and invite collaborators.
              </p>
            </div>

            {/* Unique Shareable Invite Link Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" /> Shareable Team Invite Link
                </span>
                <span className="text-[10px] font-mono bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded font-bold">
                  Scoped to {hackathon.slug}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={teamInviteLink}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-purple-950 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                    inviteCopied
                      ? "bg-emerald-600 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {inviteCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Invite Link
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-purple-700">
                Share this link with your teammates. When they open it, they will join this hackathon squad immediately.
              </p>
            </div>

            {/* Direct Email Invite Form */}
            <form onSubmit={handleSendEmailInvite} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800">
                Invite Teammate by Email
              </div>
              <div className="flex gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1">
                  <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.org"
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Invite
                </button>
              </div>
            </form>

            {/* Current Squad Members Roster */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900">
                Current Squad Roster ({teamMembers.length + pendingInvites.length} members)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {m.role}
                    </span>
                  </div>
                ))}

                {pendingInvites.map((email, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        ✉️
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-900">{email}</div>
                        <div className="text-[10px] text-amber-700">Invitation Sent (Pending Acceptance)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded font-bold">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RULES & ELIGIBILITY */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Rules &amp; Code of Conduct
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hackathon.rules?.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <h3 className="font-bold text-slate-900 text-sm">
                    {rule.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: PRIZES & HONORS */}
        {activeTab === "prizes" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Prizes &amp; Honors
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Total prize pool of {hackathon.prizeDisplay} sponsored by {hackathon.host}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {hackathon.prizes?.map((prize, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 text-center space-y-2 shadow-xs border ${
                    idx === 0
                      ? "border-amber-200 bg-amber-50/50"
                      : idx === 1
                      ? "border-slate-200 bg-slate-50"
                      : "border-orange-200 bg-orange-50/50"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      idx === 0
                        ? "text-amber-700 bg-amber-100/60"
                        : idx === 1
                        ? "text-slate-700 bg-slate-200"
                        : "text-orange-700 bg-orange-100/60"
                    }`}
                  >
                    {prize.place}
                  </span>
                  <div className="font-black text-2xl text-slate-900 pt-1">
                    {prize.amount}
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    {prize.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {prize.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: FAQ */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              {hackathon.faqs?.map((faq) => (
                <div
                  key={faq.id}
                  className="p-5 rounded-2xl border border-slate-200 space-y-1"
                >
                  <h3 className="font-bold text-slate-900">{faq.question}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: MANAGE EVENT (Inside Event Page) */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">
                    {hackathon.categoryLabel || hackathon.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {hackathon.id}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Manage {hackathon.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Control competitor registrations, track judge assignments, submitted builds, and lifecycle deadlines.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/new?edit=${hackathon.slug}`}
                  className="btn-primary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 font-bold shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Event Details
                </Link>
                <Link
                  href="/manage-events"
                  className="btn-secondary text-xs py-2 px-4 text-slate-700 hover:text-black flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  All Events Console
                </Link>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setManageSubTab("participants")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  manageSubTab === "participants"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Participants</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  manageSubTab === "participants" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {eventRegistrations.length || hackathon.participantCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab("judges")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  manageSubTab === "judges"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Hackathon Judges</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  manageSubTab === "judges" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {hackathonJudges.filter((j) =>
                    j.tracks?.some((t) => hackathon.tracks?.some((ht) => ht.name === t))
                  ).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab("submissions")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  manageSubTab === "submissions"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Submissions</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  manageSubTab === "submissions" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {eventProjects.length || hackathon.submissionCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab("overview")}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  manageSubTab === "overview"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Deadlines &amp; KPIs</span>
              </button>
            </div>

            {/* SUB-TAB 1: PARTICIPANTS / REGISTERED USERS */}
            {manageSubTab === "participants" && (
              <div className="space-y-4">
                <DataTable<RegistrationItem>
                  data={eventRegistrations}
                  columns={participantColumns}
                  title={`Registered Competitors (${eventRegistrations.length})`}
                  subtitle={`Manage registered users participating in ${hackathon.title}. Only competitors are registered.`}
                  searchPlaceholder="Search participants by name, email, user ID, or squad..."
                  searchableKeys={["user_name", "user_email", "user_id", "team_id", "status"]}
                  pageSize={10}
                  loading={registrationsLoading}
                  emptyMessage="No competitors have registered for this hackathon yet."
                  actions={
                    <button
                      type="button"
                      onClick={() => handleTabClick("teams")}
                      className="text-xs py-1.5 px-3 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" /> Invite Teammates
                    </button>
                  }
                />
              </div>
            )}

            {/* SUB-TAB 2: HACKATHON JUDGES */}
            {manageSubTab === "judges" && (
              <div className="space-y-6">
                {/* Track Coverage Overview Banner */}
                <div className="card-modern p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-700" />
                      Track Evaluation Coverage
                    </h3>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-200/70 px-2 py-0.5 rounded font-bold">
                      {hackathon.tracks?.length || 0} Competition Tracks
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hackathon.tracks?.map((track) => {
                      const count = hackathonJudges.filter((j) => j.tracks?.includes(track.name)).length;
                      return (
                        <div
                          key={track.name}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            count > 0
                              ? "bg-white border-purple-200 text-purple-900 shadow-2xs"
                              : "bg-amber-50 border-amber-200 text-amber-900"
                          }`}
                        >
                          <span className="font-bold">{track.name}</span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              count > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-800"
                            }`}
                          >
                            {count} judge{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hackathon Judges DataTable */}
                <DataTable<JudgeData>
                  data={hackathonJudges}
                  columns={hackathonJudgeColumns}
                  title="Hackathon Judges & Track Assignments"
                  subtitle={`Assign or remove evaluator track specializations specifically for ${hackathon.title}.`}
                  searchPlaceholder="Search judges by name, email, or track..."
                  searchableKeys={["name", "email", "id", "tracks"]}
                  pageSize={10}
                  loading={judgesLoading}
                  emptyMessage="No judges available in the roster. Add platform judges in the Judges Console."
                  actions={
                    <Link
                      href="/manage-judges"
                      className="text-xs py-1.5 px-3 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Invite Evaluator
                    </Link>
                  }
                />
              </div>
            )}

            {/* SUB-TAB 3: SUBMISSIONS */}
            {manageSubTab === "submissions" && (
              <div className="space-y-4">
                <DataTable<Project>
                  data={eventProjects}
                  columns={submissionColumns}
                  title={`Project Submissions (${eventProjects.length})`}
                  subtitle={`Review projects, repository sources, and live deployments submitted to ${hackathon.title}.`}
                  searchPlaceholder="Search projects by title, summary, track, or tech..."
                  searchableKeys={["title", "summary", "track", "trackLabel", "team", "technologies"]}
                  pageSize={10}
                  loading={projectsLoading}
                  emptyMessage="No projects submitted for this hackathon yet."
                  actions={
                    <button
                      type="button"
                      onClick={() => handleTabClick("submit")}
                      className="text-xs py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Project
                    </button>
                  }
                />
              </div>
            )}

            {/* SUB-TAB 4: DEADLINES & OVERVIEW */}
            {manageSubTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-modern p-5 bg-white border border-slate-200 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Registration Window</div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${isRegClosed ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <span className="text-base font-bold text-slate-900">{isRegClosed ? "Registration Closed" : "Registration Open"}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Last date to register: <strong className="text-slate-800">{formattedRegDeadline}</strong>
                    </p>
                  </div>

                  <div className="card-modern p-5 bg-white border border-slate-200 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Entries</div>
                    <div className="text-2xl font-black text-slate-900">{eventRegistrations.length || hackathon.participantCount} Participants</div>
                    <p className="text-xs text-slate-500">{eventProjects.length || hackathon.submissionCount} projects submitted</p>
                  </div>

                  <div className="card-modern p-5 bg-white border border-slate-200 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tracks &amp; Bounties</div>
                    <div className="text-2xl font-black text-slate-900">{hackathon.tracks?.length || 0} Tracks</div>
                    <button
                      type="button"
                      onClick={() => setManageSubTab("judges")}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Configure Track Judges &rarr;
                    </button>
                  </div>
                </div>

                <div className="card-modern p-6 bg-slate-50 border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Direct Navigation &amp; Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/manage-events"
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all block space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-900">Manage Events Roster</div>
                      <div className="text-[11px] text-slate-500">View and manage all platform hackathons</div>
                    </Link>
                    <Link
                      href="/manage-judges"
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all block space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-900">Manage Judges Roster</div>
                      <div className="text-[11px] text-slate-500">Invite, configure, and inspect evaluators</div>
                    </Link>
                    <Link
                      href="/hackathon-judges"
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all block space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-900">Hackathon Judges Matrix</div>
                      <div className="text-[11px] text-slate-500">Assign judges to specific track categories</div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading event details...
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
