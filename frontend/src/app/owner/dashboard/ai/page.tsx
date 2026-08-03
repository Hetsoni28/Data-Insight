"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Sparkles, Plus, Settings, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { CommandCenterQuickActions } from "@/components/organisms/CommandCenterQuickActions"
import { CommandCenterChat } from "@/components/organisms/CommandCenterChat"

export default function AICommandCenterPage() {
  const { data: user } = useAuth()
  const [chatStarted, setChatStarted] = useState(false)
  const [selectedActionTitle, setSelectedActionTitle] = useState<string | undefined>()
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<any[]>([])

  // Fetch sessions when returning to landing page
  useEffect(() => {
    if (!chatStarted) {
      api.get("/owner/ai/chat/sessions").then(res => setSessions(res.data)).catch(console.error)
    }
  }, [chatStarted])

  const handleStartAction = (actionId: string, title: string) => {
    setSelectedActionTitle(title)
    setChatStarted(true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] relative bg-slate-50/50 dark:bg-[#020617]">
      
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Data Insight AI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Google Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setChatStarted(false)
              setSelectedSessionId(undefined)
              setSelectedActionTitle(undefined)
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> New Chat
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden scroll-smooth">
        <AnimatePresence mode="wait">
          {!chatStarted ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl mt-12 mx-auto flex flex-col items-center px-4 pb-24"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-8">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                Welcome back, {user?.full_name?.split(" ")[0] || "Owner"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
                What would you like Data Insight AI to help you with today? Manage your SaaS, analyze data, or generate reports.
              </p>

              <CommandCenterQuickActions onSelectAction={handleStartAction} />

              {sessions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="w-full max-w-3xl mt-12 flex flex-col items-start"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Chats</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {sessions.map(session => (
                      <button 
                        key={session.id}
                        onClick={() => {
                          setSelectedActionTitle(undefined)
                          setSelectedSessionId(session.id)
                          setChatStarted(true)
                        }}
                        className="flex items-center gap-3 p-3 text-left bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-emerald-500/50 hover:shadow-sm transition-all w-full"
                      >
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/20 text-slate-500 shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{session.title}</h4>
                          <p className="text-xs text-slate-500">{new Date(session.updated_at).toLocaleDateString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full flex flex-col"
            >
              <CommandCenterChat initialActionTitle={selectedActionTitle} initialSessionId={selectedSessionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
