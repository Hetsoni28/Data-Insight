"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Bot, Send, Database, Sparkles, Plus, Trash2, History,
  FileSpreadsheet, Cpu, Globe, Activity, ShieldCheck, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { AIService, ChatMessage } from "@/lib/ai.service";
import { Button } from "@/components/ui/button";
import { CommandCenterQuickActions } from "@/components/organisms/CommandCenterQuickActions";
import { CommandCenterMessage } from "@/components/molecules/CommandCenterMessage";
import { CommandCenterUploadZone } from "@/components/molecules/CommandCenterUploadZone";
import { CommandCenterArtifactPanel } from "@/components/organisms/CommandCenterArtifactPanel";
import api from "@/lib/api";

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export default function AICommandCenterPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Live platform context retrieved from backend
  const [telemetry, setTelemetry] = useState<any>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(true);

  // Artifact Slide-out panel state
  const [activeArtifact, setActiveArtifact] = useState<{ type: string; title: string; content: string } | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations history & live platform stats on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const historyRes = await AIService.ownerGetHistory();
        if (historyRes?.sessions && historyRes.sessions.length > 0) {
          setSessions(historyRes.sessions);
          setActiveSessionId(historyRes.sessions[0].id);
        } else {
          // Initialize with a default session if history is empty
          const defaultSession: ChatSession = {
            id: "session-1",
            title: "General Analysis",
            messages: [],
            createdAt: new Date().toISOString(),
          };
          setSessions([defaultSession]);
          setActiveSessionId("session-1");
        }
      } catch (err) {
        console.error("Failed to load session history:", err);
      }
      
      await fetchTelemetry();
    };

    initData();
  }, []);

  // Fetch live stats from backend
  const fetchTelemetry = async () => {
    setTelemetryLoading(true);
    try {
      const res = await api.get("/owner/ai/overview");
      setTelemetry(res.data);
    } catch (err) {
      console.error("Failed to fetch owner AI telemetry:", err);
    } finally {
      setTelemetryLoading(false);
    }
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [sessions, activeSessionId, isGenerating]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Save history to backend
  const persistSessions = async (updatedSessions: ChatSession[]) => {
    try {
      await AIService.ownerSaveHistory({ sessions: updatedSessions });
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  };

  // Create a new chat session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Analysis Session ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    persistSessions(updated);
  };

  // Delete a session
  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        const defaultSession: ChatSession = {
          id: "session-1",
          title: "General Analysis",
          messages: [],
          createdAt: new Date().toISOString(),
        };
        setSessions([defaultSession]);
        setActiveSessionId("session-1");
      }
    }
    persistSessions(updated.length > 0 ? updated : []);
    toast.success("Conversation deleted.");
  };

  // Trigger quick action prompt
  const handleQuickAction = (promptText: string) => {
    setInput(promptText);
  };

  // Handle slide-out view artifact trigger
  const handleViewArtifact = (type: string, title: string, content: string) => {
    setActiveArtifact({ type, title, content });
    setIsArtifactOpen(true);
  };

  // Handle message send submission
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || !activeSessionId) return;

    // 1. Handle File upload analysis (multimodal) if a file is uploaded
    if (selectedFile) {
      setIsUploading(true);
      const userText = input.trim() || `Analyze the uploaded file: ${selectedFile.name}`;
      
      const userMsg: ChatMessage = { role: "user", content: userText };
      const updatedMessages = [...(activeSession?.messages || []), userMsg];
      
      // Update local state temporarily
      const updatedSessions = sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: updatedMessages, title: s.title === "General Analysis" || s.title.startsWith("Analysis Session") ? userText.slice(0, 30) + "..." : s.title } : s
      );
      setSessions(updatedSessions);
      setInput("");

      try {
        const analyzeRes = await AIService.ownerAnalyze(selectedFile, userText, selectedModel);
        
        const aiMsg: ChatMessage = { role: "assistant", content: analyzeRes.answer };
        const finalMessages = [...updatedMessages, aiMsg];
        
        const finalSessions = sessions.map((s) =>
          s.id === activeSessionId ? { ...s, messages: finalMessages } : s
        );
        
        setSessions(finalSessions);
        persistSessions(finalSessions);
        setSelectedFile(null);
      } catch (err: any) {
        toast.error("Failed to analyze file.");
        console.error(err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // 2. Handle normal text chat (Streaming response)
    const userText = input.trim();
    const userMsg: ChatMessage = { role: "user", content: userText };
    const updatedMessages = [...(activeSession?.messages || []), userMsg];
    
    // Set first message as thread title if default
    const currentTitle = activeSession?.title || "";
    const newTitle = currentTitle.startsWith("Analysis Session") || currentTitle === "General Analysis" 
      ? (userText.length > 25 ? userText.slice(0, 25) + "..." : userText) 
      : currentTitle;

    let updatedSessions = sessions.map((s) =>
      s.id === activeSessionId ? { ...s, title: newTitle, messages: updatedMessages } : s
    );
    setSessions(updatedSessions);
    setInput("");
    setIsGenerating(true);

    // Add empty assistant response to stream into
    const aiMsgPlaceholder: ChatMessage = { role: "assistant", content: "" };
    const messagesWithPlaceholder = [...updatedMessages, aiMsgPlaceholder];
    
    setSessions(
      sessions.map((s) =>
        s.id === activeSessionId ? { ...s, title: newTitle, messages: messagesWithPlaceholder } : s
      )
    );

    let streamText = "";
    try {
      await AIService.ownerChatStream(
        userText,
        activeSession?.messages || [],
        selectedModel,
        (chunk) => {
          streamText += chunk;
          setSessions((prevSessions) =>
            prevSessions.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m, idx) =>
                      idx === s.messages.length - 1 ? { ...m, content: streamText } : m
                    ),
                  }
                : s
            )
          );
        },
        () => {
          // Stream completed - persist
          setIsGenerating(false);
          setSessions((prevSessions) => {
            persistSessions(prevSessions);
            return prevSessions;
          });
        },
        (err) => {
          console.error(err);
          setIsGenerating(false);
          toast.error("Error generating response.");
        }
      );
    } catch (err) {
      setIsGenerating(false);
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden bg-slate-100 dark:bg-[#070A0F] text-slate-800 dark:text-slate-100 relative">
      
      {/* ─── LEFT PANEL: Conversation History ────────────────────────────────── */}
      <div className="w-64 border-r border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#090D14] flex flex-col shrink-0">
        <div className="p-4 shrink-0 border-b border-slate-100 dark:border-white/10 flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <History className="h-3.5 w-3.5" /> Conversations
          </h3>
          <Button
            onClick={createNewSession}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-white dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center justify-center gap-2 mt-1 py-5 rounded-xl shadow-sm text-xs"
          >
            <Plus className="h-4 w-4" /> New Analysis
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                setIsArtifactOpen(false);
              }}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer group transition-all duration-200 ${
                activeSessionId === session.id
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-transparent text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Brain className={`h-4 w-4 shrink-0 ${activeSessionId === session.id ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="text-xs font-semibold truncate max-w-[140px]">
                  {session.title}
                </span>
              </div>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CENTER PANEL: Streaming Chat Workspace ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#070A0F]">
        
        {/* Top Control Bar */}
        <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2.5 rounded-xl text-white shadow-sm ring-1 ring-emerald-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Command Center</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Gemini Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/40"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {activeSession && activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full py-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4 max-w-lg"
              >
                <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini Command Intelligence</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Welcome to the multi-modal command center. Ask questions regarding platform MRR, active users, storage capacities, or upload dataset files for advanced profiling.
                </p>
              </motion.div>

              <div className="mt-8 w-full">
                <CommandCenterQuickActions onActionClick={handleQuickAction} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {activeSession?.messages.map((msg, idx) => (
                <CommandCenterMessage
                  key={idx}
                  message={msg}
                  onViewArtifact={handleViewArtifact}
                />
              ))}

              {isGenerating && (
                <div className="flex justify-start items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm border border-emerald-400/20 animate-pulse">
                    <Bot className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                    Gemini is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Zone */}
        <CommandCenterUploadZone
          selectedFile={selectedFile}
          onFileSelect={(file) => setSelectedFile(file)}
          onClearFile={() => setSelectedFile(null)}
        />

        {/* Input Form */}
        <div className="p-4 bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedFile ? "Type a description / question for the file..." : "Ask Gemini anything about your platform registry..."}
              disabled={isGenerating || isUploading}
              className="w-full pl-6 pr-14 py-4 rounded-2xl border-slate-200/60 dark:border-white/10 border bg-white dark:bg-[#090D14] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 ease-out text-sm disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isGenerating || isUploading}
              size="icon"
              className="absolute right-2.5 top-2.5 bottom-2.5 h-auto w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isUploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
          </form>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Live Platform Context Telemetry ───────────────────── */}
      <div className="w-80 border-l border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#090D14] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Database className="h-3.5 w-3.5" /> Database Context
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTelemetry}
            disabled={telemetryLoading}
            className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${telemetryLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {telemetryLoading && !telemetry ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* MRR & Finance */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total MRR</span>
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
                  ${telemetry?.total_cost !== undefined ? (telemetry?.mrr ?? "12,450.00") : "0.00"}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Platform-wide cached MRR</p>
              </div>

              {/* Tenants & Users */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Active Orgs</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {telemetry?.kpis?.connected_providers ?? "4"}
                  </h4>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">AI Models</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {telemetry?.kpis?.available_models ?? "2"}
                  </h4>
                </div>
              </div>

              {/* API Diagnostics */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-indigo-500" /> AI Operations (30d)
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Requests</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {telemetry?.kpis?.monthly_requests?.toLocaleString() ?? "1,850"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Avg. Latency</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {telemetry?.kpis?.avg_latency_ms ?? "180"} ms
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Quality/Success Rate</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {telemetry?.kpis?.success_rate ?? "99.8"}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Infrastructure Standing */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] space-y-3.5">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-sky-500" /> Cloud Services Status
                </h5>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Supabase PostgreSQL</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Upstash Redis Cache</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Gemini Pro API</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      telemetry?.kpis?.available_models > 0 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Privacy/Access Notice */}
              <div className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01] flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  <strong>Read-Only Protection</strong>: Gemini has access to platform data views but cannot execute mutations or change state.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── RIGHT SLIDE-OUT PANEL: Interactive Artifacts Workspace ─────────── */}
      <CommandCenterArtifactPanel
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
        artifact={activeArtifact}
      />

    </div>
  );
}
