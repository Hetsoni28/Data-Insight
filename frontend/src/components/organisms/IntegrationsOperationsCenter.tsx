"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import { Link, Cloud, Database, CreditCard, Mail, Cpu, BarChart2, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff, Settings2, PlayCircle, GitBranch, ArrowRight, Webhook, Clock } from "lucide-react";
import { 
  getConnectedIntegrations, 
  getWebhooks, 
  getWorkflows, 
  getIntegrationLogs,
  IntegrationConnection,
  WebhookEndpoint,
  AutomationWorkflow,
  IntegrationLog
} from "@/lib/integrationOpsService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── HELPERS ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: IntegrationConnection["status"] }) {
  if (status === "online") return <Wifi size={14} className="text-emerald-600 dark:text-green-400" />;
  if (status === "degraded") return <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />;
  return <WifiOff size={14} className="text-red-600 dark:text-red-400" />;
}

function StatusBadge({ status }: { status: IntegrationConnection["status"] }) {
  const map = {
    online: "bg-emerald-50 dark:bg-green-500/10 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-500/20",
    degraded: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    offline: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    maintenance: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.offline}`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 95 ? "bg-emerald-500 dark:bg-green-400" : score >= 80 ? "bg-amber-500 dark:bg-amber-400" : "bg-red-500 dark:bg-red-400";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-xs text-slate-500 dark:text-white/60 w-8 text-right">{score}%</span>
    </div>
  );
}

function getCategoryIcon(category: string) {
  const map: Record<string, React.ElementType> = {
    "Cloud": Cloud, "Database": Database, "Payment": CreditCard, 
    "Email": Mail, "AI": Cpu, "Analytics": BarChart2
  };
  const Icon = map[category] || Link;
  return <Icon size={16} className="text-slate-500 dark:text-white/60" />;
}

// ─── TABLES ────────────────────────────────────────────────────────────────
function ConnectionsTable({ integrations }: { integrations: IntegrationConnection[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = integrations.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedIntegrations = useMemo(() =>
    integrations.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [integrations, currentPage, pageSize]
  );

  return (
    <div className="overflow-x-auto flex flex-col h-full justify-between">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5">
            {["Provider", "Category", "Status", "Health", "Auth", "Latency", "Last Sync"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider py-3 px-4 first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {paginatedIntegrations.map((i, idx) => (
            <motion.tr key={i.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="group hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <td className="py-3 px-4 pl-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    {getCategoryIcon(i.category)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{i.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/40">{i.provider}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4"><span className="text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 px-2 py-0.5 rounded capitalize">{i.category}</span></td>
              <td className="py-3 px-4"><StatusBadge status={i.status} /></td>
              <td className="py-3 px-4 w-36"><HealthBar score={i.health_score} /></td>
              <td className="py-3 px-4"><span className="text-xs text-slate-500 dark:text-white/60 font-mono">{i.auth_type}</span></td>
              <td className="py-3 px-4"><span className="text-sm text-slate-700 dark:text-white/70">{i.latency_ms}ms</span></td>
              <td className="py-3 px-4">
                <span className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1">
                  <Clock size={12} />
                  {i.last_sync_at ? new Date(i.last_sync_at).toLocaleTimeString() : 'Never'}
                </span>
              </td>
            </motion.tr>
          ))}
          {totalItems === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
                No connections found.
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

function WebhooksTable({ webhooks }: { webhooks: WebhookEndpoint[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = webhooks.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedWebhooks = useMemo(() =>
    webhooks.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [webhooks, currentPage, pageSize]
  );

  return (
    <div className="overflow-x-auto flex flex-col h-full justify-between">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5">
            {["Name / URL", "Events", "Status", "Success Rate", "Latency", "Last Triggered"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider py-3 px-4 first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {paginatedWebhooks.map((w, i) => (
            <motion.tr key={w.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="group hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <td className="py-3 px-4 pl-0">
                <div className="flex items-center gap-3">
                  <Webhook size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{w.name}</p>
                    <p className="text-xs text-slate-500 dark:text-white/40 max-w-[200px] truncate">{w.url}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4"><span className="text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 px-2 py-0.5 rounded font-mono">{w.events.join(", ")}</span></td>
              <td className="py-3 px-4">
                {w.is_active ? <span className="text-xs text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10 px-2 py-1 rounded-full">Active</span> : <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">Paused</span>}
              </td>
              <td className="py-3 px-4"><span className="text-sm text-slate-700 dark:text-white/70">{w.success_rate}%</span></td>
              <td className="py-3 px-4"><span className="text-sm text-slate-700 dark:text-white/70">{w.latency_ms}ms</span></td>
              <td className="py-3 px-4"><span className="text-xs text-slate-500 dark:text-white/50">{w.last_triggered_at ? new Date(w.last_triggered_at).toLocaleTimeString() : 'Never'}</span></td>
            </motion.tr>
          ))}
          {totalItems === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
                No webhooks configured.
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

function WorkflowsGrid({ workflows }: { workflows: AutomationWorkflow[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = workflows.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedWorkflows = useMemo(() =>
    workflows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [workflows, currentPage, pageSize]
  );

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {paginatedWorkflows.map((w, i) => (
        <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">{w.trigger_type}</span>
            {w.status === "active" ? <CheckCircle2 size={16} className="text-emerald-500 dark:text-green-400" /> : <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />}
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{w.name}</h4>
          <p className="text-xs text-slate-500 dark:text-white/50 mb-4">{w.description}</p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono text-slate-600 dark:text-white/60 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">Trigger</span>
            <ArrowRight size={12} className="text-slate-400" />
            <span className="text-xs font-mono text-slate-600 dark:text-white/60 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">{w.actions.length} Action{w.actions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10 text-xs">
            <span className="text-slate-500 dark:text-white/50">{w.execution_count.toLocaleString()} runs</span>
            <span className="text-emerald-600 dark:text-green-400 font-medium">{w.success_rate}% success</span>
          </div>
        </motion.div>
      ))}
      {totalItems === 0 && (
        <div className="py-8 text-center text-slate-400 dark:text-white/40 text-sm col-span-full">
          No workflows found.
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

function LogsTable({ logs }: { logs: IntegrationLog[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLogs = useMemo(() =>
    logs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [logs, currentPage, pageSize]
  );

  const getStatusColor = (code: number) => {
    if (code < 300) return "text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10 border-emerald-200 dark:border-green-500/20";
    if (code < 500) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
  };

  return (
    <div className="overflow-x-auto flex flex-col h-full justify-between">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5">
            {["Timestamp", "Provider", "Method", "Endpoint", "Status", "Latency"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider py-3 px-4 first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {paginatedLogs.map((l, i) => (
            <tr key={l.id} className="group hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <td className="py-2.5 px-4 pl-0"><span className="text-xs text-slate-500 dark:text-white/50 font-mono">{new Date(l.timestamp).toLocaleString()}</span></td>
              <td className="py-2.5 px-4"><span className="text-sm text-slate-700 dark:text-white/70">{l.provider}</span></td>
              <td className="py-2.5 px-4"><span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">{l.request_method}</span></td>
              <td className="py-2.5 px-4"><span className="text-xs text-slate-600 dark:text-white/60 font-mono truncate max-w-[200px] block">{l.endpoint}</span></td>
              <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(l.status_code)}`}>{l.status_code}</span></td>
              <td className="py-2.5 px-4"><span className="text-xs text-slate-600 dark:text-white/60">{l.latency_ms}ms</span></td>
            </tr>
          ))}
          {totalItems === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-white/40 text-sm">
                No logs found.
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

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export function IntegrationsOperationsCenter() {
  const { data: connData, isLoading: cLoading } = useQuery({ queryKey: ["int-connected"], queryFn: getConnectedIntegrations });
  const { data: webhooksData, isLoading: wLoading } = useQuery({ queryKey: ["int-webhooks"], queryFn: getWebhooks });
  const { data: workflowsData, isLoading: wfLoading } = useQuery({ queryKey: ["int-workflows"], queryFn: getWorkflows });
  const { data: logsData, isLoading: lLoading } = useQuery({ queryKey: ["int-logs"], queryFn: getIntegrationLogs });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/3 shadow-sm dark:shadow-none backdrop-blur-sm overflow-hidden p-6">
      <Tabs defaultValue="connected" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <TabsList className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <TabsTrigger value="connected" className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">Connected Services</TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">Webhooks</TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">Workflows</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">Audit Logs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="connected" className="mt-0 outline-none">
          {cLoading ? <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" /> : <ConnectionsTable integrations={connData?.integrations ?? []} />}
        </TabsContent>

        <TabsContent value="webhooks" className="mt-0 outline-none">
          {wLoading ? <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" /> : <WebhooksTable webhooks={webhooksData?.webhooks ?? []} />}
        </TabsContent>

        <TabsContent value="workflows" className="mt-0 outline-none">
          {wfLoading ? <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" /> : <WorkflowsGrid workflows={workflowsData?.workflows ?? []} />}
        </TabsContent>

        <TabsContent value="logs" className="mt-0 outline-none">
          {lLoading ? <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl" /> : <LogsTable logs={logsData?.logs ?? []} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
