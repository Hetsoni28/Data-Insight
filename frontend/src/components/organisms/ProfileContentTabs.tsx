import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  User, ShieldAlert, KeyRound, Save, Loader2, Image as ImageIcon, Smartphone, 
  Mail, BellRing, Code, Globe, CheckCircle2, ShieldCheck, QrCode, Terminal, 
  Trash2, Plus, Copy, Building2, MapPin, Briefcase, Clock, Calendar, Laptop2,
  AlertTriangle, History, Activity, Database, Server, Fingerprint, Lock, Eye, EyeOff,
  Download, ShieldX, Check, RefreshCw
} from "lucide-react";
import { SettingCard } from "@/components/molecules/SettingCard";
import { FormInput } from "@/components/molecules/FormInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { setupMFA, enableMFA, disableMFA, getLoginHistory, type LoginHistoryItem } from "@/lib/auth.service";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ProfileContentTabs({ 
  activeTab, user, profileData, formData, setFormData, 
  sessions, activities, auditLogs, apiKeys,
  setIsPasswordModalOpen, handleTerminateSession, handleTerminateAllOtherSessions,
  setIsApiKeyModalOpen, handleRevokeApiKey, reloadProfile 
}: any) {
  // MFA Modal States
  const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
  const [isMfaDisableOpen, setIsMfaDisableOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [mfaSetupStep, setMfaSetupStep] = useState<1 | 2>(1); // 1: QR & Code, 2: Recovery Codes
  const [disablePassword, setDisablePassword] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Login History State
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Login History when tab changes
  React.useEffect(() => {
    if (activeTab === "activity") {
      setIsLoadingHistory(true);
      getLoginHistory()
        .then((data) => setLoginHistory(data))
        .catch(() => setLoginHistory([]))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab]);

  const handleStartMfaSetup = async () => {
    setIsMfaLoading(true);
    try {
      const res = await setupMFA();
      setMfaSecret(res.secret);
      setMfaQrCode(res.qr_code_url);
      setMfaRecoveryCodes(res.recovery_codes || []);
      setMfaSetupStep(1);
      setMfaVerificationCode("");
      setIsMfaSetupOpen(true);
    } catch (err: any) {
      toast.error("Failed to initialize MFA setup", {
        description: err?.response?.data?.message || "Please check your network connection."
      });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleConfirmEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaVerificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code.");
      return;
    }
    setIsMfaLoading(true);
    try {
      const res = await enableMFA(mfaVerificationCode);
      if (res.recovery_codes && res.recovery_codes.length > 0) {
        setMfaRecoveryCodes(res.recovery_codes);
      }
      setMfaSetupStep(2);
      toast.success("Two-Factor Authentication activated!");
      if (reloadProfile) reloadProfile();
    } catch (err: any) {
      toast.error("Verification failed", {
        description: err?.response?.data?.message || "Invalid 6-digit code. Please try again."
      });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleConfirmDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error("Please enter your current password.");
      return;
    }
    setIsMfaLoading(true);
    try {
      await disableMFA(disablePassword);
      toast.success("Two-Factor Authentication disabled.");
      setIsMfaDisableOpen(false);
      setDisablePassword("");
      if (reloadProfile) reloadProfile();
    } catch (err: any) {
      toast.error("Failed to disable MFA", {
        description: err?.response?.data?.message || "Invalid password."
      });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(mfaRecoveryCodes.join("\n"));
    setCopiedCodes(true);
    toast.success("Recovery codes copied to clipboard!");
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const downloadRecoveryCodes = () => {
    const text = `DATA INSIGHT ENTERPRISE RECOVERY CODES\nGenerated: ${new Date().toISOString()}\nAccount: ${user?.email}\n\n` +
      mfaRecoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nKeep these codes stored securely in a password manager or safe location.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-insight-recovery-codes-${user?.email || "backup"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded!");
  };

  return (
    <div className="lg:col-span-3 min-h-[500px]">
      <AnimatePresence mode="wait">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div key="overview" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            
            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "AI Requests", value: profileData?.stats?.ai_requests?.toLocaleString() ?? "0", icon: Terminal, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Reports Generated", value: profileData?.stats?.reports_generated?.toLocaleString() ?? "0", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "API Calls", value: profileData?.stats?.api_calls?.toLocaleString() ?? "0", icon: Code, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Storage (MB)", value: profileData?.stats?.storage_used_mb?.toLocaleString() ?? "0", icon: Server, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((stat, i) => (
                <motion.div variants={itemVariants} key={i} className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all cursor-default">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PROFILE SUMMARY */}
            <motion.div variants={itemVariants}>
              <SettingCard title="Executive Summary" description="Overview of your identity on the platform." icon={Briefcase}>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Company</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.company_name || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role / Position</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.job_title || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Department</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.department || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Timezone</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.timezone || "UTC"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account Created</p><p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(user?.created_at || "").toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">MFA Security</p><p className={`text-sm font-medium flex items-center gap-1 ${user?.mfa_enabled ? "text-emerald-600" : "text-amber-600"}`}><ShieldCheck className="w-3.5 h-3.5" /> {user?.mfa_enabled ? "Enforced (TOTP)" : "Not Enforced"}</p></div>
                </div>
              </SettingCard>
            </motion.div>

          </motion.div>
        )}

        {/* IDENTITY TAB */}
        {activeTab === "identity" && (
          <motion.div key="identity" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <motion.div variants={itemVariants}>
              <SettingCard title="Personal Information" description="Your core identity details." icon={User}>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <FormInput label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  <FormInput label="Display Email" value={user?.email || ""} disabled description="Managed by platform security." />
                  <FormInput label="Alternate Email" value={formData.alternate_email} onChange={e => setFormData({...formData, alternate_email: e.target.value})} />
                  <FormInput label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <FormInput label="Birth Date" type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                  <FormInput label="Language" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
                </div>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <FormInput label="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                  <FormInput label="State/Region" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  <FormInput label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="mt-4">
                  <Label>Executive Biography</Label>
                  <textarea 
                    value={formData.short_bio} onChange={e => setFormData({...formData, short_bio: e.target.value})}
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 min-h-[100px]"
                    placeholder="Brief background about yourself..."
                  />
                </div>
              </SettingCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SettingCard title="Professional Footprint" description="Career and public presence." icon={Globe}>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <FormInput label="Company Name" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                  <FormInput label="Job Title" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} />
                  <FormInput label="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  <FormInput label="Industry" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                  <FormInput label="Years of Experience" type="number" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: e.target.value})} />
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 grid md:grid-cols-2 gap-4">
                  <FormInput label="Personal Website" type="url" placeholder="https://" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  <FormInput label="LinkedIn Profile" type="url" placeholder="https://linkedin.com/in/" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
                  <FormInput label="GitHub Profile" type="url" placeholder="https://github.com/" value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} />
                  <FormInput label="Twitter/X Profile" type="url" placeholder="https://twitter.com/" value={formData.twitter_url} onChange={e => setFormData({...formData, twitter_url: e.target.value})} />
                </div>
              </SettingCard>
            </motion.div>
          </motion.div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <motion.div key="security" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <motion.div variants={itemVariants}>
              <SettingCard title="Authentication & Multi-Factor Security (MFA)" description="Protect your enterprise workspace with hardware-grade MFA and token encryption." icon={Lock}>
                <div className="mt-4 space-y-4">
                  
                  {/* Change Password */}
                  <Button onClick={() => setIsPasswordModalOpen(true)} variant="outline" className="w-full justify-start h-14 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10">
                    <KeyRound className="w-5 h-5 mr-4 text-slate-500 dark:text-slate-400" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Change Account Password</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Update your credentials with bcrypt encryption</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Manage</span>
                  </Button>

                  {/* Two-Factor Authentication Status Card */}
                  {user?.mfa_enabled ? (
                    <div className="w-full justify-start p-4 border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
                            Two-Factor Authentication is Active
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-200/60 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">Enforced</span>
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">TOTP Authenticator & 10 Recovery Codes Active</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsMfaDisableOpen(true)}
                          className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800/40 dark:text-red-400"
                        >
                          <ShieldX className="w-3.5 h-3.5 mr-1.5" /> Disable MFA
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full justify-start p-4 border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-950 dark:text-amber-300">Two-Factor Authentication is Disabled</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Add an extra layer of protection using Google Authenticator, Authy, or 1Password.</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleStartMfaSetup} 
                        disabled={isMfaLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-9"
                      >
                        {isMfaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Fingerprint className="w-3.5 h-3.5 mr-1.5" />}
                        Enable MFA
                      </Button>
                    </div>
                  )}

                </div>
              </SettingCard>
            </motion.div>

            {/* ACTIVE SESSIONS & DEVICE MANAGEMENT */}
            <motion.div variants={itemVariants}>
              <SettingCard title="Active Sessions & Device Management" description="View and revoke authorized device sessions connected to your workspace." icon={Laptop2}>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl mb-4 gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Global Revocation & Session Wipe</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[450px]">Immediately invalidate all refresh tokens, sessions, and active JWT versions across all devices.</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleTerminateAllOtherSessions} className="shrink-0 font-medium">
                      Sign Out Everywhere Else
                    </Button>
                  </div>

                  {sessions.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No active sessions detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session: any) => (
                        <div key={session.id} className={`flex items-start justify-between p-4 border rounded-xl transition-all ${session.is_current ? 'bg-emerald-50/30 border-emerald-200/80 dark:bg-emerald-950/10 dark:border-emerald-900/40' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${session.is_current ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'}`}>
                              {session.os?.toLowerCase().includes("mac") || session.os?.toLowerCase().includes("windows") || session.os?.toLowerCase().includes("linux") ? (
                                <Laptop2 className="w-5 h-5" />
                              ) : (
                                <Smartphone className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {session.device_name || session.os || "Desktop Device"} • {session.browser || "Browser"}
                                </p>
                                {session.is_current && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 uppercase tracking-wider">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                <span className="font-mono">{session.ip_address}</span>
                                <span>•</span>
                                <span>{session.location || (session.city ? `${session.city}, ${session.country}` : "Location Secured")}</span>
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                First login: {new Date(session.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!session.is_current && (
                            <Button variant="ghost" size="sm" onClick={() => handleTerminateSession(session.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs">
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingCard>
            </motion.div>

            {/* API KEYS & DEVELOPER ACCESS */}
            <motion.div variants={itemVariants}>
              <SettingCard title="API Keys & Developer Access" description="Manage personal access tokens for programmatic API operations." icon={Terminal}>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Access Tokens</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[400px]">Secure keys for automation, CLI utilities, and SDK connections.</p>
                    </div>
                    <Button onClick={() => setIsApiKeyModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Generate new token
                    </Button>
                  </div>

                  {apiKeys.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No API keys generated yet.</p>
                  ) : (
                    <div className="border rounded-xl divide-y overflow-hidden">
                      {apiKeys.map((key: any) => (
                        <div key={key.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {key.name}
                              {key.is_active ? <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span> : <span className="w-2 h-2 rounded-full bg-red-500" title="Revoked"></span>}
                            </h5>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{key.prefix}••••••••••••••••••••••••••••••••</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Created on {new Date(key.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRevokeApiKey(key.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingCard>
            </motion.div>
          </motion.div>
        )}

        {/* AUDIT & ACTIVITY TAB */}
        {activeTab === "activity" && (
          <motion.div key="activity" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            
            {/* LOGIN HISTORY & GEOLOCATION AUDIT TRAIL */}
            <motion.div variants={itemVariants}>
              <SettingCard title="Authentication & Login History" description="Comprehensive audit trail of recent sign-in attempts, devices, and geolocation." icon={History}>
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-white/5 grid grid-cols-12 gap-3 p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Device / Client</div>
                    <div className="col-span-3">IP & Location</div>
                    <div className="col-span-4 text-right">Timestamp</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
                    {isLoadingHistory ? (
                      <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" /></div>
                    ) : loginHistory.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No login history recorded.</div>
                    ) : (
                      loginHistory.map((log) => (
                        <div key={log.id} className="grid grid-cols-12 gap-3 p-3.5 text-sm items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div className="col-span-2">
                            {log.success ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" title={log.failure_reason}>
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </div>
                          <div className="col-span-3">
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">{log.browser || "Unknown"} on {log.os || "Unknown"}</p>
                            <p className="text-[11px] text-slate-400 capitalize">{log.device || "Desktop"}</p>
                          </div>
                          <div className="col-span-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                            <p>{log.ip_address}</p>
                            <p className="text-[11px] text-slate-400 font-sans">{log.city ? `${log.city}, ${log.country}` : log.country || "Secured"}</p>
                          </div>
                          <div className="col-span-4 text-right text-xs text-slate-500 dark:text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SettingCard>
            </motion.div>

            {/* AUDIT LOG */}
            <motion.div variants={itemVariants}>
              <SettingCard title="Workspace Audit Log" description="System actions and resource changes performed by your account." icon={Activity}>
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-white/5 grid grid-cols-12 gap-4 p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <div className="col-span-3">Action</div>
                    <div className="col-span-3">Entity</div>
                    <div className="col-span-3">IP Address</div>
                    <div className="col-span-3 text-right">Timestamp</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No workspace audit logs available.</div>
                    ) : (
                      auditLogs.map((log: any) => (
                        <div key={log.id} className="grid grid-cols-12 gap-4 p-3 text-sm items-center hover:bg-slate-50 dark:hover:bg-white/5">
                          <div className="col-span-3 font-medium text-slate-900 dark:text-white capitalize">{log.action?.replace(/_/g, ' ')}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 font-mono text-xs truncate" title={log.resource_id}>{log.resource_type}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{log.ip_address || "Internal"}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 text-xs text-right">{new Date(log.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SettingCard>
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── MFA SETUP MODAL ── */}
      <Dialog open={isMfaSetupOpen} onOpenChange={setIsMfaSetupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-emerald-600" />
              {mfaSetupStep === 1 ? "Set Up Two-Factor Authentication" : "Save Your Emergency Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {mfaSetupStep === 1 
                ? "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) to link your account."
                : "Store these 10 recovery codes safely. Each code can be used once to access your account if you lose your phone."}
            </DialogDescription>
          </DialogHeader>

          {mfaSetupStep === 1 ? (
            <form onSubmit={handleConfirmEnableMfa} className="space-y-4 py-2">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                {mfaQrCode ? (
                  <img src={mfaQrCode} alt="TOTP QR Code" className="w-48 h-48 rounded-xl shadow-md bg-white p-2" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                )}
                <div className="mt-3 text-center">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Or enter secret key manually:</p>
                  <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 select-all bg-white dark:bg-white/10 px-2 py-1 rounded mt-1 inline-block border">{mfaSecret}</code>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enter the 6-Digit Code from your Authenticator App
                </Label>
                <Input 
                  type="text" 
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="123456" 
                  value={mfaVerificationCode} 
                  onChange={(e) => setMfaVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center font-mono text-lg tracking-widest h-11"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsMfaSetupOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isMfaLoading || mfaVerificationCode.length !== 6} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isMfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Verify & Activate
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Important:</strong> These codes will not be shown again. Save them now to ensure you are never locked out of your tenant instance.
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border font-mono text-xs text-center font-bold text-slate-800 dark:text-slate-200">
                {mfaRecoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-2 bg-white dark:bg-white/10 rounded border shadow-sm select-all">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={copyRecoveryCodes} className="flex-1 text-xs">
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copiedCodes ? "Copied!" : "Copy Codes"}
                </Button>
                <Button type="button" variant="outline" onClick={downloadRecoveryCodes} className="flex-1 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download .txt
                </Button>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" onClick={() => setIsMfaSetupOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  I have safely stored my backup codes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MFA DISABLE MODAL ── */}
      <Dialog open={isMfaDisableOpen} onOpenChange={setIsMfaDisableOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldX className="h-5 w-5" /> Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate MFA? Your account will only be protected by your password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDisableMfa} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm your account password
              </Label>
              <Input 
                type="password" 
                placeholder="••••••••••••" 
                value={disablePassword} 
                onChange={(e) => setDisablePassword(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsMfaDisableOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isMfaLoading || !disablePassword}>
                {isMfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Disable MFA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
