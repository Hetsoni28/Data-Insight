"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DatasetService } from "@/lib/dataset.service";
import { cn } from "@/lib/utils";

interface DatasetUploaderProps {
  workspaceId: string;
  onUploadComplete?: () => void;
}

export function DatasetUploader({ workspaceId, onUploadComplete }: DatasetUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("File is larger than 100MB limit.");
      } else if (error?.code === "file-invalid-type") {
        toast.error("Invalid file type. Only CSV, JSON, and XLSX are supported.");
      } else {
        toast.error(error?.message || "File rejected.");
      }
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      await DatasetService.upload(
        workspaceId,
        file,
        undefined,
        undefined,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        }
      );

      toast.success("Dataset uploaded successfully!");
      setFile(null);
      setProgress(0);
      onUploadComplete?.();
    } catch (error) {
      // Error is handled by global interceptor, but we catch it to reset UI
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>
          Drag and drop your raw data here. Supported formats: CSV, XLSX, JSON (Max 100MB).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="rounded-full bg-primary/10 p-3 mb-4 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragActive ? "Drop the file here" : "Click or drag file to upload"}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Our AI engine will automatically clean and profile your dataset upon upload.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <File className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Start Upload"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
