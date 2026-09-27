"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { likeProject } from "@/lib/api";

interface LikeButtonProps {
  idOrSlug: string;
  initialLikes: number;
}

export default function LikeButton({ idOrSlug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const newCount = await likeProject(idOrSlug);
    if (newCount !== null) {
      setLikes(newCount);
      setHasLiked(true);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
        hasLiked
          ? "bg-rose-50 text-rose-600 border border-rose-200"
          : "bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-200"
      }`}
      title="Like this submission"
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
