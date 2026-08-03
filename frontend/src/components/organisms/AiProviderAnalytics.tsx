"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

export function AiProviderAnalytics() {
  const [mounted, setMounted] = useState(false);
  const [providerTab, setProviderTab] = useState("cost");
  const [burnTab, setBurnTab] = useState("tokens");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: providerData, isLoading: providersLoading } = useQuery({
    queryKey: ["owner-ai-providers"],
    queryFn: async () => (await api.get("/owner/ai/providers")).data,
  });

  const { data: trendData, isLoading: trendsLoading } = useQuery({
    queryKey: ["owner-ai-trends"],
    queryFn: async () => (await api.get("/owner/ai/trends")).data,
  });

  if (!mounted || providersLoading || trendsLoading) {
    return <Skeleton className="w-full h-[400px] rounded-xl mb-8" />;
  }

  if (!providerData?.data || !trendData?.data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Provider Cost Distribution */}
      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Provider Intelligence</h3>
        </div>
        
        <Tabs value={providerTab} onValueChange={setProviderTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cost">Cost by Provider</TabsTrigger>
            <TabsTrigger value="tokens">Token Volume</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cost" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData.data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Cost"]} 
                />
                <Bar dataKey="cost" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="tokens" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData.data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any) => [new Intl.NumberFormat().format(Number(value || 0)), "Tokens"]} 
                />
                <Bar dataKey="tokens" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </div>

      {/* Burn Rate Timeline */}
      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">30-Day Platform Burn Rate</h3>
        
        <Tabs value={burnTab} onValueChange={setBurnTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Request Burn</TabsTrigger>
            <TabsTrigger value="cost">Cost Burn</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} tick={{ fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Area type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="cost" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} tick={{ fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Cost"]} 
                />
                <Area type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
