"use client";

import { motion } from "framer-motion";
import { Search, Filter, MoreHorizontal, MessageSquare, Clock, Eye, CheckCircle2, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface TicketManagementGridProps {
  tickets: any[];
}

export function TicketManagementGrid({ tickets }: TicketManagementGridProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
      case "medium": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400">Open</Badge>;
      case "in_progress": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400">In Progress</Badge>;
      case "resolved": return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mr-4">Support Queue</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tickets, customers, or issues..." 
              className="pl-9 pr-4 py-1.5 text-sm w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs border-slate-200 dark:border-slate-700"
            onClick={() => toast.info("Filter modal will open here")}
          >
            <Filter className="w-3.5 h-3.5 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Subject & Requester</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2 text-right">SLA Target</div>
      </div>

      {/* Grid Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {tickets?.map((ticket, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            key={ticket.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
            onClick={() => toast.info(`Viewing details for ticket: ${ticket.id}`)}
          >
            <div className="col-span-4 pr-4">
              <div className="font-medium text-slate-900 dark:text-white text-sm mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                {ticket.subject}
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 truncate">
                <span className="font-medium text-slate-700 dark:text-slate-300 mr-2">{ticket.requester}</span>
                <span className="truncate">{ticket.organization}</span>
              </div>
            </div>
            
            <div className="col-span-2">
              {getStatusBadge(ticket.status)}
            </div>

            <div className="col-span-2">
              <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-[10px] font-bold`}>
                {ticket.priority.toUpperCase()}
              </Badge>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ring-2 ring-white dark:ring-slate-900 flex-shrink-0">
                  {ticket.assignedTo?.charAt(0) || '?'}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{ticket.assignedTo || 'Unassigned'}</span>
              </div>
            </div>

              <div className="col-span-2 flex items-center justify-end gap-3">
              <div className="flex items-center text-xs text-slate-500 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {ticket.sla}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => toast.info(`Viewing ticket: ${ticket.subject}`)}>  
                    <Eye className="h-4 w-4 mr-2.5 text-blue-500" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.success(`Ticket ${ticket.id} marked as resolved`)}>  
                    <CheckCircle2 className="h-4 w-4 mr-2.5 text-emerald-500" /> Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info(`Reassigning ticket ${ticket.id}...`)}>  
                    <UserPlus className="h-4 w-4 mr-2.5 text-violet-500" /> Reassign Ticket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toast.error(`Ticket ${ticket.id} closed`)}
                    className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2.5" /> Close Ticket
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
        {(!tickets || tickets.length === 0) && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            No active support tickets. Queue is clear!
          </div>
        )}
      </div>
    </div>
  );
}
