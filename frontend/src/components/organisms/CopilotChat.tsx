"use client";

import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  Send,
    Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Layers,
  Pin,
  ChevronRight,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/atoms/Logo";
import { toast } from "sonner";
import {
  AIService,
  ChatMessageItem,
  ChatSessionItem,
  SuggestionItem,
} from "@/lib/ai.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

// --- Optimized Artifact Renderer ---
const ArtifactView = memo(({ artifact, onPin }: { artifact: any; onPin: (art: any) => void }) => {
  if (!artifact) return null;

  if (artifact.type === "kpi") {
    const kpi = artifact;
    const metrics = kpi.kpi_metrics || [];
    return (
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/10 border border-emerald-500/20 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {m.label || "Key Metric"}
              </span>
            </div>
            <div className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {m.value || ""}
            </div>
          </div>
        ))}
        <div className="col-span-full flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPin(artifact)}
            className="text-xs gap-1.5 h-7 rounded-lg border-slate-200 dark:border-white/10 hover:bg-emerald-50"
          >
            <Pin className="w-3.5 h-3.5 text-emerald-600" />
            Pin to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (artifact.type === "chart") {
    const chartType = (artifact.chart_type || "bar").toLowerCase();
    const xKey = artifact.x_key || "name";
    const yKey = artifact.y_key || "value";
    const chartData = (artifact.data || []).map((item: any) => ({
      name: item[xKey],
      value: item[yKey],
    }));

    return (
      <div className="mt-4 p-4 rounded-xl bg-white dark:bg-card border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
              {chartType === "line" ? (
                <LineChartIcon className="w-3.5 h-3.5" />
              ) : chartType === "pie" ? (
                <PieChartIcon className="w-3.5 h-3.5" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5" />
              )}
            </div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
              {artifact.title || "Visual Data Analysis"}
            </h4>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPin(artifact)}
            className="text-xs gap-1 h-7 text-slate-500 dark:text-slate-400 hover:text-emerald-600"
          >
            <Pin className="w-3 h-3" />
            Pin
          </Button>
        </div>

        <div className="w-full h-56">
          {chartType === "bar" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", fontSize: 12 }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === "line" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartType === "area" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === "pie" && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {chartData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  return null;
});
ArtifactView.displayName = "ArtifactView";

// --- Memoized Message Bubble Component ---
const ChatMessageBubble = memo(({
  msg,
  onPin,
}: {
  msg: ChatMessageItem;
  onPin: (art: any) => void;
}) => {
  const isUser = msg.role === "user";

  // Custom markdown renderers to fix blue color & code block styling
  const markdownComponents = {
    // Fix blue links ? emerald
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
      >
        {children}
      </a>
    ),
    // Inline code ? emerald tinted bg
    code: ({ inline, children, className }: any) => {
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[12px] font-mono border border-emerald-100 dark:border-emerald-900/50">
            {children}
          </code>
        );
      }
      return (
        <code className={cn("text-emerald-300 text-[12px] font-mono", className)}>
          {children}
        </code>
      );
    },
    // Code block wrapper ? brand dark slate, not navy-blue
    pre: ({ children }: any) => (
      <pre className="my-3 p-4 rounded-xl bg-slate-800 dark:bg-card border border-slate-700/50 overflow-x-auto text-[12px] leading-relaxed">
        {children}
      </pre>
    ),
    // Strong ? emerald accent
    strong: ({ children }: any) => (
      <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
    ),
    // Lists
    ul: ({ children }: any) => (
      <ul className="my-2 space-y-1 list-none pl-0">{children}</ul>
    ),
    li: ({ children }: any) => (
      <li className="flex items-start gap-2 text-[13px]">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <span>{children}</span>
      </li>
    ),
    // Headings
    h1: ({ children }: any) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mt-2 mb-1">{children}</h3>,
    // Blockquote
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-emerald-500 pl-3 my-2 text-slate-500 dark:text-slate-400 italic text-[13px]">
        {children}
      </blockquote>
    ),
    // Horizontal rule
    hr: () => <hr className="border-slate-200 dark:border-white/10 my-3" />,
    // Paragraph spacing
    p: ({ children }: any) => <p className="mb-2 last:mb-0 text-[13.5px] leading-relaxed">{children}</p>,
  };

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[88%] items-end gap-2.5">
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 mb-1 shadow-sm ring-1 ring-emerald-500/20">
            <Logo size={14} showText={false} href={null} whiteMode />
          </div>
        )}
        <div
          className={cn(
            "px-4 py-3 text-[14px] leading-relaxed shadow-sm rounded-2xl",
            isUser
              // ? Brand emerald green for user bubbles (matches #10B981 design system)
              ? "bg-emerald-600 text-white rounded-br-sm font-normal"
              // ? Clean white/dark card for AI responses
              : "bg-white dark:bg-card border border-slate-100 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-bl-sm"
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap text-[13.5px]">{msg.content}</span>
          ) : (
            <>
              {msg.content ? (
                <div className="max-w-none text-[13.5px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 py-1 px-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <ArtifactView artifact={msg.artifact_data} onPin={onPin} />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
ChatMessageBubble.displayName = "ChatMessageBubble";


// --- Main Copilot Organism ---
interface CopilotChatProps {
  datasetId?: string | null;
  onDatasetChange?: (datasetId: string) => void;
  datasets?: Array<{ id: string; name: string; row_count?: number }>;
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  {
    category: "performance",
    icon: "TrendingUp",
    title: "Executive Overview",
    question: "What are the top 5 key performance metrics across my active datasets?",
  },
  {
    category: "trend",
    icon: "Calendar",
    title: "Monthly Trends",
    question: "Show monthly growth trends and identify top performing periods.",
  },
  {
    category: "segmentation",
    icon: "PieChart",
    title: "Distribution Breakdown",
    question: "What is the breakdown of records across top categories?",
  },
  {
    category: "anomaly",
    icon: "AlertTriangle",
    title: "Anomalies & Outliers",
    question: "Detect any outliers, extreme values, or potential data inconsistencies.",
  },
];

export function CopilotChat({
  datasetId: initialDatasetId,
  onDatasetChange,
  datasets = [],
}: CopilotChatProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(initialDatasetId || null);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(DEFAULT_SUGGESTIONS);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // Auto-select first dataset if none selected
  useEffect(() => {
    if (!selectedDatasetId && datasets.length > 0 && initialDatasetId === undefined) {
      setSelectedDatasetId(datasets[0].id);
      onDatasetChange?.(datasets[0].id);
    }
  }, [datasets, selectedDatasetId, initialDatasetId, onDatasetChange]);

  // Sync selected dataset if prop changes
  useEffect(() => {
    if (initialDatasetId !== undefined) {
      setSelectedDatasetId(initialDatasetId);
    }
  }, [initialDatasetId]);

  // Load chat sessions when dataset is selected or changes
  useEffect(() => {
    fetchSessions();
  }, [selectedDatasetId]);

  // Load suggestions when dataset changes
  useEffect(() => {
    if (selectedDatasetId) {
      AIService.getSuggestions(selectedDatasetId)
        .then((suggs) => {
          if (suggs && suggs.length > 0) {
            setSuggestions(suggs);
          } else {
            setSuggestions(DEFAULT_SUGGESTIONS);
          }
        })
        .catch(() => setSuggestions(DEFAULT_SUGGESTIONS));
    } else {
      setSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, [selectedDatasetId]);

  // Auto-scroll instantly on new messages without continuous jerky animation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  const fetchSessions = async () => {
    try {
      const res = await AIService.getSessions(selectedDatasetId || undefined);
      setSessions(res.sessions || []);
      if (res.sessions && res.sessions.length > 0 && !currentSessionId) {
        loadSession(res.sessions[0].id);
      }
    } catch (err) {
      console.error("Failed to load chat sessions", err);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setCurrentSessionId(sessionId);
      const session = await AIService.getSession(sessionId);
      setMessages(session.messages || []);
    } catch (err) {
      console.error("Failed to load session details", err);
      toast.error("Could not load session messages.");
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await AIService.createSession({
        title: "New Exploration",
        dataset_id: selectedDatasetId || undefined,
      });
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      toast.success("New chat session created");
    } catch (err) {
      toast.error("Failed to create new session");
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const updated = await AIService.updateSession(sessionId, { title: editTitle.trim() });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setEditingSessionId(null);
      toast.success("Session renamed");
    } catch (err) {
      toast.error("Failed to rename session");
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await AIService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  const handlePinToDashboard = useCallback((artifact: any) => {
    toast.success("Widget pinned to Dashboard Workspace!");
  }, []);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || isStreamingRef.current) return;

    const userMsgContent = textToSend.trim();
    setInput("");

    // If no active session, automatically create one first
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const created = await AIService.createSession({
          title: userMsgContent.slice(0, 30) + (userMsgContent.length > 30 ? "..." : ""),
          dataset_id: selectedDatasetId || undefined,
        });
        setSessions((prev) => [created, ...prev]);
        setCurrentSessionId(created.id);
        activeSessionId = created.id;
      } catch (e) {
        console.error("Session creation fallback", e);
      }
    }

    const tempUserMsg: ChatMessageItem = {
      id: "user-" + Date.now(),
      session_id: activeSessionId || "",
      role: "user",
      content: userMsgContent,
      created_at: new Date().toISOString(),
    };

    const tempAssistantMsg: ChatMessageItem = {
      id: "ai-" + Date.now(),
      session_id: activeSessionId || "",
      role: "assistant",
      content: "",
      artifact_data: null,
      created_at: new Date().toISOString(),
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsTyping(true);
    isStreamingRef.current = true;

    let streamedContent = "";
    let receivedArtifact: any = null;

    await AIService.copilotChatStream(
      userMsgContent,
      selectedDatasetId,
      historyPayload,
      "groq",
      (tokenChunk) => {
        setIsTyping(false);
        streamedContent += tokenChunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: streamedContent,
              artifact_data: receivedArtifact,
            };
          }
          return updated;
        });
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      },
      () => {
        setIsTyping(false);
        isStreamingRef.current = false;
        fetchSessions();
      },
      (err) => {
        console.error("Chat streaming error", err);
        toast.error("Failed to complete response stream.");
        setIsTyping(false);
        isStreamingRef.current = false;
      },
      activeSessionId,
      (artifact) => {
        receivedArtifact = artifact;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              artifact_data: artifact,
            };
          }
          return updated;
        });
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-9.5rem)] w-full gap-4 overflow-hidden">
      {/* Sessions Left Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white">Chat Sessions</h3>
          </div>
          <Button
            size="sm"
            onClick={handleCreateSession}
            className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs px-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </Button>
        </div>

        {/* Dataset Filter Selector in Sidebar */}
        <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-card">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active Dataset
          </label>
          <div className="relative">
            <select
              value={selectedDatasetId || ""}
              onChange={(e) => {
                const newId = e.target.value || null;
                setSelectedDatasetId(newId);
                onDatasetChange?.(newId || "");
              }}
              className="w-full text-xs py-1.5 pl-7 pr-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-card text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Workspaces & Datasets</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count || 0} rows)
                </option>
              ))}
            </select>
            <Database className="w-3 h-3 text-emerald-600 absolute left-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Session Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No conversations yet. Start a new chat to begin!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              const isEditing = sess.id === editingSessionId;

              return (
                <div
                  key={sess.id}
                  onClick={() => loadSession(sess.id)}
                  className={cn(
                    "group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors text-xs",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-medium border border-emerald-500/20"
                      : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles
                      className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        isActive ? "text-emerald-600" : "text-slate-400"
                      )}
                    />
                    {isEditing ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSession(sess.id);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-card px-1.5 py-0.5 rounded border border-emerald-500 text-xs w-full focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{sess.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(sess.id);
                        }}
                        className="p-1 hover:text-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(sess.id);
                            setEditTitle(sess.title);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Stream Workspace */}
      <div className="flex-1 flex flex-col rounded-2xl bg-white/60 dark:bg-card backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/80 dark:bg-card backdrop-blur-md border-b border-slate-100 dark:border-white/10 px-5 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Brand logo + name */}
            <Logo size={28} showText href={null} />
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
            <div>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-none">AI Data Copilot</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] font-medium text-emerald-600">DuckDB & Groq Engine Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full flex-1 w-full max-w-xl mx-auto text-center space-y-5">
              {/* Brand logo */}
              <div className="flex flex-col items-center gap-2">
                <Logo size={52} showText={false} href={null} />
                <span className="text-xl font-extrabold tracking-tight mt-1">
                  <span className="text-slate-900 dark:text-white">Data</span>
                  <span className="text-emerald-500 dark:text-emerald-400"> Insight</span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-base ml-2">AI Copilot</span>
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  Talk Directly With Your Data
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Ask natural language questions to synthesize instant charts, calculate KPIs, or inspect underlying statistics.
                </p>
              </div>


              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="w-full space-y-2 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recommended Explorations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {suggestions.map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sugg.question)}
                        className="p-3 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-card hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs flex items-center justify-between group shadow-sm"
                      >
                        <span className="text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-medium">
                          {sugg.question}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto w-full pb-4">
              {messages.map((msg, idx) => (
                <ChatMessageBubble
                  key={msg.id || idx}
                  msg={msg}
                  onPin={handlePinToDashboard}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 bg-slate-50/90 dark:bg-card border-t border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3" />
              Suggested:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {suggestions.slice(0, 5).map((sugg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sugg.question)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-card text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all shrink-0 shadow-xs"
                >
                  <span className="truncate max-w-[220px]">{sugg.question}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 bg-white/80 dark:bg-card backdrop-blur-xl border-t border-slate-100 dark:border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto relative group"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your data... (e.g. 'Show me top 5 revenue by region as a bar chart')"
              disabled={isStreamingRef.current}
              className="w-full pl-5 pr-12 py-3 rounded-xl border-slate-200/80 dark:border-white/10 border bg-white dark:bg-card text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isStreamingRef.current}
              size="icon"
              className="absolute right-1.5 top-1.5 bottom-1.5 h-auto w-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
