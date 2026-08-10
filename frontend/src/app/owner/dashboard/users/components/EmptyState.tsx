import { motion } from "framer-motion"
import { ShieldCheck, Users } from "lucide-react"

interface EmptyStateProps {
  type: "pending" | "active"
}

export function EmptyState({ type }: EmptyStateProps) {
  const isPending = type === "pending"
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm"
    >
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-gradient-to-tr from-teal-50 to-emerald-50 rounded-full blur-xl opacity-70" />
        <div className="relative w-20 h-20 bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 rounded-full flex items-center justify-center">
          {isPending ? (
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
          ) : (
            <Users className="h-10 w-10 text-teal-600 dark:text-teal-400" />
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
        {isPending ? "All caught up!" : "No active users yet"}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 text-sm leading-relaxed">
        {isPending 
          ? "There are no pending access requests to review at this time. When a new user requests access, they will appear here." 
          : "There are no approved users in the workspace yet. Approve pending requests to add users to your workspace."}
      </p>
    </motion.div>
  )
}
