import dynamic from "next/dynamic"
"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, ImageIcon, Terminal, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";

import { useAuth } from "@/hooks/useAuth";
import { updateMe } from "@/lib/users.service";
import { ApiKeysService, ApiKey } from "@/lib/apiKeys.service";
import { ProfileService, FullProfile, UserSession, UserActivity, AuditLog } from "@/lib/profile.service";

import { ProfileHeader } from "@/components/molecules/ProfileHeader";
import { ProfileStatsSidebar } from "@/components/molecules/ProfileStatsSidebar";



const ProfileContentTabs = dynamic(() => import('@/components/organisms/ProfileContentTabs').then(m => m.ProfileContentTabs), { ssr: false })

export default function PlatformOwnerProfilePage() {
  const { data: user, refetch } = useAuth();
  
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const loadFullData = async () => {
    setIsLoading(true);
    try {
      const [pData, sData, aData, logsData, keysData] = await Promise.all([
        ProfileService.getFullProfile(),
        ProfileService.getSessions().catch(() => []),
        ProfileService.getActivity().catch(() => []),
        ProfileService.getAuditLogs().catch(() => []),
        ApiKeysService.getKeys().catch(() => [])
      ]);
      setProfileData(pData); setSessions(sData); setActivities(aData); setAuditLogs(logsData); setApiKeys(keysData);
      setAvatarUrl(pData.user?.avatar_url || "");
      setFormData({
        full_name: pData.user?.full_name || "", phone: pData.profile?.phone || "",
        alternate_email: pData.profile?.alternate_email || "", birth_date: pData.profile?.birth_date || "",
        country: pData.profile?.country || "", state: pData.profile?.state || "", city: pData.profile?.city || "",
        timezone: pData.profile?.timezone || "UTC", language: pData.profile?.language || "en",
        short_bio: pData.profile?.short_bio || "", company_name: pData.profile?.company_name || "",
        job_title: pData.profile?.job_title || "", department: pData.profile?.department || "",
        industry: pData.profile?.industry || "", website: pData.profile?.website || "",
        linkedin_url: pData.profile?.linkedin_url || "", github_url: pData.profile?.github_url || "",
        twitter_url: pData.profile?.twitter_url || "", portfolio_url: pData.profile?.portfolio_url || "",
        experience_years: pData.profile?.experience_years?.toString() || ""
      });
    } catch (err) { toast.error("Failed to load profile"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (user) loadFullData(); }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateMe({ full_name: formData.full_name, avatar_url: avatarUrl || undefined });
      await ProfileService.updateProfile({ ...formData, experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined });
      await refetch();
      toast.success("Profile Updated", { description: "Your executive identity has been secured." });
      setIsAvatarModalOpen(false);
    } catch (err) { toast.error("Failed to save profile"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-100px)]"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  const tabs = [{ id: "overview", label: "Overview" }, { id: "identity", label: "Executive Identity" }, { id: "security", label: "Security & Access" }, { id: "activity", label: "Audit & Activity" }];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Identity Center</h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your executive profile, security policies, and platform access.</p></div>
        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-full px-6">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Configurations
        </Button>
      </div>

      <ProfileHeader user={user} profileData={profileData} avatarUrl={avatarUrl} setIsAvatarModalOpen={setIsAvatarModalOpen} />

      <div className="border-b border-slate-200 dark:border-white/10">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
              {tab.label} {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <ProfileContentTabs 
          activeTab={activeTab} user={user} profileData={profileData} formData={formData} setFormData={setFormData}
          sessions={sessions} activities={activities} auditLogs={auditLogs} apiKeys={apiKeys}
          setIsPasswordModalOpen={setIsPasswordModalOpen} setIsApiKeyModalOpen={setIsApiKeyModalOpen}
          handleTerminateSession={async (id: string) => { if(confirm("Terminate?")) { await ProfileService.terminateSession(id); loadFullData(); } }}
          handleTerminateAllOtherSessions={async () => { if(confirm("Sign out others?")) { await ProfileService.terminateAllOtherSessions(); loadFullData(); } }}
          handleRevokeApiKey={async (id: string) => { if(confirm("Revoke token?")) { await ApiKeysService.revokeKey(id); loadFullData(); } }}
          reloadProfile={() => { refetch(); loadFullData(); }}
        />
        <ProfileStatsSidebar profileData={profileData} setActiveTab={setActiveTab} setIsApiKeyModalOpen={setIsApiKeyModalOpen} />
      </div>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-emerald-600" /> Update Avatar</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><Label>Image URL</Label><Input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAvatarModalOpen(false)}>Cancel</Button><Button onClick={handleSaveProfile} className="bg-emerald-600 hover:bg-emerald-700">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-600" /> Change Password
            </DialogTitle>
            <DialogDescription>
              We will send a secure password reset link to your registered email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Email Address</Label>
            <Input type="email" value={user?.email || ""} disabled className="bg-slate-50 dark:bg-slate-900" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await api.post("/auth/forgot-password", { email: user?.email });
                toast.success("Password reset requested", { description: "Check your email for the secure link." });
                setIsPasswordModalOpen(false);
              } catch (err) {
                toast.error("Failed to request password reset.");
              }
            }} className="bg-emerald-600 hover:bg-emerald-700">Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
