"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Server,
  ShieldCheck,
  Cpu,
  Layers,
  HardDrive,
  Network,
  Cloud,
  Lock,
  Zap,
  CheckCircle2,
  Database,
} from "lucide-react"

interface CloudProvider {
  id: string
  name: string
  region: string
  sla: string
  latency: string
  desc: string
  nodes: {
    title: string
    tech: string
    detail: string
    icon: any
    spec: string
  }[]
}

const PROVIDERS: CloudProvider[] = [
  {
    id: "aws",
    name: "Amazon Web Services (AWS)",
    region: "us-east-1 (N. Virginia) / Dedicated VPC",
    sla: "99.99% Guaranteed",
    latency: "< 18ms",
    desc: "Single-tenant isolated AWS Virtual Private Cloud with dedicated EC2 Nitro instances, Supabase dedicated storage, and isolated VPC peering.",
    nodes: [
      {
        title: "Edge Ingestion & TLS 1.3 Proxy",
        tech: "Envoy Reverse Proxy & CloudFront",
        detail: "Handles custom domain SSL termination (bi.yourcompany.com), SAML 2.0 SSO validation, and DDoS mitigation.",
        icon: Network,
        spec: "10 Gbps Uplink",
      },
      {
        title: "SIMD Stream Processing Engine",
        tech: "Rust Vector Ingestion Worker",
        detail: "Parses CSV, XLSX, and relational streams at 1.2M rows/sec with zero disk caching.",
        icon: Cpu,
        spec: "1.2M rows/sec",
      },
      {
        title: "Deterministic Calculation Matrix",
        tech: "IEEE-754 Arithmetic Engine",
        detail: "Executes mathematical aggregations, linear regression forecasting, and 1.7σ outlier isolation.",
        icon: Zap,
        spec: "64-bit Precision",
      },
      {
        title: "Supabase Dedicated Storage",
        tech: "Supabase PostgreSQL & Storage Buckets",
        detail: "Physically isolated Supabase instance with Row-Level Security (RLS), encrypted storage buckets, and dedicated pgvector.",
        icon: Database,
        spec: "Supabase AES-256",
      },
    ],
  },
  {
    id: "gcp",
    name: "Google Cloud Platform (GCP)",
    region: "us-central1 (Iowa) / Private VPC",
    sla: "99.99% Guaranteed",
    latency: "< 16ms",
    desc: "Dedicated Google Cloud VPC provisioned with isolated Compute Engine nodes and Supabase dedicated PostgreSQL storage.",
    nodes: [
      {
        title: "Google Cloud Armor & Edge Gateway",
        tech: "Global HTTPS Load Balancer",
        detail: "Enterprise domain mapping with managed TLS certificates and Google Workspace SAML authentication.",
        icon: Network,
        spec: "Sub-millisecond Edge",
      },
      {
        title: "High-Throughput Analytics Cluster",
        tech: "Single-Tenant Compute Engine",
        detail: "Dedicated vCPU instances executing parallel regression analysis and schema discovery.",
        icon: Cpu,
        spec: "32 vCPUs Dedicated",
      },
      {
        title: "SpreadsheetML Compiler Cluster",
        tech: "Office XML Generation Node",
        detail: "Compiles multi-tab living Microsoft Excel files with native formula injection in memory.",
        icon: Layers,
        spec: "< 450ms / Workbook",
      },
      {
        title: "Supabase Cloud Storage & Auth",
        tech: "Dedicated Supabase Instance",
        detail: "Isolated Supabase database and file storage with customer-managed encryption keys (CMEK).",
        icon: Database,
        spec: "Supabase RLS",
      },
    ],
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    region: "East US / Dedicated VNet",
    sla: "99.99% Guaranteed",
    latency: "< 22ms",
    desc: "Single-tenant Azure Virtual Network integrating directly with Microsoft Entra ID (Azure AD) and Supabase enterprise storage.",
    nodes: [
      {
        title: "Azure Front Door & Entra SSO",
        tech: "Microsoft Entra ID SAML 2.0",
        detail: "Seamless enterprise Active Directory authentication and role-based access management.",
        icon: Network,
        spec: "Azure AD Native",
      },
      {
        title: "Dedicated Analytical Virtual Machines",
        tech: "Azure Dsv5 Compute Series",
        detail: "Isolated analytical execution with nested virtualization and fast SIMD execution.",
        icon: Cpu,
        spec: "64 GB High-Memory",
      },
      {
        title: "Automated Dispatch & Notification Queue",
        tech: "Azure Service Bus & SMTP Queue",
        detail: "Autonomous scheduling pipeline that sends executive briefings and Excel reports on schedule.",
        icon: Zap,
        spec: "100% Delivery SLA",
      },
      {
        title: "Supabase Private Storage Plane",
        tech: "Dedicated Supabase PostgreSQL",
        detail: "Completely private networking connected via Azure Private Link with zero public internet egress.",
        icon: Database,
        spec: "Supabase Private",
      },
    ],
  },
  {
    id: "onprem",
    name: "On-Premise Air-Gapped Deployment",
    region: "Customer Datacenter / Bare Metal",
    sla: "Self-Managed / Custom SLA",
    latency: "Local LAN (< 1ms)",
    desc: "For defense, healthcare, and banking institutions requiring 100% offline air-gapped deployment with dedicated local Supabase storage.",
    nodes: [
      {
        title: "Offline Local Reverse Proxy",
        tech: "Internal NGINX / HAProxy",
        detail: "Terminates within your corporate intranet with internal Root CA certificates.",
        icon: Network,
        spec: "Zero WAN Access",
      },
      {
        title: "Air-Gapped Container Cluster",
        tech: "Air-Gapped OCI Container Stack",
        detail: "Runs entirely on your bare-metal servers or VMware vSphere cluster without internet dependencies.",
        icon: Server,
        spec: "Offline Containers",
      },
      {
        title: "Local Deterministic Math Core",
        tech: "IEEE-754 Arithmetic Engine",
        detail: "Local high-performance mathematical modeling and living Excel SpreadsheetML compilation.",
        icon: Cpu,
        spec: "100% Local Inference",
      },
      {
        title: "Self-Hosted Supabase Storage",
        tech: "Self-Hosted Supabase / PostgreSQL",
        detail: "All database tables, files, and auth records stay strictly inside your physical server racks.",
        icon: Database,
        spec: "Supabase Self-Hosted",
      },
    ],
  },
]

export function ArchitectureSection() {
  const [activeProviderId, setActiveProviderId] = useState<string>("aws")

  const currentProvider =
    PROVIDERS.find((p) => p.id === activeProviderId) || PROVIDERS[0]

  return (
    <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ── SECTION HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Private VPC &amp;{" "}
            <span className="text-emerald-600">Single-Tenant Architecture.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            When you rent Data Insight, you get a dedicated, physically isolated cloud infrastructure
            deployed inside your preferred cloud provider or on-premise datacenter with Supabase storage.
          </p>

          {/* Cloud Provider Tabs with Brand Emerald Colors */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold">
            {PROVIDERS.map((provider) => {
              const isSelected = activeProviderId === provider.id
              return (
                <button
                  key={provider.id}
                  onClick={() => setActiveProviderId(provider.id)}
                  className={`px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981] shadow-md shadow-emerald-500/25 font-bold ring-2 ring-emerald-500/30"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {provider.name}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── INTERACTIVE TOPOLOGY DIAGRAM ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProvider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-9 rounded-2xl bg-slate-50 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8"
          >
            {/* Environment Overview Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-950">{currentProvider.name} Instance</h3>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl">{currentProvider.desc}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Region</span>
                  <span className="font-bold text-slate-900">{currentProvider.region.split("/")[0]}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Uptime SLA</span>
                  <span className="font-bold text-emerald-700">{currentProvider.sla}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Internal Latency</span>
                  <span className="font-bold text-slate-900">{currentProvider.latency}</span>
                </div>
              </div>
            </div>

            {/* 4 Topology Execution Nodes */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {currentProvider.nodes.map((node, i) => {
                const Icon = node.icon
                return (
                  <motion.div
                    key={node.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {node.spec}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-950">{node.title}</h4>
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold block mt-0.5">
                          {node.tech}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {node.detail}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Zero Public Data Transit</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Architecture Guarantees Strip */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Single-Tenant Isolation: Supabase dedicated storage with zero multi-tenant data bleed.</span>
              </div>
              <span className="text-emerald-800 font-mono font-bold">Dedicated Supabase &amp; Compute</span>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
