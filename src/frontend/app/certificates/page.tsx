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
} from "lucide-react";
import { getStoredUser, fetchCurrentUser, AuthUser } from "@/lib/auth";
import { fetchMyCertificates, Certificate } from "@/lib/api";
import DataTable, { ColumnDef } from "@/components/DataTable";
import Select2 from "@/components/Select2";
import toast from "react-hot-toast";

// ─── Certificate Card ──────────────────────────────────────────────────────────

function CertificateCard({ cert }: { cert: Certificate }) {
  const [copied, setCopied] = useState(false);

  const isJudge = cert.recipient_type === "judge";
  const isOrganizer = cert.recipient_type === "organizer";

  const gradient = isJudge
    ? "from-blue-600 via-indigo-700 to-violet-800"
    : isOrganizer
    ? "from-purple-700 via-violet-700 to-indigo-800"
    : "from-emerald-600 via-teal-600 to-cyan-700";

  const borderGlow = isJudge
    ? "shadow-blue-500/20"
    : isOrganizer
    ? "shadow-purple-500/20"
    : "shadow-emerald-500/20";

  const accentLight = isJudge
    ? "text-blue-300"
    : isOrganizer
    ? "text-purple-300"
    : "text-emerald-300";

  const icon = isJudge ? (
    <Award className="w-5 h-5 text-white" />
  ) : isOrganizer ? (
    <ShieldCheck className="w-5 h-5 text-white" />
  ) : (
    <Trophy className="w-5 h-5 text-white" />
  );

  const label = isJudge
    ? "Evaluation Certificate"
    : isOrganizer
    ? "Organizer Certificate"
    : "Participation Certificate";

  const issued = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const copySignature = () => {
    navigator.clipboard.writeText(cert.hmac_sha256_signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative rounded-3xl border border-white/10 bg-slate-950 shadow-2xl ${borderGlow} overflow-hidden group hover:-translate-y-1 transition-all duration-300`}
    >
      {/* Header gradient band */}
      <div className={`bg-gradient-to-r ${gradient} px-6 pt-6 pb-8`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {icon}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">{label}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{cert.issued_by}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/30">
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-white">Verified</span>
          </div>
        </div>

        {/* Star decoration */}
        <div className="flex items-center gap-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 text-white/40 fill-white/40" />
          ))}
        </div>
      </div>

      {/* White ribbon overlap */}
      <div className="relative -mt-4">
        <div className="mx-4 bg-slate-900 rounded-2xl border border-white/10 px-5 py-4 shadow-lg">
          <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
            This certifies that
          </p>
          <p className="text-sm font-black text-white mt-1 leading-tight">{cert.project_title}</p>
          {cert.project_track && (
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
              {cert.project_track}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Hackathon */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Hackathon</p>
            <p className="text-xs font-bold text-slate-200 truncate">{cert.hackathon_name}</p>
          </div>
        </div>

        {/* Date & ID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">Issued On</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <p className="text-[10px] font-bold text-slate-300 leading-tight">{issued}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">Certificate ID</p>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
              <p className="text-[10px] font-mono text-slate-300 truncate">{cert.certificate_id}</p>
            </div>
          </div>
        </div>

        {/* HMAC Signature */}
        <div className="rounded-xl bg-black/40 border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                HMAC-SHA256 Signature
              </p>
            </div>
            <button
              onClick={copySignature}
              className="text-[9px] font-mono text-slate-500 hover:text-white transition-colors flex items-center gap-1"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className={`text-[9px] font-mono ${accentLight} break-all leading-relaxed`}>
            {cert.hmac_sha256_signature}
          </p>
        </div>

        {/* View project link */}
        <Link
          href={`/projects/${cert.project_id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Project Submission
        </Link>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ role }: { role: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
        <Award className="w-9 h-9 text-slate-500" />
      </div>
      <h2 className="text-xl font-black text-white mb-2">No Certificates Yet</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        {role === "participant"
          ? "Submit a project to a hackathon and complete it to earn your first certificate. Certificates are issued when hackathons are marked complete."
          : role === "judge"
          ? "You will receive evaluation certificates once a hackathon you judged reaches its completed status."
          : "Certificates will appear here once hackathons you organised are marked as completed."}
      </p>
      {role === "participant" && (
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/30"
        >
          <Trophy className="w-4 h-4" />
          Browse Open Hackathons
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [certsLoading, setCertsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "participant" | "judge" | "organizer">("all");

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredUser();
      if (stored) setUser(stored);
      const remote = await fetchCurrentUser();
      if (remote) {
        setUser(remote);
      } else if (!stored) {
        router.push("/login?redirect=/certificates");
        return;
      }
      setLoading(false);
    }
    loadUser();
  }, [router]);

  useEffect(() => {
    if (loading) return;
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
    loadCerts();
  }, [loading]);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const role = user?.role || "participant";

  const certColumns: ColumnDef<Certificate>[] = [
    {
      key: "certificate_id",
      header: "Certificate ID",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
          <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-bold">{c.certificate_id}</span>
        </div>
      ),
    },
    {
      key: "project_title",
      header: "Project Submission",
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-bold text-white text-xs">{c.project_title}</div>
          {c.project_track && (
            <span className="text-[10px] text-slate-400 font-mono">{c.project_track}</span>
          )}
        </div>
      ),
    },
    {
      key: "hackathon_name",
      header: "Hackathon Event",
      sortable: true,
      render: (c) => (
        <span className="text-slate-300 font-medium text-xs">{c.hackathon_name}</span>
      ),
    },
    {
      key: "recipient_type",
      header: "Role / Badge",
      sortable: true,
      render: (c) => {
        const isJudge = c.recipient_type === "judge";
        const isOrganizer = c.recipient_type === "organizer";
        const badgeStyle = isJudge
          ? "bg-blue-950/70 border-blue-500/40 text-blue-300"
          : isOrganizer
          ? "bg-purple-950/70 border-purple-500/40 text-purple-300"
          : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300";
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${badgeStyle}`}>
            {c.recipient_type}
          </span>
        );
      },
    },
    {
      key: "issued_at",
      header: "Issued Date",
      sortable: true,
      render: (c) => (
        <span className="text-slate-400 text-xs font-mono">
          {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "hmac_sha256_signature",
      header: "HMAC Signature",
      sortable: false,
      render: (c) => (
        <div className="flex items-center gap-1.5 max-w-xs">
          <code className="text-[10px] font-mono text-emerald-400 truncate bg-black/40 px-2 py-0.5 rounded border border-white/5">
            {c.hmac_sha256_signature.slice(0, 16)}…
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(c.hmac_sha256_signature);
              toast.success("HMAC signature copied!");
            }}
            className="p-1 hover:text-white text-slate-400 cursor-pointer"
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
        <Link
          href={`/projects/${c.project_id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          <span>View Project</span>
        </Link>
      ),
    },
  ];

  const filteredCerts = certs.filter((c) => {
    const matchesSearch =
      !search ||
      c.project_title.toLowerCase().includes(search.toLowerCase()) ||
      c.hackathon_name.toLowerCase().includes(search.toLowerCase()) ||
      c.certificate_id.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || c.recipient_type === filter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-mono text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-blue-950/30 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back nav */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                  Cryptographically Verified
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
                My Certificates
              </h1>
              <p className="text-sm text-slate-400 mt-3 max-w-xl leading-relaxed">
                HMAC-SHA256 signed certificates issued by DOGFOOD Foundation for every hackathon
                you've successfully completed as a{" "}
                <span className="text-white font-semibold capitalize">{role}</span>.
              </p>
            </div>

            {/* Stats pill & View Switcher */}
            <div className="flex items-center gap-3">
              {!certsLoading && (
                <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                  <p className="text-3xl font-black text-white">{certs.length}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">
                    {certs.length === 1 ? "Certificate" : "Certificates"}
                  </p>
                </div>
              )}

              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="DataTable View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter bar (for Grid View) */}
      {viewMode === "grid" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by project, hackathon, or certificate ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
            </div>
            {/* Filter using Select2 */}
            <div className="w-48 shrink-0">
              <Select2
                variant="dark"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All Roles" },
                  { value: "participant", label: "Participant" },
                  { value: "judge", label: "Judge" },
                  { value: "organizer", label: "Organizer" },
                ]}
                isSearchable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Certificate Content: Grid or DataTable */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {certsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs font-mono text-slate-500">Loading certificates from DOGFOOD Foundation...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          certs.length > 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-sm">No certificates match your search.</p>
              <button
                onClick={() => { setSearch(""); setFilter("all"); }}
                className="mt-3 text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <EmptyState role={role} />
          )
        ) : viewMode === "table" ? (
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <DataTable<Certificate>
              data={filteredCerts}
              columns={certColumns}
              searchableKeys={["certificate_id", "project_title", "hackathon_name", "recipient_type", "issued_at"]}
              searchPlaceholder="Filter certificates by project, hackathon, ID..."
              emptyMessage="No certificates found."
              pageSize={10}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-5 font-mono">
              Showing {filteredCerts.length} of {certs.length} certificate{certs.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCerts.map((cert) => (
                <CertificateCard key={cert.certificate_id} cert={cert} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
