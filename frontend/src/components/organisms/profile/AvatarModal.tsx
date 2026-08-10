import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { ProfileService } from "@/lib/profile.service";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string;
  onUpdate: () => void;
}

export function AvatarModal({ open, onOpenChange, currentAvatarUrl, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setLoading(true);
    try {
      await ProfileService.uploadAvatar(file);
      toast.success("Profile photo updated successfully.");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await ProfileService.removeAvatar();
      toast.success("Profile photo removed.");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogDescription>
            Choose a new photo or remove the current one.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-slate-950 shadow-md flex items-center justify-center">
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
            <Button 
              disabled={loading} 
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
            {currentAvatarUrl && (
              <Button 
                variant="outline" 
                disabled={loading} 
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
