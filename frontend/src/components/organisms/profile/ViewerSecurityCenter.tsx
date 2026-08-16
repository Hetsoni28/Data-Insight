"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Key, Monitor, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type { ViewerSecurityOverview as SecurityType } from "@/lib/viewer-profile.service";

const DEFAULT_SECURITY: SecurityType = {
  password_last_changed: "Not available",
  mfa_enabled: false,
  active_sessions_count: 0,
  failed_login_attempts: 0,
  last_login: null,
  security_score: 0,
  is_email_verified: false,
};

interface Props {
  security: SecurityType | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ViewerSecurityCenter({ security, isLoading, onRefresh }: Props) {
  const [changingPw, setChangingPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  const sec = security ?? DEFAULT_SECURITY;

  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) return;
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChangingPw(true);
    try {
      const res = await ViewerProfileService.changePassword(pwForm);
      toast.success(res.message);
      setShowPwForm(false);
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      onRefresh();
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setChangingPw(false);
    }
  };

  const scoreColor =
    sec.security_score >= 80
      ? "text-emerald-600"
      : sec.security_score >= 50
      ? "text-amber-600"
      : "text-rose-600";

  const statusItems = [
    { label: "Email Verified", ok: sec.is_email_verified, icon: sec.is_email_verified ? CheckCircle2 : XCircle },
    { label: "MFA Enabled", ok: sec.mfa_enabled, icon: sec.mfa_enabled ? ShieldCheck : ShieldAlert },
    { label: "Active Sessions", value: sec.active_sessions_count, icon: Monitor },
    { label: "Failed Logins", value: sec.failed_login_attempts, icon: Key },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security Center</h2>
        </div>
        <div className={`text-sm font-bold ${scoreColor}`}>
          Security Score: {sec.security_score}/100
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center"
          >
            <item.icon
              className={`w-5 h-5 mx-auto mb-2 ${
                item.ok !== undefined
                  ? item.ok
                    ? "text-emerald-500"
                    : "text-rose-500"
                  : "text-slate-500"
              }`}
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
            {item.ok !== undefined ? (
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] ${item.ok ? "text-emerald-600 border-emerald-200" : "text-rose-600 border-rose-200"}`}
              >
                {item.ok ? "Enabled" : "Disabled"}
              </Badge>
            ) : (
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{item.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Password Change */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">Last changed: {sec.password_last_changed}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPwForm(!showPwForm)}>
            <Key className="w-3.5 h-3.5 mr-2" /> Change Password
          </Button>
        </div>

        {showPwForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={pwForm.current_password}
                  onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                  className="pr-10 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className="pr-10 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm New Password</Label>
              <Input
                type="password"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                className="bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleChangePassword}
                disabled={changingPw}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {changingPw ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {changingPw ? "Updating..." : "Update Password"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowPwForm(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
