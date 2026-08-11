import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  multiline?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  ({ label, description, error, className, multiline, ...props }, ref) => {
    const inputClasses = cn(
      "w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white transition-all duration-200",
      "focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50/50",
      className
    );

    return (
      <div className="space-y-1.5 w-full">
        <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {description && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2">{description}</p>
        )}
        
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={cn(inputClasses, "resize-y min-h-[100px]")}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={inputClasses}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        
        {error && (
          <p className="text-[12px] text-red-500 font-medium mt-1">{error}</p>
        )}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";
