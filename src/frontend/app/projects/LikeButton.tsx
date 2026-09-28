"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { likeProject } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  idOrSlug?: string;
  projectId?: string;
  initialLikes: number;
}

export default function LikeButton({ idOrSlug, projectId, initialLikes }: LikeButtonProps) {
  const router = useRouter();
  const targetId = idOrSlug || projectId || "";
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || !targetId) return;

    const user = getStoredUser();
    if (!user) {
      toast.error("Please sign in to upvote submissions.", { id: "auth-like-required" });
      router.push(`/login?redirect=/projects`);
      return;
    }

    setLoading(true);
    const result = await likeProject(targetId);

    if (result.success) {
      if (typeof result.likes_count === "number") {
        setLikes(result.likes_count);
      } else {
        setLikes((prev) => prev + 1);
      }
      setHasLiked(true);
      toast.success("Project upvoted! ❤️", { id: `like-${targetId}` });
    } else if (result.status === 401) {
      toast.error("Your session has expired. Please sign in again.", { id: "auth-expired" });
      router.push(`/login?redirect=/projects`);
    } else if (result.status === 429) {
      setHasLiked(true);
      toast("You have already voted for this project!", { icon: "ℹ️", id: `already-liked-${targetId}` });
    } else {
      toast.error(result.error || "Failed to submit vote.", { id: `err-like-${targetId}` });
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
        hasLiked
          ? "bg-rose-50 text-rose-600 border border-rose-200"
          : "bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-200"
      }`}
      title={hasLiked ? "Already upvoted" : "Upvote this submission"}
    >
      <Heart
        className={`w-3.5 h-3.5 transition-transform ${
          hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
        }`}
      />
      <span>{likes}</span>
    </button>
  );
}
