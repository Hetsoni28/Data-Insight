import React, { useState } from "react";
import { AlertTriangle, UserX, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deactivateAccount } from "@/lib/auth.service";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function DangerZoneCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await deactivateAccount(password);
      toast.success("Account deactivated.");
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Incorrect password or action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-red-200/50 dark:border-red-900/30 shadow-sm mt-8 hover:border-red-300 dark:hover:border-red-800/50 transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden relative group">
        <div className="absolute inset-0 bg-red-50/50 dark:bg-red-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 animate-pulse" />
            <CardTitle className="text-xl font-semibold tracking-tight text-red-600 dark:text-red-500">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-600/70 dark:text-red-400/70 font-medium">
            Irreversible and destructive actions for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 pt-2 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 shadow-inner">
            <div className="mb-4 sm:mb-0">
              <p className="font-bold text-red-800 dark:text-red-400 text-lg">Deactivate Account</p>
              <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1.5 max-w-lg leading-relaxed font-medium">
                Deactivating your account will immediately log you out of all devices and prevent future logins. 
                <span className="block mt-1 font-semibold text-red-900 dark:text-red-300">This action requires password confirmation.</span>
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-red-600/20 transition-all font-semibold px-6"
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md border-red-200/80 dark:border-red-900/50 shadow-2xl shadow-red-900/10 dark:shadow-red-900/20">
          <DialogHeader className="pt-2">
            <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              Deactivate Account
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300 mt-4 text-base font-medium leading-relaxed">
              Are you completely sure you want to deactivate your account? <br/>
              <span className="text-red-600 dark:text-red-400 font-bold mt-2 block">You will lose access immediately.</span>
              Please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 mt-2">
            <Label className="text-slate-900 dark:text-slate-200 font-semibold">Current Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="mt-2 border-red-200/80 dark:border-red-900/50 focus-visible:ring-red-500/30 focus-visible:border-red-500 bg-red-50/30 dark:bg-red-950/10 transition-all duration-200" 
              placeholder="Enter your password to confirm"
            />
          </div>
          <DialogFooter className="mt-4 sm:space-x-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Cancel, keep my account</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeactivate} 
              disabled={!password || loading}
              className="bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-red-600/20 transition-all font-semibold mt-2 sm:mt-0"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deactivating...</> : "Yes, deactivate my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
