"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Users,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Mail,
  FolderGit2,
  ExternalLink,
  Loader2,
  PlusCircle,
  ShieldAlert,
  Edit3,
} from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import {
  fetchEvents,
  fetchRegistrationStatus,
  registerForEvent,
  fetchMySubmission,
  submitProject,
  inviteTeammate,
  EventData,
  Project,
} from "@/lib/api";
import toast from "react-hot-toast";

// ─── Tabs ────────────────────────────────────────────────────────────────────
type TabId = "overview" | "tracks" | "teams" | "submissions";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",     label: "Overview",     icon: <Calendar className="w-4 h-4" /> },
  { id: "tracks",       label: "Tracks",       icon: <Trophy className="w-4 h-4" /> },
  { id: "teams",        label: "Teams",        icon: <Users className="w-4 h-4" /> },
  { id: "submissions",  label: "Submissions",  icon: <Send className="w-4 h-4" /> },
];

export default function HackathonDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug;
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || "overview");

  const [user, setUser] = useState<AuthUser | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Existing Submission state
  const [existingSubmission, setExistingSubmission] = useState<Project | null>(null);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  // Team state
  const [inviteInput, setInviteInput] = useState("");
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Submission state
  const [submitForm, setSubmitForm] = useState({
    title: "", repo_url: "", demo_url: "", summary: "", track: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Sync URL tab param → state
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  useEffect(() => {
    async function load() {
      const stored = getStoredUser();
      if (stored) setUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) setUser(remote);

      const events = await fetchEvents();
      const found = events?.find((e) => e.slug === slug || e.id === slug);
      setEvent(found || null);

      if (found) {
        // Check registration status from backend API
        const regStatus = await fetchRegistrationStatus(found.id);
        setIsRegistered(regStatus.registered);

        // Check if user has an existing submission for this hackathon
        const sub = await fetchMySubmission(found.id);
        if (sub) {
          setExistingSubmission(sub);
          setSubmitForm({
            title: sub.title || "",
            repo_url: sub.repoUrl || "",
            demo_url: sub.demoUrl || "",
            summary: sub.summary || "",
            track: sub.track || found.tracks?.[0]?.name || "",
          });
        } else if (found.tracks && found.tracks.length > 0) {
          setSubmitForm((f) => ({ ...f, track: found.tracks[0].name }));
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Access guard: only participants can view this page
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h1 className="text-xl font-black text-slate-900">Sign In Required</h1>
        <Link href="/login" className="btn-primary text-xs py-2.5 px-6 inline-block">Sign In</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-black text-slate-900">Hackathon Not Found</h1>
        <p className="text-xs text-slate-500">No hackathon found with slug: <code className="font-mono">{slug}</code></p>
        <Link href="/dashboard" className="btn-primary text-xs py-2.5 px-6 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const isClosed = event.submissions_close ? new Date(event.submissions_close) <= new Date() : false;
  const isUpcoming = event.startDate ? new Date(event.startDate) > new Date() : false;

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join-team?event=${event.slug}&team=tm_${event.slug.slice(0, 6)}&token=inv_${Math.random().toString(36).slice(2, 8)}`
    : `http://localhost:8080/join-team?event=${event.slug}&team=tm_${event.slug.slice(0, 6)}&token=inv_98a7`;

  const handleCopyInvite = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Shareable invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddInvite = async () => {
    if (!inviteInput || !inviteInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const emailToInvite = inviteInput;
    try {
      const res = await inviteTeammate(event.id, emailToInvite, undefined, inviteUrl);
      if (res.success) {
        setPendingInvites((prev) => [...prev, emailToInvite]);
        setInviteInput("");
        toast.success(res.message || `Invitation sent to ${emailToInvite}!`);
      } else {
        toast.error(res.message || "Failed to send team invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send team invitation.");
    }
  };

  const handleRegisterNow = async () => {
    if (!event) return;
    setRegistering(true);
    try {
      const res = await registerForEvent(event.id);
      if (res.success) {
        setIsRegistered(true);
        setEvent((prev) =>
          prev ? { ...prev, participantCount: res.participantCount ?? (prev.participantCount + 1) } : null
        );
        toast.success(res.message || "Registered successfully! Confirmation email sent.");
      } else {
        toast.error(res.error || "Failed to register for hackathon.");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed) {
      const errText = "Submission deadline has passed. No new submissions are accepted.";
      setSubmitMsg({ type: "error", text: errText });
      toast.error(errText);
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await submitProject({
        title: submitForm.title,
        summary: submitForm.summary,
        repo_url: submitForm.repo_url,
        demo_url: submitForm.demo_url,
        track: submitForm.track || event.tracks?.[0]?.name || "General Track",
        track_label: submitForm.track || event.tracks?.[0]?.name || "General Track",
        team: user?.name || "Participant Team",
        hackathon_id: event.id,
        hackathon_slug: event.slug,
      });
      if (res.success) {
        const succText = "Project submitted successfully! Confirmation email sent.";
        setSubmitMsg({
          type: "success",
          text: succText,
        });
        toast.success(succText);
        setIsEditingSubmission(false);
        const updated = await fetchMySubmission(event.id);
        if (updated) setExistingSubmission(updated);
      } else {
        const failText = res.error || "Submission failed. Check the deadline and try again.";
        setSubmitMsg({ type: "error", text: failText });
        toast.error(failText);
      }
    } catch (err: any) {
      const failText = err.message || "Network error.";
      setSubmitMsg({ type: "error", text: failText });
      toast.error(failText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Hackathons
      </Link>

      {/* Hero Header */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                {event.categoryLabel || event.category}
              </span>
              {isRegistered ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Registered Participant ✓
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterNow}
                  disabled={registering}
                  className="text-[10px] font-bold text-purple-200 bg-purple-600/80 hover:bg-purple-600 border border-purple-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
                >
                  {registering ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <PlusCircle className="w-2.5 h-2.5" />}
                  Register for Hackathon
                </button>
              )}
              {isUpcoming ? (
                <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Upcoming
                </span>
              ) : isClosed ? (
                <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Submissions Closed
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Live
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{event.title || event.name}</h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">{event.tagline}</p>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <div className="text-2xl font-black text-emerald-400">{event.prizeDisplay}</div>
            <div className="text-xs text-slate-400">Total Prize Pool · {event.participantCount?.toLocaleString() || 0} Registered</div>
            {event.submissions_close && (
              <div className="text-xs font-mono text-slate-400">
                Deadline: {new Date(event.submissions_close).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unregistered Prompt Banner */}
      {!isRegistered && (
        <div className="card-modern p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Join this hackathon to submit your project
            </div>
            <p className="text-[11px] text-slate-500">
              Register now with one click to submit builds, invite teammates, and get evaluated by judges.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRegisterNow}
            disabled={registering}
            className="btn-primary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
          >
            {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Register Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Prize Pool", value: event.prizeDisplay, color: "emerald" },
              { label: "Format", value: event.format, color: "blue" },
              { label: "Tracks", value: `${event.tracks?.length || 0} tracks`, color: "purple" },
              { label: "Team Size", value: event.teamSizeLimit || "Any", color: "amber" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`card-modern p-4 border-l-4 border-l-${color}-500 space-y-0.5`}>
                <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
                <div className="text-sm font-black text-slate-900 capitalize">{value}</div>
              </div>
            ))}
          </div>

          <div className="card-modern p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">About This Hackathon</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {event.overview?.description || event.tagline}
            </p>
            {event.overview?.highlights?.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div><strong className="text-slate-800">{h.title}:</strong> {h.description}</div>
              </div>
            ))}
          </div>

          {event.timeline && event.timeline.length > 0 && (
            <div className="card-modern p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Timeline</h2>
              <div className="space-y-2">
                {event.timeline.slice(0, 5).map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3 text-xs">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      milestone.status === "completed" ? "bg-emerald-500"
                      : milestone.status === "active" ? "bg-blue-500 animate-pulse"
                      : "bg-slate-300"
                    }`} />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900">{milestone.title}</span>
                      <span className="text-slate-400 ml-2 font-mono">
                        {new Date(milestone.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      milestone.status === "completed" ? "bg-emerald-100 text-emerald-800"
                      : milestone.status === "active" ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      {milestone.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRACKS TAB ── */}
      {activeTab === "tracks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900">Competition Tracks</h2>
            <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
              {event.tracks?.length || 0} tracks
            </span>
          </div>

          {event.tracks && event.tracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.tracks.map((track, i) => (
                <div key={track.id || i} className="card-modern p-5 space-y-2 border-l-4 border-l-purple-500 hover:border-l-purple-600 transition-all">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">{track.name}</h3>
                    <span className="text-xs font-bold text-emerald-700 font-mono">{track.prize}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{track.description}</p>
                  <button
                    onClick={() => { setSubmitForm((f) => ({ ...f, track: track.name })); handleTabChange("submissions"); }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 mt-1"
                  >
                    Submit to this track <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">No tracks announced yet.</div>
          )}

          {event.judgingCriteria && event.judgingCriteria.length > 0 && (
            <div className="card-modern p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Judging Criteria</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {event.judgingCriteria.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-900">{c.title}</span>
                      <span className="font-mono text-purple-600 font-bold">{c.weight}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TEAMS TAB ── */}
      {activeTab === "teams" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900">My Team — {event.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Teams are scoped per hackathon. Invite teammates for this event only.
            </p>
          </div>

          {/* Team card */}
          <div className="card-modern p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-emerald-700 text-sm">
                {(user?.name || "M")[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{user?.name || "You"}</div>
                <div className="text-xs text-emerald-600 font-mono">Team Lead · {event.slug}</div>
              </div>
            </div>

            {/* Invite link */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shareable Invite Link</div>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={inviteUrl}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-700 select-all" />
                <button type="button" onClick={handleCopyInvite}
                  className={`shrink-0 text-xs py-2.5 px-3.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    copied ? "bg-emerald-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}>
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            {/* Email invite */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invite by Email</div>
              <div className="flex gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input type="email" placeholder="teammate@example.com" value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddInvite()}
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none" />
                </div>
                <button type="button" onClick={handleAddInvite}
                  className="btn-primary text-xs py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5" /> Invite
                </button>
              </div>

              {pendingInvites.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pendingInvites.map((em, i) => (
                    <span key={i} className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                      ✉️ {em} (Pending)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMISSIONS TAB ── */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900">Project Submission</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit your project for {event.title}.</p>
          </div>

          {/* Deadline alert */}
          {isClosed ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Submissions Closed</div>
                <div className="text-rose-700 text-[11px] mt-0.5">
                  The submission deadline ({event.submissions_close ? new Date(event.submissions_close).toLocaleString() : "TBD"}) has passed. No new submissions or edits are accepted.
                </div>
              </div>
            </div>
          ) : isUpcoming ? (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Submissions Open Soon</div>
                <div className="text-blue-700 text-[11px] mt-0.5">This hackathon has not started yet. Submissions will open on {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"}.</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Submissions Open</div>
                <div className="text-emerald-700 text-[11px] mt-0.5">Deadline: {event.submissions_close ? new Date(event.submissions_close).toLocaleString() : "TBD"}</div>
              </div>
            </div>
          )}

          {/* Status message */}
          {submitMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              submitMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}>
              {submitMsg.type === "success"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {submitMsg.text}
            </div>
          )}

          {/* Current Submission Card if already submitted */}
          {existingSubmission && !isEditingSubmission && (
            <div className="card-modern p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Submitted for Judging ✓
                  </span>
                  <span className="text-xs font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded">
                    Track: {existingSubmission.trackLabel || existingSubmission.track}
                  </span>
                </div>
                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSubmission(true)}
                    className="btn-secondary text-xs py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 border border-white/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Submission
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{existingSubmission.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{existingSubmission.summary}</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-1 text-xs">
                {existingSubmission.repoUrl && (
                  <a
                    href={existingSubmission.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    <FolderGit2 className="w-4 h-4" /> Code Repository
                  </a>
                )}
                {existingSubmission.demoUrl && (
                  <a
                    href={existingSubmission.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-mono"
                  >
                    <ExternalLink className="w-4 h-4" /> Interactive Demo
                  </a>
                )}
                <span className="text-slate-400 font-mono text-[11px] ml-auto">
                  Submitted: {new Date(existingSubmission.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Submission form (shown if no submission yet or editing) */}
          {(!existingSubmission || isEditingSubmission) && (
            <div className="card-modern p-6 space-y-4">
              {isEditingSubmission && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Editing existing submission
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSubmission(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={submitForm.title}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="My Awesome Project"
                      disabled={isClosed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Track *</label>
                    <select
                      required
                      value={submitForm.track}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, track: e.target.value }))}
                      disabled={isClosed}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="">Select track...</option>
                      {event.tracks?.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Repository URL *</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="url"
                        required
                        value={submitForm.repo_url}
                        onChange={(e) => setSubmitForm((f) => ({ ...f, repo_url: e.target.value }))}
                        placeholder="https://github.com/..."
                        disabled={isClosed}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Demo URL</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="url"
                        value={submitForm.demo_url}
                        onChange={(e) => setSubmitForm((f) => ({ ...f, demo_url: e.target.value }))}
                        placeholder="https://my-demo.vercel.app"
                        disabled={isClosed}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Summary *</label>
                  <textarea
                    rows={4}
                    required
                    value={submitForm.summary}
                    onChange={(e) => setSubmitForm((f) => ({ ...f, summary: e.target.value }))}
                    placeholder="Describe what your project does, the problem it solves, and your approach..."
                    disabled={isClosed}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || isClosed}
                    className="btn-primary text-xs py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : isClosed ? (
                      "Submissions Closed"
                    ) : isEditingSubmission ? (
                      <>
                        <Send className="w-3.5 h-3.5" /> Update Project Build
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
