"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  FolderGit2,
  FileText,
  Calendar,
  Trophy,
  Award,
  ShieldCheck,
  Settings,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Sparkles,
  BadgeCheck,
  Download,
  CheckCircle2,
  Cpu,
  KeyRound,
  Lock,
} from "lucide-react";
import { AuthUser, getStoredUser, fetchCurrentUser } from "@/lib/auth";
import { fetchMyCertificates, Certificate } from "@/lib/api";

function CertificateBadge({ cert, role }: { cert: Certificate; role: string }) {
  const isJudge = cert.recipient_type === "judge";
  const isOrganizer = cert.recipient_type === "organizer";

  const badgeColors = isJudge
    ? "from-blue-600 to-indigo-600 border-blue-400/30"
    : isOrganizer
    ? "from-purple-600 to-violet-600 border-purple-400/30"
    : "from-emerald-600 to-teal-600 border-emerald-400/30";

  const accentColors = isJudge
    ? "text-blue-300"
    : isOrganizer
    ? "text-purple-300"
    : "text-emerald-300";

  const label = isJudge
    ? "Evaluation Certificate"
    : isOrganizer
    ? "Organizer Certificate"
    : "Participation Certificate";

  const issued = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-br ${badgeColors} p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div className="rounded-[14px] bg-slate-950 p-5 h-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${badgeColors}`}>
              {isJudge ? (
                <Award className="w-4 h-4 text-white" />
              ) : isOrganizer ? (
                <ShieldCheck className="w-4 h-4 text-white" />
              ) : (
                <Trophy className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-widest font-bold ${accentColors}`}>
                {label}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">DOGFOOD Foundation</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Verified</span>
          </div>
        </div>

        {/* Project title */}
        <div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">Project</p>
          <h3 className="text-sm font-black text-white leading-tight mt-0.5">{cert.project_title}</h3>
          {cert.project_track && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {cert.project_track}
            </span>
          )}
        </div>

        {/* Hackathon */}
        <div className="border-t border-white/10 pt-3">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Hackathon</p>
          <p className="text-xs font-bold text-slate-300 mt-0.5">{cert.hackathon_name}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/10 pt-3 mt-auto">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{issued}</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <Cpu className="w-3 h-3" />
            <span className="truncate max-w-[80px]" title={cert.certificate_id}>
              {cert.certificate_id}
            </span>
          </div>
        </div>

        {/* HMAC signature snippet */}
        <div className="bg-slate-900 rounded-lg px-2.5 py-2 border border-white/5">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            HMAC-SHA256 Signature
          </p>
          <p className="text-[9px] font-mono text-emerald-500 break-all leading-relaxed">
            {cert.hmac_sha256_signature.slice(0, 32)}…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stored = getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
      } else if (!stored) {
        router.push("/login?redirect=/profile");
        return;
      }
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    async function loadCerts() {
      setCertsLoading(true);
      try {
        const result = await fetchMyCertificates();
        setCerts(result);
      } catch {
        setCerts([]);
      } finally {
        setCertsLoading(false);
      }
    }
    if (!loading) loadCerts();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading profile...</p>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role || "participant";
  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleColor = {
    organizer: {
      bg: "bg-purple-950/20 border-purple-200 text-purple-700",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      accent: "purple",
    },
    judge: {
      bg: "bg-blue-950/20 border-blue-200 text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <Award className="w-5 h-5 text-blue-600" />,
      accent: "blue",
    },
    participant: {
      bg: "bg-emerald-950/20 border-emerald-200 text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <Trophy className="w-5 h-5 text-emerald-600" />,
      accent: "emerald",
    },
  }[role] || {
    bg: "bg-slate-100 border-slate-200 text-slate-700",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    icon: <User className="w-5 h-5 text-slate-600" />,
    accent: "blue",
  };

  const certSectionTitle =
    role === "judge"
      ? "Evaluation Certificates"
      : role === "organizer"
      ? "Organizer Certificates"
      : "Achievement Certificates";

  const certSectionDesc =
    role === "judge"
      ? "Cryptographically signed certificates for hackathons you have evaluated."
      : role === "organizer"
      ? "Certificates for hackathons you organised and successfully completed."
      : "Certificates earned for hackathons you completed with a project submission.";

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            href="/change-password"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs hover:border-slate-300"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Change Password</span>
          </Link>
          <Link
            href="/settings"
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Profile &amp; Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Profile Hero Card */}
      <div className="card-modern p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-black text-2xl text-white">
                {initials}
              </div>
            </div>
            {certs.length > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 shadow-lg border-2 border-slate-950">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-white border border-white/20">
                {role} role
              </span>
              {certs.length > 0 && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {certs.length} {certs.length === 1 ? "Certificate" : "Certificates"}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {user.bio || "DOGFOOD Hackathon platform member and engineering innovator."}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </div>
              {user.github_handle && (
                <a
                  href={`https://github.com/${user.github_handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>@{user.github_handle}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Stats & Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-modern p-5 space-y-1 border-l-4 border-l-purple-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">System Role</div>
          <div className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            {roleColor.icon}
            {role}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {role === "organizer" && "Manage hackathon lifecycles, rubric weights, and matrices."}
            {role === "judge" && "Assigned to blind peer-isolated submission evaluation queue."}
            {role === "participant" && "Submit projects, collaborate in teams, and track scores."}
          </p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-l-blue-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">Account Status</div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Active &amp; Verified
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Authenticated with cookie-backed session (24h expiry).
          </p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">Account Security</div>
          <div className="text-lg font-black text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm">
              <KeyRound className="w-4 h-4 text-amber-500" />
              ••••••••••••
            </span>
            <Link
              href="/change-password"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors"
            >
              Update
            </Link>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Encrypted using bcrypt hashing. Click update to change.
          </p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-mono uppercase font-bold text-slate-400">Certificates Earned</div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-emerald-500" />
            {certsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              `${certs.length} Certificate${certs.length !== 1 ? "s" : ""}`
            )}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {certs.length === 0 && !certsLoading
              ? "Complete a hackathon to earn your first certificate."
              : "HMAC-SHA256 cryptographically signed."}
          </p>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              {certSectionTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{certSectionDesc}</p>
          </div>
        </div>

        {certsLoading ? (
          <div className="flex items-center justify-center py-16 card-modern rounded-2xl border-2 border-dashed border-slate-200">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-xs font-mono">Fetching certificates...</p>
            </div>
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 card-modern rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No certificates yet</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              {role === "participant"
                ? "Submit a project to a hackathon and complete it to earn your certificate."
                : role === "judge"
                ? "Submit evaluations for a hackathon that reaches completion to receive your certificate."
                : "Certificates will appear here once you organise a completed hackathon."}
            </p>
            {role === "participant" && (
              <Link
                href="/hackathons"
                className="mt-4 btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
              >
                <Trophy className="w-3.5 h-3.5" />
                Browse Hackathons
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certs.map((cert) => (
              <CertificateBadge key={cert.certificate_id} cert={cert} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
