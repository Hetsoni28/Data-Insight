"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Search, RefreshCw, HardDriveUpload } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService } from "@/lib/storageService";

const FILTERS = ["All Files", "Datasets", "Reports", "AI Generated", "Archives", "Images"] as const;
type Filter = (typeof FILTERS)[number];

interface StorageHeroBannerProps {
  onSearch: (q: string) => void;
  onRefresh: () => void;
  onFilterChange?: (filter: Filter) => void;
}

export function StorageHeroBanner({
  onSearch,
  onRefresh,
  onFilterChange,
}: StorageHeroBannerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All Files");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return storageService.uploadFile(formData);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["owner-storage"] });
    },
    onError: () => {
      toast.error("Upload failed — please try again");
    },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilterClick = (f: Filter) => {
    setActiveFilter(f);
    onFilterChange?.(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    // Reset so the same file can be re-uploaded if needed
    e.target.value = "";
  };

  return (
    <div className="relative overflow-hidden bg-[#0c402d] rounded-lg shadow-xl mb-8 border border-[#082f22] text-white">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 p-8">
        {/* Top Row — Title + Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left — Title Block */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <HardDrive size={22} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Storage Operations
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-emerald-100/80 text-base leading-relaxed ml-14 max-w-xl"
            >
              Monitor, secure, and optimize every file stored across the Data
              Insight platform. Manage quotas, backups, and lifecycles.
            </motion.p>
          </div>

          {/* Right — Search + Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0"
          >
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search files, buckets…"
                value={search}
                onChange={handleSearch}
                className="w-full pl-9 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all backdrop-blur-md"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-lg shadow-black/30 transition-all active:scale-95"
            >
              {uploadMutation.isPending ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <HardDriveUpload className="h-4 w-4" />
              )}
              <span>{uploadMutation.isPending ? "Uploading…" : "Upload File"}</span>
            </button>
          </motion.div>
        </div>

        {/* Bottom Row — Quick Filter Pills + Live Badge */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f, i) => (
              <motion.button
                key={f}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                onClick={() => handleFilterClick(f)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  activeFilter === f
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-900/50"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {f}
              </motion.button>
            ))}
          </div>

          {/* Live Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-400 rounded-full"
            />
            <span className="text-emerald-300 text-xs font-medium tracking-wide">
              LIVE MONITORING
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
