"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Mail,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Layers,
  FileCheck,
  Loader2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
} from "lucide-react";
import DashboardSidebar, { ORGANIZER_NAV } from "@/components/DashboardSidebar";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import {
  fetchJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  autoAssignJudges,
  fetchEvents,
  JudgeData,
} from "@/lib/api";
import { Hackathon } from "@/lib/types";
import toast from "react-hot-toast";

const COMMON_TRACKS = [
  "Developer Tools",
  "AI Infrastructure",
  "Cryptography",
  "Web3 & ZK",
  "Open Source",
  "Security & Privacy",
  "Data Engineering",
  "UX & Design Systems",
];

export default function ManageJudgesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [events, setEvents] = useState<Hackathon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<JudgeData | null>(null);

  // Active / Created Judge for Dispatch Modal
  const [activeDispatchJudge, setActiveDispatchJudge] = useState<{
    judge: JudgeData;
    password: string;
    isNew: boolean;
  } | null>(null);

  // Form State: Create Judge
  const [createForm, setCreateForm] = useState({
    id: "",
    name: "",
    email: "",
    tracks: ["Developer Tools"],
    password: "",
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Form State: Edit Judge
  const [editingJudge, setEditingJudge] = useState<JudgeData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    tracks: [] as string[],
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Auto-Assign State
  const [autoAssignEvent, setAutoAssignEvent] = useState("");
  const [judgesPerTrack, setJudgesPerTrack] = useState(2);
  const [isSubmittingAutoAssign, setIsSubmittingAutoAssign] = useState(false);

  // UI helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDispatchPassword, setShowDispatchPassword] = useState(false);

  useEffect(() => {
    async function init() {
      let user = getStoredUser();
      if (!user) {
        user = await fetchCurrentUser();
      }
      if (!user) {
        router.push("/login?redirect=/manage-judges");
        return;
      }
      if (user.role !== "organizer" && user.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(user);

      await reloadData();
      setLoading(false);
    }
    init();
  }, [router]);

  const reloadData = async () => {
    try {
      const [judgesData, eventsData] = await Promise.all([
        fetchJudges(),
        fetchEvents(),
      ]);
      setJudges(judgesData);
      setEvents(eventsData);
      if (eventsData.length > 0 && !autoAssignEvent) {
        setAutoAssignEvent(eventsData[0].id || eventsData[0].slug);
      }
    } catch (err) {
      console.warn("Error loading judges data:", err);
    }
  };

  const handleCopy = (text: string, key: string, label: string = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Helper to generate a strong random password
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "Judge_";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += "!";
    return pwd;
  };

  // ─── Create Judge ─────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    const randomPwd = generateRandomPassword();
    setCreateForm({
      id: "",
      name: "",
      email: "",
      tracks: ["Developer Tools"],
      password: randomPwd,
    });
    setShowCreateModal(true);
  };

  const handleToggleCreateTrack = (track: string) => {
    setCreateForm((prev) => {
      const exists = prev.tracks.includes(track);
      if (exists) {
        if (prev.tracks.length === 1) return prev; // Keep at least one
        return { ...prev, tracks: prev.tracks.filter((t) => t !== track) };
      }
      return { ...prev, tracks: [...prev.tracks, track] };
    });
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      toast.error("Please provide both name and email.");
      return;
    }

    setIsSubmittingCreate(true);
    const judgeId =
      createForm.id.trim().toLowerCase().replace(/\s+/g, "_") ||
      `jdg_${createForm.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}_${Math.random().toString(36).substring(2, 6)}`;
    const finalPassword = createForm.password.trim() || generateRandomPassword();

    const res = await createJudge({
      id: judgeId,
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      tracks: createForm.tracks,
      password: finalPassword,
    });

    setIsSubmittingCreate(false);

    if (res.success && res.judge) {
      toast.success(`Judge account for ${res.judge.name} created!`);
      setShowCreateModal(false);
      await reloadData();

      // Show the credentials dispatch modal so organizer can send/copy them immediately
      setActiveDispatchJudge({
        judge: res.judge,
        password: res.judge.initial_password || finalPassword,
        isNew: true,
      });
      setShowDispatchModal(true);
    } else {
      toast.error(res.error || "Failed to create judge account.");
    }
  };

  // ─── Edit Judge ───────────────────────────────────────────────────────────
  const handleOpenEditModal = (judge: JudgeData) => {
    setEditingJudge(judge);
    setEditForm({
      name: judge.name,
      email: judge.email,
      tracks: [...judge.tracks],
    });
    setShowEditModal(true);
  };

  const handleToggleEditTrack = (track: string) => {
    setEditForm((prev) => {
      const exists = prev.tracks.includes(track);
      if (exists) {
        if (prev.tracks.length === 1) return prev;
        return { ...prev, tracks: prev.tracks.filter((t) => t !== track) };
      }
      return { ...prev, tracks: [...prev.tracks, track] };
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJudge) return;

    setIsSubmittingEdit(true);
    const res = await updateJudge(editingJudge.id, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      tracks: editForm.tracks,
    });

    setIsSubmittingEdit(false);
    if (res.success && res.judge) {
      toast.success("Judge details updated successfully.");
      setShowEditModal(false);
      await reloadData();
    } else {
      toast.error(res.error || "Failed to update judge.");
    }
  };

  // ─── Delete Judge ─────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!judgeToDelete) return;
    const res = await deleteJudge(judgeToDelete.id);
    if (res.success) {
      toast.success(`Judge ${judgeToDelete.name} removed.`);
      setJudgeToDelete(null);
      await reloadData();
    } else {
      toast.error(res.error || "Failed to delete judge.");
    }
  };

  // ─── Auto Assign ──────────────────────────────────────────────────────────
  const handleRunAutoAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoAssignEvent) {
      toast.error("Please select a hackathon event.");
      return;
    }

    setIsSubmittingAutoAssign(true);
    const res = await autoAssignJudges(autoAssignEvent, judgesPerTrack);
    setIsSubmittingAutoAssign(false);

    if (res.success) {
      toast.success(res.message || "Judges auto-assigned to projects successfully!");
      setShowAutoAssignModal(false);
      await reloadData();
    } else {
      toast.error(res.error || "Auto-assignment failed.");
    }
  };

  // ─── Re-open Dispatch Modal for existing judge ────────────────────────────
  const handleOpenCredentials = (judge: JudgeData) => {
    setActiveDispatchJudge({
      judge,
      password: judge.initial_password || "demo2026",
      isNew: false,
    });
    setShowDispatchModal(true);
  };

  // Filter judges
  const filteredJudges = judges.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack =
      selectedTrackFilter === "all" || j.tracks.includes(selectedTrackFilter);
    return matchesSearch && matchesTrack;
  });

  // Calculate unique tracks covered
  const allTracks = Array.from(new Set(judges.flatMap((j) => j.tracks)));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Invitation Email Template String
  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:8080/login";
  const invitationEmailText = activeDispatchJudge
    ? `Subject: Welcome to the DOGFOOD Hackathon Judging Panel - Login Credentials

Dear ${activeDispatchJudge.judge.name},

You have been registered as an official evaluation judge on the DOGFOOD Hackathon platform for the following tracks:
${activeDispatchJudge.judge.tracks.map((t) => ` • ${t}`).join("\n")}

Here are your account credentials to access the Blind Evaluation Console:

  Portal URL: ${portalUrl}
  Account Email: ${activeDispatchJudge.judge.email}
  Temporary Password: ${activeDispatchJudge.password}

After logging in, you can update your password at any time by navigating to:
  ${portalUrl.replace("/login", "/change-password")}

Thank you for helping ensure a fair, rigorous, and blind evaluation process!

Best regards,
The Hackathon Organizing Team`
    : "";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      {/* Consistent Dashboard Sidebar */}
      <DashboardSidebar
        role="organizer"
        user={currentUser}
        activeTab="judges"
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider bg-purple-950/70 border border-purple-500/40 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                Tier 2 Judging Layer
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-400">Panel Roster &amp; Credentials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-400" />
              <span>Judge Management</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Invite peer judges, allocate track evaluation domains, generate login credentials, and dispatch personalized invitation emails.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAutoAssignModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:text-white"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Auto-Assign Projects</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Invite Judge</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Total Judges</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{judges.length}</div>
            <p className="text-[10px] text-slate-500 font-mono">Active evaluation panel</p>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Tracks Covered</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{allTracks.length}</div>
            <p className="text-[10px] text-slate-500 font-mono">Domains calibrated</p>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Active Events</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{events.length}</div>
            <p className="text-[10px] text-slate-500 font-mono">Registered hackathons</p>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Evaluation Mode</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1">Blind Peer Isolation</div>
            <p className="text-[10px] text-slate-500 font-mono">Strict Cross-Judge Guard</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search judges by name, email, or handle..."
                className="w-full bg-[#121828] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={reloadData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              title="Refresh judges list"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Filter:
            </span>
            <button
              onClick={() => setSelectedTrackFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedTrackFilter === "all"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              All Tracks ({judges.length})
            </button>
            {allTracks.map((track) => {
              const count = judges.filter((j) => j.tracks.includes(track)).length;
              return (
                <button
                  key={track}
                  onClick={() => setSelectedTrackFilter(track)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    selectedTrackFilter === track
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {track} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Judges Table / Grid */}
        {filteredJudges.length === 0 ? (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-950/50 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-white">No judges found</h3>
              <p className="text-xs text-slate-400">
                {searchQuery || selectedTrackFilter !== "all"
                  ? "No judges match the selected filter or search query. Try clearing your filters."
                  : "Get started by adding judges to your evaluation roster and assigning them to tracks."}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Judge</span>
            </button>
          </div>
        ) : (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-5">Judge Profile</th>
                    <th className="py-4 px-5">Contact &amp; Credentials</th>
                    <th className="py-4 px-5">Assigned Tracks</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredJudges.map((judge) => {
                    const initials = (judge.name || "JD")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={judge.id}
                        className="hover:bg-slate-900/50 transition-colors group"
                      >
                        {/* Name & ID */}
                        <td className="py-4 px-5 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                                <span>{judge.name}</span>
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                                  {judge.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Blind isolated
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Credentials */}
                        <td className="py-4 px-5 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{judge.email}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenCredentials(judge)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3 text-purple-400" />
                              <span>View / Send Credentials</span>
                            </button>
                          </div>
                        </td>

                        {/* Tracks */}
                        <td className="py-4 px-5 align-top">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {judge.tracks.map((track) => (
                              <span
                                key={track}
                                className="px-2.5 py-0.5 rounded-md bg-blue-950/50 border border-blue-500/40 text-blue-300 text-[11px] font-medium"
                              >
                                {track}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenCredentials(judge)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-700/80 hover:border-purple-600/60 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                              title="Send or copy login credentials"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(judge)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit judge tracks and details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setJudgeToDelete(judge)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-600/60 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remove judge from panel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Add / Invite New Judge                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Invite New Judge
                  </h2>
                  <p className="text-xs text-slate-400">
                    Create judge account and generate login credentials.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Dr. Maya Lin"
                    className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. maya@research.org"
                    className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judge Handle / ID (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.id}
                  onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
                  placeholder="e.g. jdg_maya (auto-generated if empty)"
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
                />
              </div>

              {/* Password Setting */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm({ ...createForm, password: generateRandomPassword() })
                    }
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Temporary password"
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Will be securely hashed and stored. You will be able to copy the full invitation and password on the next screen.
                </span>
              </div>

              {/* Tracks Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Assigned Evaluation Tracks
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRACKS.map((track) => {
                    const selected = createForm.tracks.includes(track);
                    return (
                      <button
                        type="button"
                        key={track}
                        onClick={() => handleToggleCreateTrack(track)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          selected
                            ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                            : "bg-[#121828] text-slate-400 border-slate-700/80 hover:text-slate-200"
                        }`}
                      >
                        {track} {selected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create &amp; Generate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Credentials & Email Dispatch Modal                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showDispatchModal && activeDispatchJudge && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {activeDispatchJudge.isNew
                      ? "Judge Account Created & Ready to Send!"
                      : "Judge Credentials & Invitation"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Send these credentials to{" "}
                    <span className="text-purple-300 font-semibold">
                      {activeDispatchJudge.judge.name}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Credentials Summary Card */}
            <div className="bg-[#121828] border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Access Credentials
              </div>

              {/* Portal URL */}
              <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">PORTAL LOGIN URL</span>
                  <span className="font-mono text-white text-xs">{portalUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(portalUrl, "portal", "Portal URL copied!")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 font-semibold"
                >
                  {copiedKey === "portal" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "portal" ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">ACCOUNT EMAIL</span>
                  <span className="font-mono text-white text-xs">{activeDispatchJudge.judge.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeDispatchJudge.judge.email, "email", "Email copied!")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 font-semibold"
                >
                  {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "email" ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono">TEMPORARY PASSWORD</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">
                      {showDispatchPassword ? activeDispatchJudge.password : "••••••••••••"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDispatchPassword(!showDispatchPassword)}
                    className="text-slate-400 hover:text-slate-200"
                    title={showDispatchPassword ? "Hide password" : "Show password"}
                  >
                    {showDispatchPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeDispatchJudge.password, "pwd", "Password copied!")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 font-semibold"
                >
                  {copiedKey === "pwd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "pwd" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Complete Invitation Email Template */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  Pre-Formatted Invitation Email
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(invitationEmailText, "full_email", "Complete invitation email copied!")}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {copiedKey === "full_email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Full Email</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={7}
                value={invitationEmailText}
                className="w-full bg-[#121828] border border-slate-700/80 rounded-xl p-3 text-slate-300 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Judges can change this password at <span className="font-mono text-slate-300">/change-password</span>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Invitation dispatched to ${activeDispatchJudge.judge.email}! 🚀`);
                    setShowDispatchModal(false);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark as Dispatched</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Edit Judge Tracks                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showEditModal && editingJudge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Edit Judge Allocation</h2>
                <p className="text-xs text-slate-400">Update track assignments for {editingJudge.name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Assigned Tracks
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRACKS.map((track) => {
                    const selected = editForm.tracks.includes(track);
                    return (
                      <button
                        type="button"
                        key={track}
                        onClick={() => handleToggleEditTrack(track)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          selected
                            ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                            : "bg-[#121828] text-slate-400 border-slate-700/80 hover:text-slate-200"
                        }`}
                      >
                        {track} {selected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {isSubmittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: Auto-Assign Submissions                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Auto-Assign Projects</h2>
                  <p className="text-xs text-slate-400">Match submissions to judges by track</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoAssignModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunAutoAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Hackathon Event
                </label>
                <select
                  value={autoAssignEvent}
                  onChange={(e) => setAutoAssignEvent(e.target.value)}
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id || ev.slug} value={ev.id || ev.slug}>
                      {ev.title} ({ev.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judges Per Submission / Track
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={judgesPerTrack}
                  onChange={(e) => setJudgesPerTrack(parseInt(e.target.value) || 2)}
                  className="w-full bg-[#121828] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Each project will be evaluated by {judgesPerTrack} independent judges.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAutoAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAutoAssign}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {isSubmittingAutoAssign ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Auto-Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: Delete Confirmation                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {judgeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Remove Judge?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove{" "}
                <span className="text-white font-semibold">{judgeToDelete.name}</span>{" "}
                ({judgeToDelete.id}) from the evaluation panel?
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setJudgeToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
