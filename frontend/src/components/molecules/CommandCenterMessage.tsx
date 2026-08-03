"use client";

import { useState } from "react";
import { Copy, Check, FileCode, FileSpreadsheet, Eye, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CommandCenterMessageProps {
  message: Message;
  onViewArtifact: (type: string, title: string, content: string) => void;
}

export function CommandCenterMessage({ message, onViewArtifact }: CommandCenterMessageProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Helper to copy code block
  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(blockId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Extract artifact blocks from message content
  // Format: [ARTIFACT:type:title]content[/ARTIFACT]
  const parseContent = (content: string) => {
    const artifactRegex = /\[ARTIFACT:([a-z]+):([^\]]+)\]([\s\S]*?)\[\/ARTIFACT\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    const artifactItems: { type: string; title: string; content: string }[] = [];

    // Parse all artifacts first
    while ((match = artifactRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const type = match[1];
      const title = match[2];
      const body = match[3].trim();

      // Add text leading to this artifact
      if (startIndex > lastIndex) {
        parts.push({
          type: "text",
          content: content.substring(lastIndex, startIndex),
        });
      }

      // Add artifact reference
      parts.push({
        type: "artifact_ref",
        artifact: { type, title, content: body },
      });

      artifactItems.push({ type, title, content: body });
      lastIndex = artifactRegex.lastIndex;
    }

    // Add trailing text
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex),
      });
    }

    // Default if no artifacts found
    if (parts.length === 0) {
      parts.push({ type: "text", content });
    }

    return { parts, artifactItems };
  };

  const { parts } = parseContent(message.content);

  // Custom parser to render basic markdown elements (code blocks, list items, bold)
  const renderMarkdown = (text: string) => {
    if (!text.trim()) return null;

    const sections = text.split(/(```[a-z]*[\s\S]*?```)/g);

    return sections.map((section, idx) => {
      // Handle Code Block
      if (section.startsWith("```")) {
        const lines = section.split("\n");
        const language = lines[0].replace("```", "").trim() || "code";
        const codeText = lines.slice(1, -1).join("\n");
        const blockId = `${idx}-${language}`;

        return (
          <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="bg-slate-100 dark:bg-white/[0.04] px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="uppercase">{language}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(codeText, blockId)}
                className="h-7 px-2 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-white"
              >
                {copiedCodeId === blockId ? (
                  <Check className="h-3 w-3 text-emerald-500 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copiedCodeId === blockId ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="p-4 bg-slate-50 dark:bg-[#090D14] text-[13px] text-slate-800 dark:text-slate-100 overflow-x-auto font-mono leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Handle normal paragraphs, bold, lists
      const lines = section.split("\n");
      return (
        <div key={idx} className="space-y-2">
          {lines.map((line, lIdx) => {
            // Check list item
            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
              const formattedLine = formatBoldText(line.trim().substring(2));
              return (
                <ul key={lIdx} className="list-disc pl-5 my-1 text-slate-700 dark:text-slate-300">
                  <li className="leading-relaxed">{formattedLine}</li>
                </ul>
              );
            }
            // Check numbered list
            if (/^\d+\.\s/.test(line.trim())) {
              const content = line.trim().replace(/^\d+\.\s/, "");
              const formattedLine = formatBoldText(content);
              return (
                <ol key={lIdx} className="list-decimal pl-5 my-1 text-slate-700 dark:text-slate-300">
                  <li className="leading-relaxed">{formattedLine}</li>
                </ol>
              );
            }
            // Check headings
            if (line.startsWith("### ")) {
              return <h4 key={lIdx} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{line.replace("### ", "")}</h4>;
            }
            if (line.startsWith("## ")) {
              return <h3 key={lIdx} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">{line.replace("## ", "")}</h3>;
            }
            if (line.startsWith("# ")) {
              return <h2 key={lIdx} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">{line.replace("# ", "")}</h2>;
            }

            // Normal paragraph line
            if (!line.trim()) return <div key={lIdx} className="h-2" />;
            return (
              <p key={lIdx} className="leading-relaxed text-slate-700 dark:text-slate-300">
                {formatBoldText(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Replace **text** with <strong>text</strong>
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-white">
            {part.substring(2, part.length - 2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[85%] items-start gap-3">
        {message.role === "assistant" && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-400/20">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div
            className={`px-5 py-4 text-[14px] leading-relaxed shadow-sm rounded-2xl ${
              message.role === "user"
                ? "bg-slate-900 dark:bg-white/10 text-white rounded-br-sm border border-slate-800 dark:border-white/5"
                : "bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-sm"
            }`}
          >
            {parts.map((part, idx) => {
              if (part.type === "text") {
                return <div key={idx}>{renderMarkdown(part.content || "")}</div>;
              } else if (part.type === "artifact_ref" && part.artifact) {
                const art = part.artifact;
                return (
                  <div
                    key={idx}
                    className="my-3 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-500/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-white/10 shadow-sm shrink-0">
                        {art.type === "sql" ? (
                          <FileCode className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {art.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Click to open generated {art.type.toUpperCase()} report in workspace
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onViewArtifact(art.type, art.title, art.content)}
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-white dark:text-emerald-300 shrink-0 flex items-center gap-1.5 h-8 text-xs font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Artifact
                    </Button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {message.role === "user" && (
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 border border-slate-300/40 dark:border-white/5">
            <User className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
          </div>
        )}
      </div>
    </div>
  );
}
