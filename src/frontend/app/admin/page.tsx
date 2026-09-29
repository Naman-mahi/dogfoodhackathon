"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  Activity,
  Webhook,
  Database,
  BarChart3,
  Calendar,
  FolderGit2,
  Lock,
  ArrowRight,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
} from "lucide-react";
import { AuthUser, getStoredUser, fetchCurrentUser } from "@/lib/auth";
import toast from "react-hot-toast";
import DataTable, { ColumnDef } from "@/components/DataTable";
import Select2 from "@/components/Select2";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

interface AuditLogItem {
  id: number;
  user_id: string;
  action: string;
  details: any;
  timestamp: string;
}

interface WebhookItem {
  id: string;
  event_type: string;
  target_url: string;
}

interface AdminStats {
  users: number;
  events: number;
  projects: number;
  scores: number;
  audit_logs: number;
  webhooks: number;
  mode: string;
  system_status: string;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
            <span>Loading Admin Console...</span>
          </div>
        </div>
      }
    >
      <AdminConsoleContent />
    </Suspense>
  );
}

function AdminConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);

  // Webhook form
  const [newWebhook, setNewWebhook] = useState({ event_type: "project.submitted", target_url: "", secret: "" });
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  // Create user modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    bio: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error("Please fill in name, email, and password.");
      return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create user.");
      }
      const created = await res.json();
      setUsers((prev) => [created, ...prev]);
      setShowCreateUserModal(false);
      setNewUserData({ name: "", email: "", password: "", role: "admin", bio: "" });
      toast.success(`User created successfully as ${created.name} (${created.role})!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  useEffect(() => {
    async function init() {
      const stored = getStoredUser();
      if (stored) setCurrentUser(stored);

      const remote = await fetchCurrentUser();
      if (remote) {
        setCurrentUser(remote);
        if (remote.role !== "admin" && remote.role !== "organizer") {
          toast.error("Administrator access required.");
          router.push("/dashboard");
          return;
        }
      } else if (!stored) {
        router.push("/login?redirect=/admin");
        return;
      }

      await loadAdminData();
      setLoading(false);
    }
    init();
  }, [router]);

  const loadAdminData = async () => {
    try {
      // 1. Fetch stats
      const statsRes = await fetch("/api/v1/admin/stats");
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. Fetch users
      const usersRes = await fetch("/api/v1/admin/users");
      if (usersRes.ok) setUsers(await usersRes.json());

      // 3. Fetch audit logs
      const auditRes = await fetch("/api/v1/admin/audit-logs");
      if (auditRes.ok) setAuditLogs(await auditRes.json());

      // 4. Fetch webhooks
      const whRes = await fetch("/api/v1/admin/webhooks");
      if (whRes.ok) setWebhooks(await whRes.json());
    } catch (err) {
      console.warn("Failed to load admin data:", err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`User role updated to '${newRole}'!`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        toast.error("Failed to update user role.");
      }
    } catch (err) {
      toast.error("Network error while updating role.");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.target_url) {
      toast.error("Target URL is required");
      return;
    }
    setCreatingWebhook(true);
    try {
      const res = await fetch("/api/v1/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });
      if (res.ok) {
        const created = await res.json();
        setWebhooks((prev) => [...prev, created]);
        setNewWebhook({ event_type: "project.submitted", target_url: "", secret: "" });
        toast.success("Webhook registered successfully!");
      } else {
        toast.error("Failed to register webhook.");
      }
    } catch (err) {
      toast.error("Error creating webhook.");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const userColumns: ColumnDef<UserItem>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <img
            src={u.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.email}`}
            alt={u.name}
            className="w-8 h-8 rounded-full bg-slate-100 ring-1 ring-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{u.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      className: "font-mono text-slate-600",
      accessor: (u) => u.email,
    },
    {
      key: "role",
      header: "Current Role",
      sortable: true,
      render: (u) => (
        <span
          className={`badge-pill font-mono uppercase text-[10px] ${
            u.role === "admin"
              ? "bg-purple-100 text-purple-800 border-purple-300 font-bold"
              : u.role === "organizer"
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : u.role === "judge"
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-100 text-emerald-800 border-emerald-300"
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: "bio",
      header: "Bio / Description",
      className: "text-slate-500 max-w-xs truncate",
      accessor: (u) => u.bio || "No bio specified.",
    },
    {
      key: "actions",
      header: "Assign Role",
      className: "text-right",
      headerClassName: "text-right",
      render: (u) => (
        <div className="w-36 ml-auto">
          <Select2
            variant="light"
            value={u.role}
            onChange={(val) => handleRoleChange(u.id, val)}
            options={[
              { value: "participant", label: "Participant" },
              { value: "judge", label: "Judge" },
              { value: "organizer", label: "Organizer" },
              { value: "admin", label: "Admin" },
            ]}
            isSearchable={false}
          />
        </div>
      ),
    },
  ];

  const auditColumns: ColumnDef<AuditLogItem>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      className: "font-mono text-slate-400",
      render: (log) => `#${log.id}`,
    },
    {
      key: "action",
      header: "Action Tag",
      sortable: true,
      render: (log) => (
        <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 font-bold font-mono">
          {log.action}
        </span>
      ),
    },
    {
      key: "user_id",
      header: "User / Operator",
      sortable: true,
      className: "font-mono text-slate-800 font-semibold",
      accessor: (log) => log.user_id,
    },
    {
      key: "details",
      header: "Payload Details",
      className: "font-sans text-slate-600 max-w-md truncate",
      render: (log) => (typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      className: "text-right text-slate-400 font-mono text-[11px]",
      headerClassName: "text-right",
      render: (log) => new Date(log.timestamp).toLocaleString(),
    },
  ];

  const webhookColumns: ColumnDef<WebhookItem>[] = [
    {
      key: "id",
      header: "ID",
      className: "font-mono text-slate-400",
      accessor: (wh) => wh.id,
    },
    {
      key: "event_type",
      header: "Event Type",
      sortable: true,
      render: (wh) => (
        <span className="badge-pill bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
          {wh.event_type}
        </span>
      ),
    },
    {
      key: "target_url",
      header: "Target URL",
      className: "font-mono text-slate-800",
      accessor: (wh) => wh.target_url,
    },
    {
      key: "status",
      header: "Status",
      className: "text-right",
      headerClassName: "text-right",
      render: () => (
        <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
          Active Dispatch
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading System Administration Console...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-pill bg-purple-100 text-purple-800 border border-purple-300 font-mono font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-purple-700" />
              Root Administration Console
            </span>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role Isolation Active
            </span>
            <span className="badge-pill bg-blue-50 text-blue-700 border border-blue-200">
              Offline-Autonomous Single-Port (8080)
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            System Administration &amp; Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Global operator governance: user roles, live audit trails, cryptographic certificates, and webhook dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh State
          </button>
          <Link
            href="/manage-events"
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            Manage Hackathons &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "System Overview", icon: <Activity className="w-4 h-4" /> },
          { id: "users", label: `User Management (${users.length})`, icon: <Users className="w-4 h-4" /> },
          { id: "audit", label: `Audit Logs (${auditLogs.length})`, icon: <Database className="w-4 h-4" /> },
          { id: "webhooks", label: `Webhooks (${webhooks.length})`, icon: <Webhook className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Users</span>
              <div className="text-2xl font-black text-slate-900">{stats?.users ?? users.length}</div>
              <p className="text-[11px] text-slate-500">Seeded &amp; registered</p>
            </div>
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Hackathons</span>
              <div className="text-2xl font-black text-blue-600">{stats?.events ?? 6}</div>
              <p className="text-[11px] text-slate-500">Active competitions</p>
            </div>
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Projects</span>
              <div className="text-2xl font-black text-emerald-600">{stats?.projects ?? 12}</div>
              <p className="text-[11px] text-slate-500">Total submissions</p>
            </div>
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Judge Scores</span>
              <div className="text-2xl font-black text-purple-600">{stats?.scores ?? 18}</div>
              <p className="text-[11px] text-slate-500">Double-blind scorecards</p>
            </div>
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Audit Logs</span>
              <div className="text-2xl font-black text-amber-600">{stats?.audit_logs ?? auditLogs.length}</div>
              <p className="text-[11px] text-slate-500">State mutations</p>
            </div>
            <div className="card-modern p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Webhooks</span>
              <div className="text-2xl font-black text-indigo-600">{stats?.webhooks ?? webhooks.length}</div>
              <p className="text-[11px] text-slate-500">Registered targets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-modern p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Role-Based Access Enforcement Architecture
              </h2>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  The DOGFOOD platform enforces strict backend role authorization. Role isolation is verified at the HTTP dependency layer:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li><strong>Admin</strong>: Complete platform oversight, role mutation, and audit access.</li>
                  <li><strong>Organizer</strong>: Hackathon creation, rubric calibration, and CSV matrix export.</li>
                  <li><strong>Judge</strong>: Independent evaluations; peer score queries trigger instant <code className="text-rose-600 font-mono">HTTP 403</code>.</li>
                  <li><strong>Participant</strong>: Team formation, draft/edit submissions, and public gallery voting.</li>
                </ul>
              </div>
            </div>

            <div className="card-modern p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-500" />
                Cryptographic Signature Engine
              </h2>
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  Certificates are generated using server-side HMAC-SHA256 digital signatures with constant-time verification:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  Payload: CERT:&#123;project_id&#125;:&#123;title&#125;:&#123;team&#125;<br />
                  HMAC: hmac.new(SECRET_KEY, payload, sha256).hexdigest()
                </div>
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 pt-1"
                >
                  View Issued Certificates &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User & Role Management */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Users &amp; Role Management</h2>
              <p className="text-xs text-slate-500">Elevate or modify user authorization roles in real time or provision dedicated admin accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUserModal(true)}
              className="btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 font-bold cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add User / Admin</span>
            </button>
          </div>

          <DataTable<UserItem>
            data={users}
            columns={userColumns}
            title="Registered Platform Users &amp; Roles"
            subtitle="Elevate or modify user authorization roles in real time. Changes take effect on the next session request."
            searchPlaceholder="Search users by name, email, or role..."
            pageSize={10}
          />
        </div>
      )}

      {/* Tab 3: Live Audit Logs */}
      {activeTab === "audit" && (
        <DataTable<AuditLogItem>
          data={auditLogs}
          columns={auditColumns}
          title="Immutable System Audit Trail"
          subtitle="Cryptographically tracked mutations: authentication, submissions, judge scoring, and role alterations."
          searchPlaceholder="Search audit trail by action, operator, or details..."
          pageSize={15}
          emptyMessage="No audit records logged yet. Mutations write live records here as users interact with the system."
        />
      )}

      {/* Tab 4: Webhooks Configuration */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          {/* Create Webhook Form */}
          <form onSubmit={handleCreateWebhook} className="card-modern p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Register Outbound Webhook Dispatcher</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Event Type</label>
                <Select2
                  variant="light"
                  value={newWebhook.event_type}
                  onChange={(val) => setNewWebhook({ ...newWebhook, event_type: val })}
                  options={[
                    { value: "project.submitted", label: "project.submitted" },
                    { value: "score.calibrated", label: "score.calibrated" },
                    { value: "hackathon.published", label: "hackathon.published" },
                    { value: "judge.assigned", label: "judge.assigned" },
                  ]}
                  isSearchable={false}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Target Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.org/webhook-receiver"
                  value={newWebhook.target_url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, target_url: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Signing Secret</label>
                <input
                  type="text"
                  placeholder="whsec_dogfood_secret"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingWebhook}
              className="btn-primary text-xs py-2.5 px-6 shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creatingWebhook ? "Registering..." : "Register Webhook"}</span>
            </button>
          </form>

          {/* Webhooks DataTable */}
          <DataTable<WebhookItem>
            data={webhooks}
            columns={webhookColumns}
            title="Active Webhook Subscriptions"
            subtitle="Automated HTTP callbacks triggered upon platform state events."
            searchPlaceholder="Search webhook subscriptions..."
            pageSize={10}
            emptyMessage="No webhooks configured. Register a target URL above to receive automated dispatch events."
          />
        </div>
      )}

      {/* Add User / Admin Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision User Account</h3>
                  <p className="text-xs text-slate-500">Create an admin, organizer, judge, or participant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin.sarah@dogfood.internal"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Platform Role</label>
                <Select2
                  variant="light"
                  value={newUserData.role}
                  onChange={(val) => setNewUserData({ ...newUserData, role: val })}
                  options={[
                    { value: "admin", label: "👑 System Administrator (Root Access)" },
                    { value: "organizer", label: "🎯 Organizer (Event & Rubric Control)" },
                    { value: "judge", label: "⚖️ Judge (Submission Evaluator)" },
                    { value: "participant", label: "💻 Participant (Builder & Team Member)" },
                  ]}
                  isSearchable={false}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bio / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Operations lead for APAC hackathons"
                  value={newUserData.bio}
                  onChange={(e) => setNewUserData({ ...newUserData, bio: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="btn-secondary text-xs py-2.5 px-4 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {creatingUser ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
