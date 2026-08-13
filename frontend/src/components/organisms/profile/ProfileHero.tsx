import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ImageIcon, Mail, Calendar } from "lucide-react";
import { FullProfile } from "@/lib/profile.service";

interface Props {
  user: any;
  profileData: FullProfile | null;
  avatarUrl: string;
  setIsAvatarModalOpen: (open: boolean) => void;
}

export function ProfileHero({ user, profileData, avatarUrl, setIsAvatarModalOpen }: Props) {
  const memberSince = new Date(user?.created_at || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const displayRole = user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Platform Member";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm"
    >
      <div className="h-36 sm:h-48 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-900 opacity-90" />
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-400 rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-teal-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 border-b border-white/10" />
      </div>
      
      <div className="px-8 pb-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
          <div className="relative group shrink-0 -mt-16 sm:-mt-20 z-10">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2 bg-white/20 dark:bg-black/20 backdrop-blur-md shadow-2xl border border-white/30 dark:border-white/10">
              <div 
                className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-4xl sm:text-5xl font-bold overflow-hidden relative cursor-pointer ring-1 ring-inset ring-black/10 dark:ring-white/10" 
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase() || "A"
                )}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <ImageIcon className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-300 delay-75" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-lg" title={displayRole}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 pb-1 sm:pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {user?.full_name || displayRole}
              </h2>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm">
                {displayRole}
              </span>
              {user?.is_email_verified && (
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
                  Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {user?.email}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
