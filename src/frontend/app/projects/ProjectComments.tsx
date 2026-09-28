"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send, User, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { getStoredUser, AuthUser } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/api";
import toast from "react-hot-toast";

interface CommentItem {
  id: number;
  project_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export default function ProjectComments({ projectId }: { projectId: string }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in to post constructive feedback.");
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    const author = currentUser.name || currentUser.email || "Community Member";
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          author_name: author,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setContent("");
        toast.success("Feedback posted successfully!");
        await loadComments();
      } else if (res.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to post feedback.");
      }
    } catch (err) {
      toast.error("Network error while posting feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-modern p-6 sm:p-8 space-y-6 bg-slate-50/60 border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Community Feedback &amp; Discussion ({comments.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Open Community Peer Review
        </span>
      </div>

      {/* Authenticated Comment Form or Sign-in Prompt */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
            </div>
            <span className="text-xs font-semibold text-slate-700">
              Posting as <span className="font-bold text-slate-900">{currentUser.name || currentUser.email}</span>
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md ml-auto">
              {currentUser.role}
            </span>
          </div>

          <div>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share constructive insights on architecture, UX design, technical stack, or question the submission team..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="btn-primary text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Feedback</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Sign in to join the discussion</p>
              <p className="text-[11px] text-slate-500">Only verified hackathon members can post peer reviews and comments.</p>
            </div>
          </div>
          <Link
            href={`/login?redirect=/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Comment</span>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-1">
          <p className="text-xs font-semibold text-slate-600">No community comments yet</p>
          <p className="text-[11px] text-slate-400">Be the first to share constructive peer review on this submission!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-xs font-bold">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{c.author_name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now"}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed pl-8">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
