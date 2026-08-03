"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AIService, ChatMessage } from "@/lib/ai.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StateLayout } from "@/components/molecules/StateLayout";
import { AiCopilotIllustration } from "@/components/molecules/AiCopilotIllustration";
import { NoDatasetsIllustration } from "@/components/molecules/NoDatasetsIllustration";

const TypingIndicator = () => (
  <div className="flex items-center space-x-1.5 p-2 px-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-sm h-10 w-fit">
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
    />
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
    />
  </div>
);

interface CopilotChatProps {
  datasetId: string | null;
}

export function CopilotChat({ datasetId }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !datasetId) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await AIService.chat(userMsg.content, datasetId, messages);
      const aiMsg: ChatMessage = { role: "assistant", content: response.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat error", error);
      toast.error("Failed to get AI response.");
    } finally {
      setIsTyping(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <StateLayout
          illustration={<NoDatasetsIllustration />}
          headline="No Dataset Selected"
          description="Upload or select a dataset to start asking questions."
          primaryAction={{
            label: "Upload Dataset",
            icon: <Plus className="w-4 h-4" />,
            onClick: () => { window.location.href = "/dashboard/datasets"; },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-xl overflow-hidden">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-md border-b border-slate-100 dark:border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl text-white shadow-sm ring-1 ring-emerald-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">Data Insight Copilot</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-medium text-emerald-600">Active & Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto scroll-smooth" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full py-10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <StateLayout
                illustration={<AiCopilotIllustration />}
                headline="Ask Anything About Your Data"
                description="I'm ready to analyze your selected dataset. What would you like to know?"
                aiSuggestion="Try asking: 'What is the total revenue over time?'"
                keyboardShortcut="Enter"
              />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className="flex max-w-[85%] items-end gap-3">
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 mb-1 shadow-sm ring-1 ring-emerald-500/20">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "px-5 py-3.5 text-[15px] leading-relaxed shadow-sm",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl rounded-br-sm ring-1 ring-slate-900/5"
                          : "bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm"
                      )}
                    >
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-start items-end gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 mb-1 shadow-sm ring-1 ring-emerald-500/20">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Static Input Area (No absolute positioning to prevent cutoffs) */}
      <div className="p-4 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border-t border-slate-100 dark:border-white/10 shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data... (Press Enter to send)"
            disabled={isTyping}
            className="w-full pl-6 pr-14 py-4 rounded-2xl border-slate-200/60 dark:border-white/10 border bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 ease-out text-[15px] disabled:opacity-50"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            size="icon"
            className="absolute right-2 top-2 bottom-2 h-auto w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
