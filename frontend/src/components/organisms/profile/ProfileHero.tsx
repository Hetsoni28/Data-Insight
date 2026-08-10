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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
    >
      <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-800"></div>
      <div className="px-8 pb-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
          <div className="relative group shrink-0 -mt-12 sm:-mt-16 z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-[#0B0F17] p-1.5 shadow-md">
              <div 
                className="w-full h-full rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-4xl sm:text-5xl font-bold overflow-hidden relative cursor-pointer" 
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase() || "A"
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-emerald-500 text-white p-1.5 sm:p-2 rounded-full border-4 border-white dark:border-slate-950 shadow-sm" title="Organization Admin">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex-1 pb-1 sm:pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {user?.full_name || "Organization Admin"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                Organization Admin
              </span>
              {user?.is_email_verified && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                  Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user?.email}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
