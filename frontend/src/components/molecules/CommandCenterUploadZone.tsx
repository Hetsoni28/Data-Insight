"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, FileImage, FileText, X, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandCenterUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

export function CommandCenterUploadZone({ onFileSelect, selectedFile, onClearFile }: CommandCenterUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    if (type.startsWith("image/")) return <FileImage className="h-6 w-6 text-indigo-500" />;
    if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    }
    if (name.endsWith(".json")) return <FileCode className="h-6 w-6 text-amber-500" />;
    return <FileText className="h-6 w-6 text-sky-500" />;
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full shrink-0 px-6 py-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg,.pdf,.json"
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
            className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center ${
              isDragActive
                ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5 scale-[0.99]"
                : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/[0.01]"
            }`}
          >
            <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1.5 animate-pulse" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Drag & drop a file here, or click to upload
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Supports CSV, Excel, PDF, Images, JSON (max 10MB)
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                {getFileIcon(selectedFile)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
