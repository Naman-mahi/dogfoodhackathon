import React, { Suspense } from "react";
import ResultsClient from "./ResultsClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading Leaderboards...</p>
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
