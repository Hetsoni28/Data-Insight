"use client";

import { useState } from "react";
import { X, Copy, Check, Download, Table, Code, Search, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CommandCenterArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: { type: string; title: string; content: string } | null;
}

export function CommandCenterArtifactPanel({ isOpen, onClose, artifact }: CommandCenterArtifactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, "_")}.${artifact.type === "sql" ? "sql" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parses markdown tables or comma-separated values into headers and rows
  const parseTableData = (content: string) => {
    // Check if it's a markdown table (has | characters and dashes separator)
    if (content.includes("|")) {
      const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      // Skip separator line (e.g. |---|---|)
      const dataLines = lines.filter(line => !line.match(/^\|?\s*:?-+:?\s*\|/));
      
      const parsedRows = dataLines.map(line => {
        // Split by | and filter empty ends
        const cells = line.split("|").map(c => c.trim());
        if (line.startsWith("|")) cells.shift();
        if (line.endsWith("|")) cells.pop();
        return cells;
      }).filter(row => row.length > 0);

      if (parsedRows.length > 0) {
        const headers = parsedRows[0];
        const rows = parsedRows.slice(1);
        return { headers, rows };
      }
    }

    // Fallback: Parse as CSV
    const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      const headers = lines[0].split(",").map(c => c.replace(/"/g, "").trim());
      const rows = lines.slice(1).map(line => line.split(",").map(c => c.replace(/"/g, "").trim()));
      return { headers, rows };
    }

    return { headers: [], rows: [] };
  };

  const isTable = artifact.type === "excel" || artifact.type === "csv" || artifact.content.includes("|");
  const { headers, rows } = isTable ? parseTableData(artifact.content) : { headers: [], rows: [] };

  // Filter rows based on search query
  const filteredRows = rows.filter(row => 
    row.some(cell => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.5 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`fixed top-16 right-0 bottom-0 border-l border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-[#080B11] shadow-2xl flex flex-col z-40 transition-all duration-300 ${
          isExpanded ? "w-full md:w-3/4 lg:w-2/3" : "w-full md:w-1/2 lg:w-[48%]"
        }`}
      >
        {/* Artifact Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              {isTable ? <Table className="h-5 w-5" /> : <Code className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px] md:max-w-xs">
                {artifact.title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
                {artifact.type} Artifact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar for tabular data */}
        {isTable && headers.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-100/50 dark:bg-white/[0.01] border-b border-slate-200/60 dark:border-white/10 flex items-center gap-2.5 shrink-0">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search spreadsheet rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isTable && headers.length > 0 ? (
            <div className="border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#090D14] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-300">
                      {headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 font-semibold select-none border-r border-slate-200/50 dark:border-white/5 last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors"
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5 text-slate-800 dark:text-slate-300 font-medium border-r border-slate-200/50 dark:border-white/5 last:border-r-0 max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <pre className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090D14] font-mono text-[13px] text-slate-800 dark:text-slate-100 overflow-x-auto leading-relaxed shadow-inner">
              <code>{artifact.content}</code>
            </pre>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
