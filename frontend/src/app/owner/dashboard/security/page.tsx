'use client';
import dynamic from "next/dynamic"

import { useQuery } from '@tanstack/react-query';
import { securityOpsService } from '@/lib/securityOpsService';



const SecurityHeroBanner = dynamic(() => import('@/components/organisms/SecurityHeroBanner').then(m => m.SecurityHeroBanner), { ssr: false })
const SecurityOperationsCenter = dynamic(() => import('@/components/organisms/SecurityOperationsCenter').then(m => m.SecurityOperationsCenter), { ssr: false })

export default function SecurityPage() {
    // 1. Fetch Overview KPIs
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['security-overview'],
        queryFn: securityOpsService.getOverview,
        refetchInterval: 10000, // Poll every 10 seconds for live telemetry
    });

    // 2. Fetch Events
    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['security-events'],
        queryFn: () => securityOpsService.getEvents(50),
        refetchInterval: 15000,
    });

    // 3. Fetch Threats
    const { data: threats, isLoading: threatsLoading } = useQuery({
        queryKey: ['security-threats'],
        queryFn: () => securityOpsService.getThreats(50),
        refetchInterval: 60000,
    });

    // 4. Fetch Sessions
    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ['security-sessions'],
        queryFn: () => securityOpsService.getSessions(50),
        refetchInterval: 30000,
    });

    // 5. Fetch Compliance
    const { data: compliance, isLoading: complianceLoading } = useQuery({
        queryKey: ['security-compliance'],
        queryFn: securityOpsService.getCompliance,
        refetchInterval: 300000,
    });

    const isAnyLoading = overviewLoading || eventsLoading || threatsLoading || sessionsLoading || complianceLoading;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
            <SecurityHeroBanner 
                overview={overview} 
                isLoading={overviewLoading} 
            />
            
            <SecurityOperationsCenter
                events={events}
                threats={threats}
                sessions={sessions}
                compliance={compliance}
                isLoading={isAnyLoading && !events}
            />
        </div>
    );
}
