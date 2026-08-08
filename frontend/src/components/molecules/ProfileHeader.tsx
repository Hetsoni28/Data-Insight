import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ImageIcon, Mail, MapPin, Building2 } from "lucide-react";
import { FullProfile } from "@/lib/profile.service";

interface Props {
  user: any;
  profileData: FullProfile | null;
  avatarUrl: string;
  setIsAvatarModalOpen: (open: boolean) => void;
}

export function ProfileHeader({ user, profileData, avatarUrl, setIsAvatarModalOpen }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
    >
      <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-800"></div>
      <div className="px-8 pb-8 relative">
        <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-white dark:bg-background p-1 shadow-lg">
              <div 
                className="w-full h-full rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl font-bold overflow-hidden relative cursor-pointer" 
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.full_name?.charAt(0).toUpperCase()}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg border-2 border-white dark:border-background shadow-sm" title="Platform Owner Verified">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.full_name || "Platform Owner"}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">Owner</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">Verified</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user?.email}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profileData?.profile?.city || "Remote"}, {profileData?.profile?.country || "Global"}</span>
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {profileData?.profile?.company_name || "Platform Organization"}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
