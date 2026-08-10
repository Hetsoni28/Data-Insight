import React, { useState } from "react";
import { Shield, Key, Smartphone, AlertCircle, RefreshCw } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-xl">Password</CardTitle>
          </div>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-md">
            <Label>Current Password</Label>
            <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
          </div>
          <div className="grid gap-2 max-w-md">
            <Label>New Password</Label>
            <Input type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
          </div>
          <div className="grid gap-2 max-w-md">
            <Label>Confirm New Password</Label>
            <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-white/5 pt-4">
          <Button onClick={handlePasswordChange} disabled={pwdLoading || !passwordForm.current || !passwordForm.new} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {pwdLoading ? "Updating..." : "Update Password"}
          </Button>
        </CardFooter>
      </Card>

      {/* MFA Section */}
      <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-xl">Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <CardDescription>
            Add additional security to your account using two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Authenticator App</p>
              <p className="text-sm text-slate-500 mt-1">Use an authenticator app (like Google Authenticator or Authy) to generate security codes.</p>
            </div>
            {user?.mfa_enabled ? (
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setDisableModalOpen(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={startMfaSetup}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup Modal */}
      <Dialog open={mfaModalOpen} onOpenChange={setMfaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the 6-digit code below.
            </DialogDescription>
          </DialogHeader>
          {mfaData && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="p-2 bg-white rounded-xl border">
                <img src={mfaData.qr_code_url} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-slate-500 break-all max-w-[300px] text-center font-mono bg-slate-100 p-2 rounded">
                Secret: {mfaData.secret}
              </p>
              <div className="w-full space-y-2 mt-4">
                <Label className="text-center block">Verification Code</Label>
                <Input 
                  className="text-center text-lg tracking-widest font-mono mx-auto max-w-[200px]" 
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMfaModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmMfaSetup} disabled={mfaCode.length !== 6 || mfaLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {mfaLoading ? "Verifying..." : "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Modal */}
      <Dialog open={disableModalOpen} onOpenChange={setDisableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Please enter your password to confirm you want to disable 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Current Password</Label>
            <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableMfa} disabled={!disablePassword || mfaLoading}>
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
