import React from "react";

// Organizer Dashboard Layout
// Dedicated layout file for Organizer role
// Excludes footer view entirely
export default function OrganizerLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 w-full flex flex-col">
      {/* Organizer workspace view — strictly no footer */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
