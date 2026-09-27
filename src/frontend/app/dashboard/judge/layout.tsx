import React from "react";

// Judge Dashboard Layout
// Dedicated layout file for Judge role
// Excludes footer view entirely
export default function JudgeLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 w-full flex flex-col">
      {/* Judge workspace view — strictly no footer */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
