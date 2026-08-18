import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8 w-full h-full space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
        <div className="space-y-3 w-full md:w-1/3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <div className="flex gap-2 hidden md:flex">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      
      {/* Filters/Toolbar skeleton */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-full md:w-64 rounded-xl" />
        <Skeleton className="h-10 w-full md:w-48 rounded-xl" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-[400px] w-full rounded-3xl relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-pulse" />
             </div>
          </Skeleton>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
