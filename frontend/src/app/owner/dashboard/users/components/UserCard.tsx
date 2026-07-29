import { motion } from "framer-motion"
import { Check, X, Clock, ShieldAlert, ShieldCheck, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

interface UserCardProps {
  user: User
  type: "pending" | "active"
  isProcessing?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRevoke?: (id: string) => void
}

export function UserCard({ user, type, isProcessing = false, onApprove, onReject, onRevoke }: UserCardProps) {
  const isPending = type === "pending"
  
  // Format date elegantly
  const dateObj = new Date(user.created_at)
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // Avatar generation
  const initial = user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
  
  // Determine gradient based on role
  const gradientClass = user.role === "manager" 
    ? "bg-gradient-to-br from-indigo-500 to-purple-600" 
    : user.role === "org_admin"
    ? "bg-gradient-to-br from-amber-500 to-orange-600"
    : "bg-gradient-to-br from-emerald-500 to-teal-600"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-300 relative overflow-hidden"
    >
      {/* Subtle background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start gap-4 z-10 w-full sm:w-auto">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm shadow-black/5 ${gradientClass}`}>
          <span className="font-semibold text-lg">{initial}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">
            {user.full_name || "Anonymous User"}
          </h4>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {user.email}
            </span>
            
            <span className="hidden sm:inline w-1 h-1 bg-slate-300 rounded-full" />
            
            <span className={`flex items-center gap-1 capitalize px-2 py-0.5 rounded-md text-xs font-medium border
              ${user.role === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                user.role === 'org_admin' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                'bg-emerald-50 text-emerald-700 border-emerald-100'}`}
            >
              {user.role === 'manager' && <ShieldCheck className="h-3 w-3" />}
              {user.role}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-mono">
            <Clock className="h-3 w-3" />
            {isPending ? "Requested" : "Joined"} on {formattedDate} at {formattedTime}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-end z-10 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
        {isPending ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 w-full sm:w-auto"
              onClick={() => onReject?.(user.id)}
            >
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 w-full sm:w-auto"
              onClick={() => onApprove?.(user.id)}
            >
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isProcessing}
            className="text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors w-full sm:w-auto"
            onClick={() => onRevoke?.(user.id)}
          >
            <AlertTriangle className="h-4 w-4 mr-1 opacity-70 group-hover:opacity-100" /> Revoke Access
          </Button>
        )}
      </div>
    </motion.div>
  )
}
