"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, ChevronDown,
  User, BarChart2, FileText, AlertTriangle, TrendingUp, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewerService } from "@/lib/viewer.service";
import type { ViewerDataset } from "@/lib/viewer.service";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/atoms/Logo";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: Date;
}

const PRESET_PROMPTS = [
  { icon: <FileText className="w-4 h-4" />, label: "Summarize this report" },
  { icon: <BarChart2 className="w-4 h-4" />, label: "Explain the key KPIs" },
  { icon: <AlertTriangle className="w-4 h-4" />, label: "Find anomalies in the data" },
  { icon: <TrendingUp className="w-4 h-4" />, label: "Compare this month vs last month" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Generate executive summary" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Give business recommendations" },
];

interface ViewerAiAssistantProps {
  datasets: ViewerDataset[];
  isLoading: boolean;
}

export function ViewerAiAssistant({ datasets, isLoading }: ViewerAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-select first ready dataset
  useEffect(() => {
    const ready = datasets.find((d) => d.status === "ready");
    if (ready && !selectedDatasetId) {
      setSelectedDatasetId(ready.id);
    }
  }, [datasets, selectedDatasetId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await ViewerService.chat({
        question: question.trim(),
        dataset_id: selectedDatasetId || undefined,
        history,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        model: res.model,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I encountered an error processing your request. Please check that datasets are available and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const readyDatasets = datasets.filter((d) => d.status === "ready");

  return (
    <div className="space-y-5" id="ai-assistant">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Logo size={22} showText={false} href={null} />
          AI Business Assistant
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Ask questions about your reports and datasets in plain English
        </p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/5">
        {/* Dataset Selector */}
        {readyDatasets.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">Context:</span>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none flex-1 min-w-0 cursor-pointer"
            >
              <option value="">No dataset (general questions)</option>
              {readyDatasets.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Preset Prompts */}
        {messages.length === 0 && (
          <div className="p-5 border-b border-slate-100 dark:border-white/10">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wide">Quick prompts</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.label)}
                  disabled={isSending}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-lg transition-all text-left hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-40"
                >
                  <span className="text-emerald-500 flex-shrink-0">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-72 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 ring-2 ring-emerald-50 dark:ring-emerald-950">
                    <Logo size={16} showText={false} href={null} whiteMode className="brightness-0 invert drop-shadow-sm" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] text-sm rounded-xl px-4 py-3 leading-relaxed",
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-slate-50 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-white/10 rounded-tl-none"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert prose-emerald max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.model && (
                    <p className="text-[10px] opacity-50 mt-1.5 text-right">via {msg.model}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-white/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-200" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isSending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 ring-2 ring-emerald-50 dark:ring-emerald-950">
                <Logo size={16} showText={false} href={null} whiteMode className="brightness-0 invert drop-shadow-sm" />
              </div>
              <div className="bg-slate-50 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data... (Enter to send, Shift+Enter for new line)"
            className="flex-grow text-sm min-h-[40px] max-h-32 resize-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isSending}
            className="h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-500 text-white flex-shrink-0 shadow-sm shadow-emerald-500/20"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
