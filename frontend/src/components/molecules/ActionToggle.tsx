import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionToggleProps {
  initialState?: boolean;
  onToggle: (newState: boolean) => Promise<void> | void;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export function ActionToggle({ 
  initialState = false, 
  onToggle, 
  activeLabel = "Active", 
  inactiveLabel = "Disabled",
  className
}: ActionToggleProps) {
  const [isActive, setIsActive] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const nextState = !isActive;
      await onToggle(nextState);
      setIsActive(nextState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn(
        "text-sm font-medium transition-colors duration-300",
        isActive ? "text-emerald-600" : "text-slate-400"
      )}>
        {isActive ? activeLabel : inactiveLabel}
      </span>
      
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isActive ? "bg-emerald-500" : "bg-slate-200"
        )}
      >
        <motion.span
          layout
          initial={false}
          animate={{
            x: isActive ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow ring-0"
          )}
        >
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />}
        </motion.span>
      </button>
    </div>
  );
}
