"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import {
  Server,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Layers,
  GitBranch,
} from "lucide-react";
import {
  getAIProviders,
  getAIModels,
  getAIRoutingRules,
  type AIProvider,
  type AIModel,
  type AIRoutingRule,
} from "@/lib/aiOpsService";

// ─── PROVIDER STATUS ICON ──────────────────────────────────────────────────
function StatusIcon({ status }: { status: AIProvider["status"] }) {
  if (status === "online")
    return <Wifi size={14} className="text-emerald-600 dark:text-green-400" />;
  if (status === "degraded")
    return <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />;
  return <WifiOff size={14} className="text-red-600 dark:text-red-400" />;
}

function StatusBadge({ status }: { status: AIProvider["status"] }) {
  const map = {
    online: "bg-emerald-50 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-500/20",
    degraded: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    offline: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    maintenance: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        map[status] ?? map.offline
      }`}
    >
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function HealthBar({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-emerald-500 dark:bg-green-400"
      : score >= 70
      ? "bg-amber-500 dark:bg-amber-400"
      : "bg-red-500 dark:bg-red-400";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs text-slate-500 dark:text-white/60 w-8 text-right">{score}</span>
    </div>
  );
}

// ─── PROVIDER TABLE ────────────────────────────────────────────────────────
function ProvidersTable({ providers }: { providers: AIProvider[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = providers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProviders = providers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto flex flex-col h-full justify-between">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5">
            {["Provider", "Environment", "Status", "Health", "Latency"].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider py-3 px-4 first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {paginatedProviders.map((p, i) => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
            >
              <td className="py-3 px-4 pl-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    <Server size={14} className="text-slate-500 dark:text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/40 truncate max-w-[180px]">
                      {p.base_url}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 px-2 py-0.5 rounded capitalize">
                  {p.environment}
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="py-3 px-4 w-36">
                <HealthBar score={p.health_score} />
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-slate-700 dark:text-white/70">{p.latency_ms}ms</span>
              </td>
            </motion.tr>
          ))}
          {totalItems === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
                No providers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {totalItems > 0 && (
          <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
          />
      )}
    </div>
  );
}

// ─── MODELS TABLE ──────────────────────────────────────────────────────────
function ModelsTable({ models }: { models: AIModel[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = models.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedModels = models.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const typeColor = (t: string) => {
    if (t === "chat") return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    if (t === "embedding") return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    if (t === "vision") return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    return "text-slate-600 dark:text-white/50 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10";
  };

  return (
    <div className="overflow-x-auto flex flex-col h-full justify-between">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5">
            {["Model", "Provider", "Type", "Context", "Input $/1K", "Output $/1K", "Quality", "Active"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider py-3 px-4 first:pl-0"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {paginatedModels.map((m, i) => (
            <motion.tr
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
            >
              <td className="py-3 px-4 pl-0">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400 dark:text-white/30" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{m.name}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-slate-600 dark:text-white/60">{m.provider}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${typeColor(
                    m.type
                  )}`}
                >
                  {m.type}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs text-slate-500 dark:text-white/50">
                  {(m.context_window / 1000).toFixed(0)}K
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono text-amber-600 dark:text-amber-300">
                  ${m.input_cost.toFixed(4)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs font-mono text-amber-600 dark:text-amber-300">
                  ${m.output_cost.toFixed(4)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-16 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                      style={{ width: `${m.quality_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-white/50">{m.quality_score}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                {m.is_active ? (
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-500 dark:text-red-400" />
                )}
              </td>
            </motion.tr>
          ))}
          {totalItems === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
                No models found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {totalItems > 0 && (
          <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
          />
      )}
    </div>
  );
}

// ─── ROUTING TABLE ─────────────────────────────────────────────────────────
function RoutingTable({ rules }: { rules: AIRoutingRule[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = rules.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedRules = rules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-3 mb-6">
        {paginatedRules.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          {/* Task badge */}
          <div className="min-w-[140px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium capitalize">
              <GitBranch size={11} />
              {r.task_type.replace(/_/g, " ")}
            </span>
          </div>

          {/* Route */}
          <div className="flex-1 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {r.primary_model}
            </div>
            <ArrowRight size={14} className="text-slate-300 dark:text-white/20 shrink-0" />
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 text-xs">
              {r.fallback_model !== "None" ? r.fallback_model : "No fallback"}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-white/40">
            <span>{r.timeout_ms}ms timeout</span>
            <span>{r.retry_count} retries</span>
            <span
              className={
                r.is_active
                  ? "text-emerald-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {r.is_active ? "Active" : "Disabled"}
            </span>
          </div>
        </motion.div>
      ))}
      {totalItems === 0 && (
        <div className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
          No routing rules found.
        </div>
      )}
      </div>
      
      {totalItems > 0 && (
          <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
          />
      )}
    </div>
  );
}

// ─── SECTION CARD ──────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  count,
  children,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/3 shadow-sm dark:shadow-none backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Icon size={16} className="text-slate-600 dark:text-white/70" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-white/40">{subtitle}</p>
          </div>
        </div>
        {count !== undefined && (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-white/50 font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="px-6 py-4">{children}</div>
    </motion.div>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────
export function AiOpsOperationsCenter() {
  const { data: providerData, isLoading: pLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: getAIProviders,
    refetchInterval: 30000,
  });

  const { data: modelData, isLoading: mLoading } = useQuery({
    queryKey: ["ai-models"],
    queryFn: getAIModels,
  });

  const { data: routingData, isLoading: rLoading } = useQuery({
    queryKey: ["ai-routing"],
    queryFn: getAIRoutingRules,
  });

  return (
    <div className="space-y-6">
      {/* Providers */}
      <SectionCard
        title="Provider Status"
        subtitle="Live health and latency for all connected AI providers"
        icon={Server}
        count={providerData?.providers?.length}
        delay={0.1}
      >
        {pLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <ProvidersTable providers={providerData?.providers ?? []} />
        )}
      </SectionCard>

      {/* Models */}
      <SectionCard
        title="Model Registry"
        subtitle="All available models with pricing and capability metadata"
        icon={Cpu}
        count={modelData?.models?.length}
        delay={0.2}
      >
        {mLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <ModelsTable models={modelData?.models ?? []} />
        )}
      </SectionCard>

      {/* Routing Engine */}
      <SectionCard
        title="Smart Routing Engine"
        subtitle="Task-based model routing with automatic failover"
        icon={GitBranch}
        count={routingData?.rules?.length}
        delay={0.3}
      >
        {rLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <RoutingTable rules={routingData?.rules ?? []} />
        )}
      </SectionCard>
    </div>
  );
}
