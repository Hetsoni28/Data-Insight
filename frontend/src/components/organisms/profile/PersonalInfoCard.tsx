import React, { useState } from "react";
import { User, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ProfileService, UserProfile } from "@/lib/profile.service";
import { toast } from "sonner";
import api from "@/lib/api";

interface Props {
  user: any;
  profileData: UserProfile | null;
  onUpdate: () => void;
}

export function PersonalInfoCard({ user, profileData, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.full_name?.split(" ")[0] || "",
    lastName: user?.full_name?.split(" ").slice(1).join(" ") || "",
    phone: profileData?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update User table full name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (fullName && fullName !== user.full_name) {
        await api.patch("/users/me", { full_name: fullName });
      }
      
      // Update Profile table phone
      await ProfileService.updateProfile({ phone: formData.phone });
      
      toast.success("Personal information updated successfully.");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update personal info.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Personal Information</CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Manage your identity details. Some information is managed by your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300 font-medium">First Name</Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} 
                className="pl-10 border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300 font-medium">Last Name</Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} 
                className="pl-10 border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address <span className="text-slate-400 font-normal">(Read-only)</span></Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="email" value={user?.email || ""} readOnly disabled 
                className="pl-10 border-transparent bg-slate-100/80 dark:bg-white/5 text-slate-500 cursor-not-allowed opacity-100" 
              />
              {user?.is_email_verified && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
              )}
            </div>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">Phone Number</Label>
            <div className="relative group">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                id="phone" name="phone" value={formData.phone} onChange={handleChange} 
                className="pl-10 border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all duration-200" 
                placeholder="+1 (555) 000-0000" 
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-6 mt-2 bg-slate-50/30 dark:bg-white/[0.02] rounded-b-xl">
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20 transition-all min-w-[120px]"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
