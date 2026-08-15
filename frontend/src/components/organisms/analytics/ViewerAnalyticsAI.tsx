"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, Bot, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsInsight as ViewerAnalyticsInsightType } from "@/lib/viewer-analytics.service";
import { ViewerAnalyticsService } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsAIProps {
  insights: ViewerAnalyticsInsightType[];
  summary: string;
  isLoading: boolean;
}

export function ViewerAnalyticsAI({ insights, summary, isLoading }: ViewerAnalyticsAIProps) {
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
      const res = await ViewerAnalyticsService.chatAi(userMsg, { context: "viewer_analytics_page" });
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
    <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      
      {/* Left side: Proactive Insights */}
      <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Executive Summary</h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed text-sm md:text-base">
          {summary || "No executive summary available for the current context."}
        </p>

        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Discoveries</h4>
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
            >
              <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                insight.type === 'risk' ? 'text-rose-500' :
                insight.type === 'opportunity' ? 'text-emerald-500' :
                'text-emerald-500'
              }`} />
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{insight.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side: Interactive Chat */}
      <div className="w-full md:w-1/2 p-6 flex flex-col h-[500px] md:h-auto">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            Analytics Assistant
          </h4>
          <p className="text-xs text-slate-500">Ask questions about these metrics.</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Bot className="w-10 h-10 mb-3 text-slate-400" />
              <p className="text-sm text-slate-500 max-w-[200px]">Ask me to compare metrics, explain anomalies, or summarize trends.</p>
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isChatting && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm flex items-center gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleAskAI} className="relative">
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask a question about the data..."
            className="pr-12 bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-700 focus-visible:ring-emerald-500"
            disabled={isChatting}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1 h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
            disabled={!chatMessage.trim() || isChatting}
          >
            {isChatting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
