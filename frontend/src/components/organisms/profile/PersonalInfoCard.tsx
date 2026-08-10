import React, { useState } from "react";
import { User, Phone, Mail, CheckCircle2 } from "lucide-react";
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
    <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Personal Information</CardTitle>
        <CardDescription>
          Manage your identity details. Some information is managed by your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Read-only)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="email" value={user?.email || ""} readOnly disabled className="pl-10 bg-slate-50 dark:bg-white/5 cursor-not-allowed" />
              {user?.is_email_verified && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-10" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-6 mt-2">
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
