"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, ShieldAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SupportHeroProps {
  activeIncidents?: number;
}

export function SupportHero({ activeIncidents = 0 }: SupportHeroProps) {
  const queryClient = useQueryClient();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  // Form states
  const [ticketData, setTicketData] = useState({ subject: "", description: "", priority: "medium", category: "General" });
  const [incidentData, setIncidentData] = useState({ title: "", description: "", severity: "minor" });
  const [broadcastData, setBroadcastData] = useState({ message: "" });

  const createTicket = useMutation({
    mutationFn: async (data: typeof ticketData) => {
      const res = await api.post("/support/tickets", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Support ticket created");
      setTicketOpen(false);
      setTicketData({ subject: "", description: "", priority: "medium", category: "General" });
      queryClient.invalidateQueries({ queryKey: ['support-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: () => toast.error("Failed to create ticket")
  });

  const createIncident = useMutation({
    mutationFn: async (data: typeof incidentData) => {
      const res = await api.post("/support/incidents", {
        ...data, status: "investigating"
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Platform incident reported");
      setIncidentOpen(false);
      setIncidentData({ title: "", description: "", severity: "minor" });
      queryClient.invalidateQueries({ queryKey: ['support-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['support-incidents'] });
    },
    onError: () => toast.error("Failed to report incident")
  });

  const sendBroadcast = useMutation({
    mutationFn: async (data: typeof broadcastData) => {
      const res = await api.post("/support/broadcast", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Broadcast sent successfully");
      setBroadcastOpen(false);
      setBroadcastData({ message: "" });
    },
    onError: () => toast.error("Failed to send broadcast")
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative overflow-hidden bg-[#0A3A2A] rounded-2xl border border-emerald-900/30 p-8 shadow-sm mb-8">
      {/* Decorative Background Elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl pointer-events-none"
      />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {activeIncidents > 0 ? (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse" />
                {activeIncidents} Active Incident{activeIncidents > 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                Systems Operational
              </Badge>
            )}
            <span className="text-sm font-medium text-emerald-100/70">{currentDate}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Platform Support Center
          </h1>
          <p className="text-emerald-100/80 max-w-xl text-sm leading-relaxed">
            Manage customer issues, track system incidents, and monitor platform health across all active Data Insight organizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Incident Modal */}
          <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <ShieldAlert className="w-4 h-4 mr-2 text-rose-400" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-slate-200/60 dark:border-white/10 bg-white dark:bg-card">
              <DialogHeader>
                <DialogTitle>Report Platform Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Incident Title</Label>
                  <Input 
                    value={incidentData.title} 
                    onChange={e => setIncidentData({...incidentData, title: e.target.value})} 
                    placeholder="e.g. API Gateway Latency" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    value={incidentData.description} 
                    onChange={e => setIncidentData({...incidentData, description: e.target.value})}
                    className="w-full flex min-h-[80px] rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-slate-900 dark:text-white" 
                    placeholder="Provide details about the issue..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <select 
                    value={incidentData.severity}
                    onChange={e => setIncidentData({...incidentData, severity: e.target.value})}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIncidentOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createIncident.mutate(incidentData)} 
                  disabled={!incidentData.title || createIncident.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {createIncident.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Report Incident
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Broadcast Modal */}
          <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Megaphone className="w-4 h-4 mr-2 text-emerald-300" />
                Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-slate-200/60 dark:border-white/10 bg-white dark:bg-card">
              <DialogHeader>
                <DialogTitle>Send Platform Broadcast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Message</Label>
                  <textarea 
                    value={broadcastData.message} 
                    onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                    className="w-full flex min-h-[100px] rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-slate-900 dark:text-white" 
                    placeholder="This message will appear for all active organizations..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => sendBroadcast.mutate(broadcastData)} 
                  disabled={!broadcastData.message || sendBroadcast.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sendBroadcast.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Broadcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Ticket Modal */}
          <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-none">
                <Plus className="w-4 h-4 mr-2" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-slate-200/60 dark:border-white/10 bg-white dark:bg-card">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input 
                    value={ticketData.subject} 
                    onChange={e => setTicketData({...ticketData, subject: e.target.value})} 
                    placeholder="Brief description of the issue" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    value={ticketData.category}
                    onChange={e => setTicketData({...ticketData, category: e.target.value})}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="General">General Question</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="Database">Database Connection</option>
                    <option value="AI">AI Integration</option>
                    <option value="IAM">User Access</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select 
                    value={ticketData.priority}
                    onChange={e => setTicketData({...ticketData, priority: e.target.value})}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    value={ticketData.description} 
                    onChange={e => setTicketData({...ticketData, description: e.target.value})}
                    className="w-full flex min-h-[100px] rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-slate-900 dark:text-white" 
                    placeholder="Provide as much detail as possible..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTicketOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createTicket.mutate(ticketData)} 
                  disabled={!ticketData.subject || !ticketData.description || createTicket.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {createTicket.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
