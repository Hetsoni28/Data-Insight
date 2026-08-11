import React, { useState } from "react";
import { AlertTriangle, UserX } from "lucide-react";
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
      <Card className="border-red-200/60 dark:border-red-900/30 shadow-sm mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-950/10">
            <div>
              <p className="font-semibold text-red-800 dark:text-red-400">Deactivate Account</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Deactivating your account will immediately log you out of all devices and prevent future logins. 
                This action requires password confirmation.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setOpen(true)}>
              <UserX className="w-4 h-4 mr-2" />
              Deactivate Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Deactivate Account
            </DialogTitle>
            <DialogDescription>
              Are you completely sure you want to deactivate your account? You will lose access immediately. Please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-red-600">Current Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="mt-2 border-red-200 focus-visible:ring-red-500" 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={!password || loading}>
              {loading ? "Deactivating..." : "Yes, deactivate my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
