import { motion, AnimatePresence } from "framer-motion"
import { UserCard } from "./UserCard"
import { EmptyState } from "./EmptyState"
import type { User } from "@/types"

interface UsersListProps {
  users: User[]
  type: "pending" | "active"
  searchQuery: string
  processingIds: string[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRevoke?: (id: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

export function UsersList({ 
  users, 
  type, 
  searchQuery, 
  processingIds,
  onApprove, 
  onReject,
  onRevoke 
}: UsersListProps) {
  
  const safeUsers = Array.isArray(users) ? users : []
  const filteredUsers = safeUsers.filter(u => {
    const q = (searchQuery || "").toLowerCase()
    return (u?.full_name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q))
  })

  if (filteredUsers.length === 0) {
    if (searchQuery) {
      return (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200 dark:border-white/10 border-dashed">
          No users match your search &quot;{searchQuery}&quot;
        </div>
      )
    }
    return <EmptyState type={type} />
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      <AnimatePresence mode="popLayout">
        {filteredUsers.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            type={type}
            isProcessing={processingIds.includes(u.id)}
            onApprove={onApprove}
            onReject={onReject}
            onRevoke={onRevoke}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
