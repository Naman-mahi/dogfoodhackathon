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
import { Hackathon, Project } from "@/lib/types";
import {
  fetchEvents,
  fetchEvent,
  fetchRegistrationStatus,
} from "@/lib/api";
import toast from "react-hot-toast";
import DashboardSidebar from "@/components/DashboardSidebar";

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdentifier =
    searchParams.get("slug") || searchParams.get("id") || "sample-hack-2026";
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab === "manage" ? "overview" : initialTab);

  // If user requests tab=manage on public event page, redirect them to organizer console
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "manage") {
      router.replace(`/manage-events/${eventIdentifier}`);
      return;
    }
    if (t) setActiveTab(t);
  }, [searchParams, eventIdentifier, router]);

  // Live Hackathon state from database (no mockData fallback)
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

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
    setEventLoading(true);
    fetchEvent(eventIdentifier)
      .then((found) => {
        if (found) {
          setHackathon(found);
          fetchRegistrationStatus(found.id || found.slug).then((st) => {
            setIsRegistered(st.registered);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load hackathon:", err);
      })
      .finally(() => setEventLoading(false));
  }, [eventIdentifier]);



  const handleToggleRegister = async () => {
    if (!hackathon) return;
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
    const slug = hackathon?.slug || eventIdentifier;
    router.push(`/events?slug=${slug}&tab=${tabId}`);
  };

  // Timeline and Registration deadline checks safely guarded against null hackathon
  const formattedStartDate = hackathon?.startDate
    ? new Date(hackathon.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";
  const formattedEndDate = hackathon?.endDate
    ? new Date(hackathon.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

  const deadlineDate = hackathon?.submissions_close || hackathon?.endDate;
  const isClosed = deadlineDate ? new Date(deadlineDate) <= new Date() : false;

  const regDeadlineDate = hackathon?.registration_deadline || hackathon?.submissions_close || hackathon?.endDate;
  const isRegClosed = regDeadlineDate ? new Date(regDeadlineDate) <= new Date() : false;
  const formattedRegDeadline = regDeadlineDate
    ? new Date(regDeadlineDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : formattedEndDate;

  // Project Submission Form State
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    summary: "",
    track: hackathon?.tracks?.[0]?.name || "General Track",
    problem: "",
    solution: "",
    repoUrl: "",
    demoUrl: "",
  });

  useEffect(() => {
    if (hackathon?.tracks?.[0]?.name) {
      setSubmissionForm((prev) => ({
        ...prev,
        track: prev.track && prev.track !== "General Track" ? prev.track : hackathon.tracks[0].name,
      }));
    }
  }, [hackathon]);

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
        hackathon_id: hackathon?.id || hackathon?.slug || eventIdentifier,
        hackathon_slug: hackathon?.slug || eventIdentifier,
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

      const successText = `Project "${submissionForm.title}" submitted successfully to ${hackathon?.title || "hackathon"}! Confirmation email sent.`;
      setSubmitSuccessMsg(successText);
      toast.success(successText);
      setHackathon((prev) => (prev ? {
        ...prev,
        submissionCount: prev.submissionCount + 1,
      } : null));
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

  const teamInviteLink = typeof window !== "undefined" && hackathon
    ? `${window.location.origin}/join-team?event=${hackathon.slug}&team=tm_squad_${hackathon.slug.slice(0, 5)}&token=inv_98f12`
    : `http://localhost:8080/join-team?event=${eventIdentifier}&team=tm_squad&token=inv_98f12`;

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
  ];

  if (eventLoading && !hackathon) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-xs text-slate-500 font-mono">Loading hackathon experience...</span>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-2xl font-black text-slate-900">Hackathon Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md">
          The requested hackathon could not be found in the database.
        </p>
        <Link href="/hackathons" className="btn-primary text-xs py-2.5 px-6 font-bold">
          Explore All Hackathons
        </Link>
      </div>
    );
  }

  const content = (
    <div className="w-full space-y-8">
      {/* Event Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                hackathon.status === "live"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : hackathon.status === "upcoming"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {hackathon.status === "live" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              {hackathon.status === "live"
                ? "Live Hackathon"
                : hackathon.status === "upcoming"
                ? "Upcoming Event"
                : "Completed Event"}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              {hackathon.location}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              {hackathon.categoryLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(currentUser?.role === "organizer" || currentUser?.role === "admin") && (
              <Link
                href={`/manage-events/${hackathon.slug}`}
                className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Manage Hackathon
              </Link>
            )}
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              slug: {hackathon.slug}
            </span>
          </div>
        </div>

        {/* Clean Main Heading without icons */}
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {hackathon.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {hackathon.tagline}
          </p>
        </div>

        {/* Highlight Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-slate-100">
          <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {hackathon.prizeDisplay}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              Total Prize Pool
            </div>
          </div>
          <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {hackathon.entryFeeDisplay}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              Entry Type
            </div>
          </div>
          <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {hackathon.participantCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              Registered Builders
            </div>
          </div>
          <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {hackathon.submissionCount > 0
                ? `${hackathon.submissionCount} Builds`
                : "Open"}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              Submissions
            </div>
          </div>
          <div className="card-modern p-4 bg-slate-50/70 border border-slate-200 space-y-1">
            <div
              className={`text-xl sm:text-2xl font-black ${
                isRegClosed ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {isRegClosed ? "Closed" : "Open"}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
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
            className={`inline-flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer ${
              isRegistered
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                : isRegClosed
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "btn-primary shadow-sm"
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
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Registration Closed ({formattedRegDeadline})
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
            className="inline-flex items-center gap-2 btn-primary font-semibold text-xs px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Submit Hackathon Project
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("teams")}
            className="btn-secondary font-semibold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-600" />
            Manage Team &amp; Invites
          </button>
          <Link
            href="/hackathons"
            className="text-slate-600 hover:text-slate-900 font-semibold text-xs px-4 py-3 transition-colors"
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

      </div>
    </div>
  );

  if (currentUser && currentUser.role) {
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] w-full bg-slate-50/30">
        <DashboardSidebar
          role={currentUser.role}
          user={currentUser}
          activeTab="events"
          onTabChange={(tab) => {
            if (tab === "events") router.push("/manage-events");
            else router.push(`/dashboard?tab=${tab}`);
          }}
        />
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {content}
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {content}
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
