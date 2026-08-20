"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsInsight as ViewerAnalyticsInsightType } from "@/lib/analytics.service";
import { AnalyticsService } from "@/lib/analytics.service";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface ViewerAnalyticsAIProps {
  insights: ViewerAnalyticsInsightType[];
  summary: string;
  isLoading: boolean;
}

export function ViewerAnalyticsAI({ insights, summary, isLoading }: ViewerAnalyticsAIProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const [chatMessage, setChatMessage] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string}[]>([]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatting) return;

    const userMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const workspaceId = currentWorkspace?.id || "";
      const res = await AnalyticsService.chatAi(workspaceId, userMsg, { context: "viewer_analytics_page" });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "I'm sorry, I couldn't process that request right now." }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full rounded-xl" />;
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg flex flex-col md:flex-row relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Left side: Proactive Insights */}
      <div className="w-full md:w-1/2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/10 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Executive Summary</h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium">
          {summary || "No executive summary available for the current context."}
        </p>

        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Key Discoveries</h4>
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                insight.type === 'risk' ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' :
                insight.type === 'opportunity' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'
              }`}>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300 leading-snug">{insight.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side: Interactive Chat */}
      <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col h-[600px] md:h-auto bg-slate-50/50 dark:bg-slate-950/20 relative z-10">
        <div className="mb-6">
          <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Analytics Assistant
          </h4>
          <p className="text-sm font-medium text-slate-500 mt-1">Ask questions about these metrics in natural language.</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 mb-6 pr-4 custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-white/5">
                <svg viewBox="0 0 170 130" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="ai-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="ai-g2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#047857" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <path d="M 20 100 V 0 H 50 C 83 0 110 22 110 50 C 110 78 83 100 50 100 H 20 Z" stroke="url(#ai-g1)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="140" y1="0" x2="140" y2="100" stroke="url(#ai-g2)" strokeWidth="18" strokeLinecap="round"/>
                  <path d="M 45 65 L 70 40 L 90 55 L 140 10" stroke="#10b981" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"/>
                  <circle cx="140" cy="10" r="6" fill="#059669"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500 max-w-[250px]">Ask me to compare metrics, explain anomalies, or summarize trends.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-100 dark:border-white/5'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : (
                      <svg viewBox="0 0 170 130" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M 20 100 V 0 H 50 C 83 0 110 22 110 50 C 110 78 83 100 50 100 H 20 Z" stroke="#10b981" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="140" y1="0" x2="140" y2="100" stroke="#059669" strokeWidth="18" strokeLinecap="round"/>
                        <path d="M 45 65 L 70 40 L 90 55 L 140 10" stroke="#34d399" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="140" cy="10" r="6" fill="#059669"/>
                      </svg>
                    )}
                  </div>
                  <div className={`p-4 max-w-[80%] text-[15px] font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-emerald-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isChatting && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 170 130" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M 20 100 V 0 H 50 C 83 0 110 22 110 50 C 110 78 83 100 50 100 H 20 Z" stroke="#10b981" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="140" y1="0" x2="140" y2="100" stroke="#059669" strokeWidth="18" strokeLinecap="round"/>
                  <path d="M 45 65 L 70 40 L 90 55 L 140 10" stroke="#34d399" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="140" cy="10" r="6" fill="#059669"/>
                </svg>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleAskAI} className="relative mt-auto">
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask a question about the data..."
            className="pr-14 pl-5 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500 shadow-sm font-medium"
            disabled={isChatting}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 top-2 h-10 w-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
            disabled={!chatMessage.trim() || isChatting}
          >
            {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
