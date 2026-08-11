"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle, Clock, MapPin, Building2, Briefcase, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerProfile } from "@/lib/viewer-profile.service";

interface Props {
  profile: ViewerProfile | null;
  isLoading: boolean;
}

export function ViewerProfileHeader({ profile, isLoading }: Props) {
  if (isLoading || !profile) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-24" /></div>
          </div>
          <div className="flex gap-3"><Skeleton className="h-20 w-28" /><Skeleton className="h-20 w-28" /></div>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || "V")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColor = profile.account_status === "active"
    ? "bg-emerald-500"
    : profile.account_status === "locked"
    ? "bg-amber-500"
    : "bg-rose-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm relative overflow-hidden"
    >
      {/* Subtle gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Avatar"}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-slate-800 shadow-lg">
              {initials}
            </div>
          )}
          <div className={`absolute bottom-1 right-1 w-5 h-5 ${statusColor} rounded-full border-2 border-white dark:border-slate-900`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {profile.full_name || "Viewer Account"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
            <Mail className="w-3.5 h-3.5" /> {profile.email}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {profile.organization_name && (
              <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <Building2 className="w-3 h-3 mr-1" /> {profile.organization_name}
              </Badge>
            )}
            {profile.department && (
              <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <Briefcase className="w-3 h-3 mr-1" /> {profile.department}
              </Badge>
            )}
            <Badge className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
              {profile.role.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" className={`text-xs ${profile.account_status === "active" ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "text-amber-600 border-amber-200"}`}>
              {profile.account_status === "active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
              {profile.account_status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Member since {new Date(profile.member_since).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            {profile.last_active && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last active {new Date(profile.last_active).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Score Cards */}
        <div className="flex gap-3">
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 min-w-[100px]">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{profile.profile_completion}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Profile</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 min-w-[100px]">
            <div className={`text-2xl font-bold ${profile.security_score >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {profile.security_score}%
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Security</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
