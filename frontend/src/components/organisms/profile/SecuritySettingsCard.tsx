import React, { useState } from "react";
import { Shield, Key, Smartphone, AlertCircle, RefreshCw, Copy, Check, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { setupMFA, enableMFA, disableMFA } from "@/lib/auth.service";
import api from "@/lib/api";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  user: any;
  onUpdate: () => void;
}

export function SecuritySettingsCard({ user, onUpdate }: Props) {
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaData, setMfaData] = useState<any>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/users/me/change-password", {
        current_password: passwordForm.current,
        new_password: passwordForm.new
      });
      toast.success("Password changed successfully.");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const startMfaSetup = async () => {
    try {
      const data = await setupMFA();
      setMfaData(data);
      setMfaModalOpen(true);
    } catch (error: any) {
      toast.error("Failed to initiate MFA setup.");
    }
  };

  const confirmMfaSetup = async () => {
    setMfaLoading(true);
    try {
      await enableMFA(mfaCode);
      toast.success("Two-factor authentication enabled successfully!");
      setMfaModalOpen(false);
      setMfaData(null);
      setMfaCode("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Invalid code.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    setMfaLoading(true);
    try {
      await disableMFA(disablePassword);
      toast.success("Two-factor authentication disabled.");
      setDisableModalOpen(false);
      setDisablePassword("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Incorrect password.");
    } finally {
      setMfaLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (mfaData?.secret) {
      navigator.clipboard.writeText(mfaData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret key copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Password</CardTitle>
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2.5 max-w-md">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Current Password</Label>
            <Input 
              type="password" 
              value={passwordForm.current} 
              onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} 
              className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
            />
          </div>
          <div className="grid gap-2.5 max-w-md">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">New Password</Label>
            <Input 
              type="password" 
              value={passwordForm.new} 
              onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} 
              className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
            />
          </div>
          <div className="grid gap-2.5 max-w-md">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Confirm New Password</Label>
            <Input 
              type="password" 
              value={passwordForm.confirm} 
              onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} 
              className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
            />
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-white/5 pt-6 mt-2 bg-slate-50/30 dark:bg-white/[0.02] rounded-b-xl">
          <Button 
            onClick={handlePasswordChange} 
            disabled={pwdLoading || !passwordForm.current || !passwordForm.new} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20 transition-all min-w-[150px]"
          >
            {pwdLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
          </Button>
        </CardFooter>
      </Card>

      {/* MFA Section */}
      <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Add additional security to your account using two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shadow-sm group hover:border-emerald-500/30 transition-colors">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-white">Authenticator App</p>
                {user?.mfa_enabled && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">Use an authenticator app (like Google Authenticator or Authy) to generate security codes.</p>
            </div>
            {user?.mfa_enabled ? (
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors" onClick={() => setDisableModalOpen(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20 transition-all" onClick={startMfaSetup}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup Modal */}
      <Dialog open={mfaModalOpen} onOpenChange={setMfaModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-slate-200/80 dark:border-white/10 shadow-2xl rounded-2xl bg-white dark:bg-slate-900">
          <div className="bg-emerald-600 dark:bg-emerald-900/40 p-6 flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Secure Your Account</DialogTitle>
              <DialogDescription className="text-emerald-100 dark:text-emerald-200 mt-1">
                Two-Factor Authentication Setup
              </DialogDescription>
            </div>
          </div>
          
          <div className="px-6 py-8">
            {mfaData && (
              <div className="flex flex-col items-center space-y-8">
                {/* Step 1: Scan */}
                <div className="w-full text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Scan QR Code</h3>
                  </div>
                  
                  <div className="relative group mx-auto inline-block">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <img src={mfaData.qr_code_base64} alt="QR Code" className="w-40 h-40" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Can't scan the QR code? Use this secret key instead:</p>
                    <button 
                      onClick={copyToClipboard}
                      className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <span className="font-mono text-sm tracking-wider text-slate-700 dark:text-slate-300 font-medium">{mfaData.secret}</span>
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />}
                    </button>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-white/5"></div>

                {/* Step 2: Verify */}
                <div className="w-full text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Enter Verification Code</h3>
                  </div>
                  
                  <div className="relative max-w-[280px] mx-auto mt-2">
                    <Input 
                      className="text-center text-3xl tracking-[0.5em] font-mono py-6 h-16 border-2 border-slate-200 dark:border-slate-700 focus-visible:ring-0 focus-visible:border-emerald-500 bg-slate-50 dark:bg-slate-900 transition-all rounded-xl placeholder:text-slate-300 dark:placeholder:text-slate-700" 
                      maxLength={6}
                      placeholder="••••••"
                      value={mfaCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMfaCode(val);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setMfaModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</Button>
            <Button 
              onClick={confirmMfaSetup} 
              disabled={mfaCode.length !== 6 || mfaLoading} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] h-10 shadow-md hover:shadow-lg transition-all"
            >
              {mfaLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Enable 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Modal */}
      <Dialog open={disableModalOpen} onOpenChange={setDisableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Please enter your password to confirm you want to disable 2FA. <br/><span className="text-red-500 font-medium">This will make your account significantly less secure.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="font-medium text-slate-700 dark:text-slate-300">Current Password</Label>
            <Input 
              type="password" 
              value={disablePassword} 
              onChange={(e) => setDisablePassword(e.target.value)} 
              className="border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-red-500/30 focus-visible:border-red-500 transition-all duration-200"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableMfa} disabled={!disablePassword || mfaLoading} className="shadow-sm hover:shadow-red-600/20 transition-all min-w-[120px]">
              {mfaLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Disabling...</> : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
