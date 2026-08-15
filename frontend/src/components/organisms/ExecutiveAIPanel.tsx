"use client";

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Sparkles, Loader2, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/atoms/Logo"
import api from "@/lib/api"
import ReactMarkdown from 'react-markdown'

export function ExecutiveAIPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Hello Executive. I'm connected to the platform's core metrics, audit logs, and analytics. How can I assist you with platform operations today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('toggle-executive-ai', handleOpen)
    return () => window.removeEventListener('toggle-executive-ai', handleOpen)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    try {
      const formData = new FormData()
      formData.append("message", userMsg)
      formData.append("workspace_id", "owner-context") // Dummy ID for validation if required by backend structure
      
      if (sessionId) {
        formData.append("session_id", sessionId)
      }
      
      // Pass previous messages as history (excluding the first mock greeting if desired, but we can pass all)
      const historyToPass = messages.map(m => ({
        role: m.role,
        content: m.text
      }))
      formData.append("history", JSON.stringify(historyToPass))

      const token = localStorage.getItem('access_token') || ''
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/owner/ai/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) throw new Error("Network response was not ok")
      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ""
      let buffer = ""
      
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'ai', text: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() || "" // Keep incomplete part in buffer
        
        for (const part of parts) {
          const line = part.trim()
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6)
            try {
              const data = JSON.parse(dataStr)
              if (data.type === 'session' && !sessionId) {
                setSessionId(data.session_id)
              } else if (data.type === 'chunk') {
                aiMessage += data.chunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1].text = aiMessage
                  return newMessages
                })
              }
            } catch (e) {
              console.error("SSE parse error", e, dataStr)
            }
          }
        }
      }
    } catch (error) {
      console.error("AI chat failed:", error)
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error connecting to the platform services. Please check your network and API configurations." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={`fixed z-[9999] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? (expanded ? 'bottom-6 right-6 w-[800px] max-w-[calc(100vw-18rem)] h-[800px] max-h-[85vh]' : 'bottom-6 right-6 w-[420px] h-[650px] max-h-[85vh]') : 'bottom-6 right-6 w-auto h-14'}`}>
      
      {!isOpen && (
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(16,185,129,0.6)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border-2 border-emerald-400/50 text-white cursor-pointer transition-all"
        >
          <img src="/icon.svg" alt="Data Insight AI" className="h-7 w-auto brightness-0 invert drop-shadow-md" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(5px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <Logo size={20} showText={false} href={null} className="brightness-0 invert drop-shadow-md" />
                </div>
                <div className="flex flex-col justify-center shrink-0">
                  <h3 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight whitespace-nowrap">
                    Executive Copilot
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Context Connected
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => setExpanded(!expanded)} className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all">
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  key={i} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border border-white/20' : 'bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-300/30'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <img src="/icon.svg" className="w-4 h-4 brightness-0 invert drop-shadow-sm" />}
                  </div>
                  <div className={`w-fit max-w-[85%] rounded-2xl p-4 text-[14px] leading-relaxed shadow-sm backdrop-blur-md ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-sm shadow-emerald-500/20 border border-emerald-400/30' : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-tl-sm text-slate-800 dark:text-slate-200'}`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-hr:my-2 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900/50 dark:prose-pre:border dark:prose-pre:border-slate-700/50 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>
                        {isTyping && i === messages.length - 1 && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle rounded-sm"></span>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && messages[messages.length - 1].role === 'user' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-emerald-300/30">
                    <img src="/icon.svg" className="w-4 h-4 brightness-0 invert drop-shadow-sm" />
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Container */}
            <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex gap-2 items-end relative">
                <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all flex items-center px-4 py-1">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Copilot anything..."
                    className="flex-1 bg-transparent border-none py-3 text-[14px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl h-[46px] w-[46px] p-0 flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30">
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </motion.div>
              </div>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar">
                {["Explain my MRR", "Show recent audits", "What features are underused?"].map(prompt => (
                  <button key={prompt} onClick={() => setInput(prompt)} className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 transition-all shadow-sm">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
