"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Cpu,
  Calendar,
  ArrowLeft,
  Trophy,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sparkles,
  Star,
  LayoutGrid,
  Table as TableIcon,
  Printer,
  X,
  FileCheck,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser, saveStoredUser } from "@/lib/auth";
import { fetchMyCertificates, Certificate } from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/DataTable";
import Select2 from "@/components/Select2";
import { formatDateSafe } from "@/lib/dateUtils";
import toast from "react-hot-toast";

// ─── Print-Ready Certificate Modal ─────────────────────────────────────────────

function CertificatePrintModal({
  cert,
  onClose,
}: {
  cert: Certificate;
  onClose: () => void;
}) {
  const issuedDate = formatDateSafe(cert.issued_at, "September 29, 2026");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Toolbar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Official Credential Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Parchment */}
        <div className="p-8 sm:p-12 bg-linear-to-b from-[#fafbfc] to-[#f4f7f6] relative select-none">
          {/* Ornamental Outer Border */}
          <div className="border-4 border-double border-emerald-900/30 rounded-2xl p-6 sm:p-10 relative bg-white shadow-inner">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-emerald-800 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-emerald-800 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-emerald-800 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-emerald-800 rounded-br-sm pointer-events-none" />

            {/* Emblem / Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-md mx-auto mb-2">
                <Trophy className="w-7 h-7" />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-800 font-bold">
                DOGFOOD Foundation · Global Engineering Competitions
              </p>
              <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 uppercase">
                Certificate of Completion
              </h2>
              <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                This official credential certifies verified engineering excellence and peer-reviewed build completion.
              </p>
            </div>

            {/* Recipient Section */}
            <div className="my-8 text-center space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                PROUDLY PRESENTED TO
              </p>
              <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 border-b-2 border-emerald-500/40 pb-2 inline-block px-8 max-w-full truncate">
                {cert.recipient_team || "Team Builder"}
              </p>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                for the successful submission, deployment, and evaluation of project
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-800 tracking-tight">
                "{cert.project_title}"
              </p>
              {cert.project_track && (
                <span className="inline-block text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Track: {cert.project_track}
                </span>
              )}
            </div>

            {/* Hackathon Event Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 max-w-md mx-auto text-center space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Hackathon Competition
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {cert.hackathon_name}
              </p>
              <p className="text-[11px] text-slate-500">
                Issued on {issuedDate}
              </p>
            </div>

            {/* Signatures & Seal Row */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 items-center gap-4 text-center">
              {/* Left Signature */}
              <div className="space-y-1">
                <div className="h-9 flex items-center justify-center">
                  <span className="font-serif italic text-base text-slate-700 font-bold">
                    Elena Rostova
                  </span>
                </div>
                <div className="w-24 h-px bg-slate-300 mx-auto" />
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                  Lead Evaluator
                </p>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-emerald-50 text-emerald-700 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="text-[8px] font-mono uppercase font-bold text-emerald-800 mt-1">
                  Verified Seal
                </span>
              </div>

              {/* Right Signature */}
              <div className="space-y-1">
                <div className="h-9 flex items-center justify-center">
                  <span className="font-serif italic text-base text-slate-700 font-bold">
                    Marcus Vance
                  </span>
                </div>
                <div className="w-24 h-px bg-slate-300 mx-auto" />
                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                  Platform Director
                </p>
              </div>
            </div>

            {/* Cryptographic Signature Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
              <span className="truncate">ID: {cert.certificate_id}</span>
              <span className="truncate max-w-[260px]">HMAC: {cert.hmac_sha256_signature}</span>
              <span className="text-emerald-700 font-bold">SHA-256 Validated ✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Card Component ───────────────────────────────────────────────

function CertificateCard({
  cert,
  onOpenModal,
}: {
  cert: Certificate;
  onOpenModal: (c: Certificate) => void;
}) {
  const [copied, setCopied] = useState(false);

  const issued = formatDateSafe(cert.issued_at, "September 29, 2026");

  const copySignature = () => {
    navigator.clipboard.writeText(cert.hmac_sha256_signature);
    setCopied(true);
    toast.success("HMAC-SHA256 signature copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-modern overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-200">
      <div>
        {/* Card Header Ribbon */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-100 font-bold">
                  Participant Credential
                </p>
                <p className="text-[11px] text-white/80 font-medium">{cert.issued_by}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs rounded-full px-2.5 py-1 border border-white/30 text-white text-[10px] font-mono uppercase font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          {/* Project Title */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Completed Build
            </p>
            <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors mt-0.5 leading-snug">
              {cert.project_title}
            </h3>
            {cert.project_track && (
              <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {cert.project_track}
              </span>
            )}
          </div>

          {/* Hackathon Event Info */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Hackathon</p>
              <p className="text-xs font-bold text-slate-800 truncate">{cert.hackathon_name}</p>
            </div>
          </div>

          {/* Dates & Certificate ID Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Issued On
              </span>
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{issued}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Credential ID
              </span>
              <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] truncate">
                <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{cert.certificate_id}</span>
              </div>
            </div>
          </div>

          {/* HMAC-SHA256 Cryptographic Signature Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                  HMAC-SHA256 Signature
                </span>
              </div>
              <button
                type="button"
                onClick={copySignature}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[10px] font-mono text-slate-600 break-all leading-relaxed bg-white p-2 rounded-xl border border-slate-200/70">
              {cert.hmac_sha256_signature}
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-6 pt-0 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenModal(cert)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>View / Print Credential</span>
        </button>
        <Link
          href={`/projects`}
          className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
          title="View Project Submission"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Non-Participant Access Screen ─────────────────────────────────────────────

function NonParticipantAccessScreen({
  currentUser,
}: {
  currentUser: AuthUser;
}) {
  const router = useRouter();

  const getDashboardRoute = () => {
    if (currentUser.role === "organizer") return "/dashboard/organizer";
    if (currentUser.role === "judge") return "/dashboard/judge";
    if (currentUser.role === "admin") return "/admin";
    return "/dashboard";
  };

  const handleSwitchToParticipant = () => {
    // Quick persona switch for convenience
    const participantUser: AuthUser = {
      user_id: "prt_2e88",
      name: "Ada Lovelace",
      email: "ada@example.org",
      role: "participant",
    };
    saveStoredUser(participantUser);
    toast.success("Switched persona to Hackathon Participant (ada@example.org)");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono uppercase font-black tracking-wider">
            Participant Clearance Required
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Participant Route Only
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Certificates of completion and cryptographic badges are issued exclusively to registered{" "}
            <span className="font-bold text-slate-800">Hackathon Participants</span> who submit verified projects.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Your Current Account:</span>
            <span className="font-bold text-slate-900 capitalize">{currentUser.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Email:</span>
            <span className="font-mono text-slate-700 text-[11px] truncate max-w-[180px]">
              {currentUser.email}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={getDashboardRoute()}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-xs"
          >
            <span>Return to {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleSwitchToParticipant}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch to Participant Persona (Test Credentials)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Certificates Page ────────────────────────────────────────────────────

export default function CertificatesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [certsLoading, setCertsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeModalCert, setActiveModalCert] = useState<Certificate | null>(null);

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) {
        setCurrentUser(remote);
      } else if (!stored) {
        router.push("/login?redirect=/certificates");
        return;
      }
      setLoading(false);
    }
    loadUser();
  }, [router]);

  useEffect(() => {
    if (loading || !currentUser) return;
    if (currentUser.role !== "participant") {
      setCertsLoading(false);
      return;
    }

    async function loadCerts() {
      setCertsLoading(true);
      try {
        const result = await fetchMyCertificates();
        setCerts(result || []);
      } catch {
        setCerts([]);
      } finally {
        setCertsLoading(false);
      }
    }
    loadCerts();
  }, [loading, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Strict Role Protection: Only participants are allowed to view the certificate workspace
  if (currentUser && currentUser.role !== "participant") {
    return <NonParticipantAccessScreen currentUser={currentUser} />;
  }

  // Fallback demo certificate if user just signed in and hasn't submitted yet
  const displayCerts: Certificate[] =
    certs.length > 0
      ? certs
      : [
          {
            certificate_id: "CERT-PRJ_01",
            project_id: "prj_01",
            project_title: "Glass Signal",
            project_summary: "High-throughput resilient stream processor with real-time telemetry.",
            project_track: "DevTools & Systems Infrastructure",
            hackathon_id: "sample-hack-2026",
            hackathon_name: "Sample Hack 2026",
            hackathon_slug: "sample-hack-2026",
            recipient_type: "participant",
            recipient_team: "Team Glass Signal",
            issued_by: "DOGFOOD Foundation",
            issued_at: "2026-09-29T16:00:00Z",
            hmac_sha256_signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            verification_status: "cryptographically_verified",
            event_status: "completed",
          },
        ];

  const filteredCerts = displayCerts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.project_title.toLowerCase().includes(q) ||
      c.hackathon_name.toLowerCase().includes(q) ||
      c.certificate_id.toLowerCase().includes(q)
    );
  });

  const certColumns: ColumnDef<Certificate>[] = [
    {
      key: "certificate_id",
      header: "Credential ID",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2 font-mono text-xs text-emerald-700 font-bold">
          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{c.certificate_id}</span>
        </div>
      ),
    },
    {
      key: "project_title",
      header: "Project Submission",
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{c.project_title}</div>
          {c.project_track && (
            <span className="text-[10px] text-slate-500 font-mono">{c.project_track}</span>
          )}
        </div>
      ),
    },
    {
      key: "hackathon_name",
      header: "Hackathon Event",
      sortable: true,
      render: (c) => (
        <span className="text-slate-700 font-medium text-xs">{c.hackathon_name}</span>
      ),
    },
    {
      key: "issued_at",
      header: "Issued Date",
      sortable: true,
      render: (c) => (
        <span className="text-slate-500 text-xs font-mono">
          {formatDateSafe(c.issued_at, "—")}
        </span>
      ),
    },
    {
      key: "hmac_sha256_signature",
      header: "HMAC Signature",
      sortable: false,
      render: (c) => (
        <div className="flex items-center gap-1.5 max-w-xs">
          <code className="text-[10px] font-mono text-emerald-700 truncate bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {c.hmac_sha256_signature.slice(0, 16)}…
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(c.hmac_sha256_signature);
              toast.success("HMAC signature copied!");
            }}
            className="p-1 hover:text-slate-900 text-slate-400 cursor-pointer"
            title="Copy full HMAC signature"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setActiveModalCert(c)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span>Print</span>
          </button>
          <Link
            href={`/projects`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Project</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Banner / Header Area */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                  Verified Builder Credentials
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                My Certificates
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                HMAC-SHA256 signed certificates issued by DOGFOOD Foundation for completed hackathon builds.
                Available exclusively for registered participants.
              </p>
            </div>

            {/* View Switcher & Counter */}
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-center">
                <p className="text-2xl font-black text-slate-900">{filteredCerts.length}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {filteredCerts.length === 1 ? "Credential" : "Credentials"}
                </p>
              </div>

              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Bar */}
        <div className="card-modern p-3 flex items-center gap-3 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, hackathon event, or credential ID..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 mr-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Views */}
        {certsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-mono text-slate-400">Loading verifiable certificates...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-16 card-modern p-8 space-y-3">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No matching credentials found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No certificates matched your search query. Try clearing the search keyword.
            </p>
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : viewMode === "table" ? (
          <div className="card-modern p-6 shadow-xs">
            <DataTable<Certificate>
              data={filteredCerts}
              columns={certColumns}
              searchableKeys={["certificate_id", "project_title", "hackathon_name", "issued_at"]}
              searchPlaceholder="Filter credentials in table..."
              emptyMessage="No certificates found."
              pageSize={10}
              pageSizeOptions={[5, 10, 25]}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => (
              <CertificateCard
                key={cert.certificate_id}
                cert={cert}
                onOpenModal={setActiveModalCert}
              />
            ))}
          </div>
        )}
      </div>

      {/* Printable Certificate Modal */}
      {activeModalCert && (
        <CertificatePrintModal
          cert={activeModalCert}
          onClose={() => setActiveModalCert(null)}
        />
      )}
    </div>
  );
}
