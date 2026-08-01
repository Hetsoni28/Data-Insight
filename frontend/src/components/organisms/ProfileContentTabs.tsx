import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  User, ShieldAlert, KeyRound, Save, Loader2, Image as ImageIcon, Smartphone, 
  Mail, BellRing, Code, Globe, CheckCircle2, ShieldCheck, QrCode, Terminal, 
  Trash2, Plus, Copy, Building2, MapPin, Briefcase, Clock, Calendar, Laptop2,
  AlertTriangle, History, Activity, Database, Server, Fingerprint, Lock, Eye, EyeOff
} from "lucide-react";
import { SettingCard } from "@/components/molecules/SettingCard";
import { FormInput } from "@/components/molecules/FormInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  setIsApiKeyModalOpen, handleRevokeApiKey 
}: any) {
  return (
    <div className="lg:col-span-3 min-h-[500px]">
      <AnimatePresence mode="wait">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div key="overview" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            
            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "AI Requests", value: profileData?.stats.ai_requests.toLocaleString() || "0", icon: Terminal, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Reports Generated", value: profileData?.stats.reports_generated.toLocaleString() || "0", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "API Calls", value: profileData?.stats.api_calls.toLocaleString() || "0", icon: Code, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Storage (MB)", value: profileData?.stats.storage_used_mb.toLocaleString() || "0", icon: Server, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((stat, i) => (
                <motion.div variants={itemVariants} key={i} className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all cursor-default">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PROFILE SUMMARY */}
            <motion.div variants={itemVariants}>
              <SettingCard title="Executive Summary" description="Overview of your identity on the platform." icon={Briefcase}>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Company</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.company_name || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Role / Position</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.job_title || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Department</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.department || "-"}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Timezone</p><p className="text-sm font-medium text-slate-900 dark:text-white">{profileData?.profile?.timezone}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Account Created</p><p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(user?.created_at || "").toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-1">Verification Status</p><p className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fully Verified</p></div>
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
              <SettingCard title="Authentication & MFA" description="Secure your platform access." icon={Lock}>
                <div className="mt-4 space-y-4">
                    <Button onClick={() => setIsPasswordModalOpen(true)} variant="outline" className="w-full justify-start h-14 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10">
                    <KeyRound className="w-5 h-5 mr-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Update your account credentials</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400">Last changed: 3 months ago</span>
                  </Button>
                  <div className="w-full justify-start h-14 border border-emerald-200 bg-emerald-50 rounded-md flex items-center px-4">
                    <Fingerprint className="w-5 h-5 mr-4 text-emerald-600" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-emerald-900">Two-Factor Authentication is Active</p>
                      <p className="text-xs text-emerald-700">Protected via Authenticator App</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 text-emerald-700 hover:bg-emerald-200/50">Manage</Button>
                  </div>
                </div>
              </SettingCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SettingCard title="Active Sessions" description="Manage devices currently logged into your account." icon={Laptop2}>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sign out everywhere</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1 max-w-[300px]">If you notice suspicious activity, terminate all active sessions immediately.</p>
                    </div>
                    <Button variant="destructive" onClick={handleTerminateAllOtherSessions}>Terminate All Other Sessions</Button>
                  </div>

                  {sessions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-center py-4">No active sessions found.</p>}
                  
                  {sessions.map((session: any) => (
                    <div key={session.id} className={`flex items-start justify-between p-4 border rounded-xl transition-opacity ${!session.is_active ? 'opacity-50 bg-slate-100 dark:bg-white/10' : 'bg-white dark:bg-white/5'}`}>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                          {session.os?.toLowerCase().includes("mac") ? <Laptop2 className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {session.os || "Unknown OS"} • {session.browser || "Unknown Browser"}
                            {session.is_current && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Current Device</span>}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">{session.location || "Unknown Location"} • {session.ip_address}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">Started: {new Date(session.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {session.is_active && !session.is_current && (
                        <Button variant="ghost" size="sm" onClick={() => handleTerminateSession(session.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">Revoke</Button>
                      )}
                    </div>
                  ))}
                </div>
              </SettingCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SettingCard title="API Keys & Developer Access" description="Manage personal access tokens for API integrations." icon={Terminal}>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-xl mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Access Tokens</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1 max-w-[400px]">Tokens you have generated that can be used to access the Data Insight API.</p>
                    </div>
                    <Button onClick={() => setIsApiKeyModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Generate new token
                    </Button>
                  </div>

                  {apiKeys.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-center py-4">No API keys generated yet.</p>
                  ) : (
                    <div className="border rounded-xl divide-y overflow-hidden">
                      {apiKeys.map((key: any) => (
                        <div key={key.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {key.name}
                              {key.is_active ? <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span> : <span className="w-2 h-2 rounded-full bg-red-500" title="Revoked"></span>}
                            </h5>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">{key.prefix}••••••••••••••••••••••••••••••••</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">Created on {new Date(key.created_at).toLocaleDateString()}</p>
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

        {/* ACTIVITY TAB */}
        {activeTab === "activity" && (
          <motion.div key="activity" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <motion.div variants={itemVariants}>
              <SettingCard title="Audit Log" description="Security and access history for your account." icon={History}>
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-white/5 grid grid-cols-12 gap-4 p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <div className="col-span-3">Action</div>
                    <div className="col-span-3">Entity</div>
                    <div className="col-span-3">IP Address</div>
                    <div className="col-span-3">Timestamp</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">No audit logs available.</div>
                    ) : (
                      auditLogs.map((log: any) => (
                        <div key={log.id} className="grid grid-cols-12 gap-4 p-3 text-sm items-center hover:bg-slate-50 dark:hover:bg-white/5">
                          <div className="col-span-3 font-medium text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-mono text-xs truncate" title={log.resource_id}>{log.resource_type}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-mono text-xs">{log.ip_address || "Unknown"}</div>
                          <div className="col-span-3 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </SettingCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SettingCard title="Recent Activity" description="Platform events and usage timeline." icon={Activity}>
                <div className="mt-6 space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {activities.length === 0 ? (
                     <div className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 py-8 relative z-10">No recent activity.</div>
                  ) : (
                    activities.map((act: any) => (
                      <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm capitalize">{act.action}</span>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs mt-1">Module: <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-1 rounded">{act.module}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SettingCard>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
