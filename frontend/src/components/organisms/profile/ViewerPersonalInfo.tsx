"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Lock, User, Phone, MapPin, Briefcase, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TenantProfileService } from "@/lib/tenant-profile.service";
import type { ViewerProfile } from "@/lib/tenant-profile.service";

interface Props {
  profile: ViewerProfile | null;
  isLoading: boolean;
  onUpdated: (p: ViewerProfile) => void;
}

export function ViewerPersonalInfo({ profile, isLoading, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    job_title: "",
    department: "",
    short_bio: "",
  });
  const [initialized, setInitialized] = useState(false);

  // Initialize from profile once data arrives
  if (profile && !initialized) {
    setForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      location: profile.location || "",
      job_title: profile.job_title || "",
      department: profile.department || "",
      short_bio: profile.short_bio || "",
    });
    setInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await TenantProfileService.updateProfile(form);
      onUpdated(updated);
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "full_name", label: "Full Name", icon: User, placeholder: "Your full name" },
    { key: "phone", label: "Phone Number", icon: Phone, placeholder: "+1 (555) 000-0000" },
    { key: "location", label: "Location", icon: MapPin, placeholder: "City, Country" },
    { key: "job_title", label: "Job Title", icon: Briefcase, placeholder: "Your job title" },
    { key: "department", label: "Department", icon: Building2, placeholder: "Your department" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" /> {label}
            </Label>
            <Input
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        ))}

        {/* Bio - full width */}
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Bio
          </Label>
          <textarea
            value={form.short_bio}
            onChange={(e) => setForm({ ...form, short_bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={3}
            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>

      {/* Organization-managed notice */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        Email and Role are managed by your organization and cannot be changed here.
      </div>
    </motion.div>
  );
}
