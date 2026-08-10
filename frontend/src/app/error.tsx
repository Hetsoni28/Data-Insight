﻿"use client";

import { useEffect } from "react";
import { StateLayout } from "@/components/molecules/StateLayout";
import { ServerErrorIllustration } from "@/components/molecules/ServerErrorIllustration";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-500/10 dark:bg-red-500/5 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg w-full">
        <StateLayout
          illustration={<ServerErrorIllustration />}
          headline="Something went wrong"
          description={error.message || "An unexpected error occurred in our system. Our engineering team has been notified."}
          primaryAction={{
            label: "Try Again",
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => reset(),
          }}
          aiSuggestion="AI diagnostic: Temporary network failure or internal server error."
        />
      </div>
    </div>
  );
}
