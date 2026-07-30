import React from "react";
import { CheckCircle2, ShieldCheck, KeyRound, Code, History } from "lucide-react";
import { FullProfile } from "@/lib/profile.service";

interface Props {
  profileData: FullProfile | null;
  setActiveTab: (tab: string) => void;
  setIsApiKeyModalOpen: (open: boolean) => void;
}

export function ProfileStatsSidebar({ profileData, setActiveTab, setIsApiKeyModalOpen }: Props) {
  const completionScore = profileData?.stats.profile_completion_percentage || 0;
  const securityScore = profileData?.stats.security_score || 0;

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="sticky top-6 space-y-6">
        
        <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/> Profile Completion
          </h3>
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionScore}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">{completionScore}% Complete</span>
            <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => setActiveTab('identity')}>Finish Setup</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400"/> Security Score
          </h3>
          <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
            <div className={`h-2 rounded-full ${securityScore >= 80 ? 'bg-blue-500' : securityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${securityScore}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {securityScore >= 80 ? 'Excellent! 2FA is enabled and passwords are strong.' : 'Your security score is low. Please review your settings.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 shadow-inner">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm font-medium">
            <li><button onClick={() => setActiveTab('security')} className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Password</button></li>
            <li><button onClick={() => setIsApiKeyModalOpen(true)} className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"><Code className="w-4 h-4" /> Generate API Key</button></li>
            <li><button onClick={() => setActiveTab('activity')} className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2"><History className="w-4 h-4" /> View Audit Logs</button></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
