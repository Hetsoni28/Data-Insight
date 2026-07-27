"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AIService, ChatMessage } from "@/lib/ai.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CopilotChatProps {
  datasetId: string | null;
}

export function CopilotChat({ datasetId }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      const response = await AIService.chat(
        userMsg.content,
        datasetId,
        messages // send history for context
      );

      const aiMsg: ChatMessage = { role: "assistant", content: response.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Chat error", error);
      toast.error("Failed to get AI response.");
      // Optionally remove the user message if it failed, but usually we just append an error bubble.
    } finally {
      setIsTyping(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed">
        <Bot className="h-10 w-10 text-slate-300 mb-3" />
        <p>Select a dataset to start analyzing with AI Copilot.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b px-4 py-3 flex items-center gap-2">
        <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-700">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Data Insight Copilot</h3>
          <p className="text-xs text-muted-foreground">Powered by Claude & GPT-4o</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 mt-20">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full">
              <Bot className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">How can I help you analyze this dataset?</p>
            <div className="flex gap-2 flex-wrap justify-center mt-4">
              {["What is the total revenue?", "Find anomalies in the data", "Summarize the key trends"].map((suggestion) => (
                <Badge
                  key={suggestion}
                  className="cursor-pointer hover:bg-slate-200 transition-colors bg-slate-100 text-slate-700 font-normal"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200"
                  )}
                >
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] rounded-2xl bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-500">Copilot is thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={isTyping}
            className="flex-1 shadow-sm focus-visible:ring-emerald-500"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// Temporary inline Badge component since it's simple
function Badge({ children, className, onClick }: any) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </span>
  );
}
