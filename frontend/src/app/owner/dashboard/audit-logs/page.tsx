import dynamic from "next/dynamic"
﻿'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditOpsService } from '@/lib/auditOpsService';



const AuditHeroBanner = dynamic(() => import('@/components/organisms/AuditHeroBanner').then(m => m.AuditHeroBanner), { ssr: false })
const EnterpriseAuditCenter = dynamic(() => import('@/components/organisms/EnterpriseAuditCenter').then(m => m.EnterpriseAuditCenter), { ssr: false })

export default function AuditPage() {
    const [filterModule, setFilterModule] = useState<string>('all');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // 1. Fetch Overview KPIs
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['audit-overview'],
        queryFn: auditOpsService.getOverview,
        refetchInterval: 15000,
    });

    // 2. Fetch Events
    const { data: eventsData, isLoading: eventsLoading } = useQuery({
        queryKey: ['audit-events', filterModule, filterSeverity, searchQuery],
        queryFn: () => auditOpsService.getEvents(50, 0, filterModule, filterSeverity, searchQuery),
        refetchInterval: 30000,
    });

    // 3. Fetch Timeline
    const { data: timeline, isLoading: timelineLoading } = useQuery({
        queryKey: ['audit-timeline'],
        queryFn: () => auditOpsService.getTimeline(20),
        refetchInterval: 60000,
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
            <AuditHeroBanner 
                overview={overview} 
                isLoading={overviewLoading} 
            />
            
            <EnterpriseAuditCenter
                events={eventsData?.events}
                timeline={timeline}
                overview={overview}
                isLoading={eventsLoading || timelineLoading}
                setFilterModule={setFilterModule}
                setFilterSeverity={setFilterSeverity}
                setSearchQuery={setSearchQuery}
            />
        </div>
    );
}
