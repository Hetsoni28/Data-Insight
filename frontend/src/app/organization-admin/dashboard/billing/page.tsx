"use client"
import dynamic from "next/dynamic"

import { useState, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import {
  Loader2, RefreshCw, Database, ShieldCheck,
  Layers, DollarSign, History, TrendingUp, LayoutGrid
} from "lucide-react"

import { billingService } from "@/lib/billing.service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"



// ── Organisms ─────────────────────────────────────────────────────────────────

// ── Skeleton loader ───────────────────────────────────────────────────────────
function BillingPageSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}

// ── Tab Trigger Helper ────────────────────────────────────────────────────────
function TabTrigger({ value, icon: Icon, label, badge }: {
  value: string; icon: any; label: string; badge?: number
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-xl text-xs md:text-sm font-extrabold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all px-3 md:px-4 py-2 flex items-center gap-1.5"
    >
      <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="inline sm:hidden">{label.split(" ")[0]}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 rounded-full bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 font-black leading-none">
          {badge}
        </span>
      )}
    </TabsTrigger>
  )
}

// ── Main billing content (uses TanStack Query) ────────────────────────────────
function BillingContent() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestModalType, setRequestModalType] = useState<
    "storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom"
  >("storage")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  // Handle Stripe redirect params
  useEffect(() => {
    const payment = searchParams?.get("payment")
    const billing = searchParams?.get("billing")
    if (payment === "success" || billing === "success")
      toast.success("Payment received! Your invoice has been updated.")
    else if (payment === "cancelled" || billing === "cancelled")
      toast.info("Payment session was cancelled.")
  }, [searchParams])

  // ── TanStack Queries — each section loads independently ───────────────────
  const summary = useQuery({
    queryKey: ["org-billing-summary"],
    queryFn: billingService.getSummary,
    staleTime: 60_000,
  })

  const usage = useQuery({
    queryKey: ["org-billing-usage"],
    queryFn: billingService.getUsage,
    staleTime: 30_000,
    refetchInterval: 120_000, // auto-refresh every 2 min
  })

  const resources = useQuery({
    queryKey: ["org-billing-resources"],
    queryFn: billingService.getResources,
    staleTime: 60_000,
  })

  const costs = useQuery({
    queryKey: ["org-billing-costs"],
    queryFn: billingService.getCosts,
    staleTime: 60_000,
  })

  const contract = useQuery({
    queryKey: ["org-billing-contract"],
    queryFn: billingService.getContract,
    staleTime: 300_000,
  })

  const plans = useQuery({
    queryKey: ["org-billing-plans"],
    queryFn: billingService.getPlans,
    staleTime: 300_000,
  })

  const requests = useQuery({
    queryKey: ["org-billing-requests"],
    queryFn: billingService.getResourceRequests,
    staleTime: 30_000,
  })

  const invoices = useQuery({
    queryKey: ["org-billing-invoices", 1],
    queryFn: () => billingService.getInvoices(1, 10),
    staleTime: 60_000,
  })

  const payments = useQuery({
    queryKey: ["org-billing-payments", paymentsPage],
    queryFn: () => billingService.getPayments(paymentsPage),
    staleTime: 30_000,
  })

  // ── Portal mutation ────────────────────────────────────────────────────────
  const portalMutation = useMutation({
    mutationFn: billingService.openPortal,
    onSuccess: ({ portal_url }) => {
      if (portal_url) window.location.href = portal_url
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail || "Could not open billing portal."),
  })

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["org-billing-"] })
    toast.success("Billing data refreshed.")
  }

  const handleDownloadInvoice = async (id: string) => {
    setDownloadingId(id)
    try {
      const { pdfUrl } = await billingService.getInvoicePdf(id)
      pdfUrl ? window.open(pdfUrl, "_blank") : toast.info("Invoice PDF is being generated.")
    } catch { toast.error("Failed to retrieve invoice PDF.") }
    finally { setDownloadingId(null) }
  }

  const handlePayInvoice = async (id: string) => {
    setPayingId(id)
    try {
      const { checkout_url } = await billingService.payInvoice(id)
      if (checkout_url) window.location.href = checkout_url
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to initiate payment.")
    } finally { setPayingId(null) }
  }

  const handleOpenExpansionModal = (
    type: "storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom" = "storage"
  ) => {
    setRequestModalType(type)
    setIsRequestModalOpen(true)
  }

  // Show skeleton only for the hero (summary)
  if (summary.isLoading) return <BillingPageSkeleton />

  if (summary.isError || !summary.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-slate-500 text-sm">Failed to load billing data.</p>
        <Button variant="outline" onClick={() => summary.refetch()} className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  const isRefreshing =
    summary.isFetching || usage.isFetching || resources.isFetching ||
    costs.isFetching || contract.isFetching

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto min-h-screen"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Billing & Resource Rental Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Authoritative management of your dedicated system rental contract, resources, and invoices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="rounded-xl border-slate-200/80 dark:border-white/10 text-xs font-bold w-fit hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <BillingHero
        summary={summary.data}
        contract={contract.data ?? null}
        onOpenPortal={() => portalMutation.mutate()}
        onRequestCapacity={() => handleOpenExpansionModal("storage")}
        isPortalLoading={portalMutation.isPending}
      />

      {/* ── Live Usage Meters (always visible, above tabs) ────────────────── */}
      {usage.data ? (
        <BillingUsageMeters usage={usage.data} />
      ) : usage.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : null}

      {/* ── Tabbed Sections ───────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl flex flex-wrap h-auto gap-1">
          <TabTrigger value="overview"  icon={Database}    label="Rented Resources" />
          <TabTrigger value="contract"  icon={ShieldCheck} label="Contract & SLA" />
          <TabTrigger value="plans"     icon={LayoutGrid}  label="Plans" />
          <TabTrigger value="requests"  icon={Layers}      label="Capacity Requests" badge={requests.data?.length} />
          <TabTrigger value="invoices"  icon={DollarSign}  label="Invoices" />
          <TabTrigger value="activity"  icon={History}     label="Audit Ledger" />
        </TabsList>

        {/* Tab 1: Overview — Resources + Costs */}
        <TabsContent value="overview" className="space-y-6">
          {resources.isLoading ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : resources.data ? (
            <RentedSystemOverview
              resources={resources.data}
              onRequestExpansion={handleOpenExpansionModal}
            />
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">Failed to load resources.</div>
          )}
          {costs.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : costs.data ? (
            <CostBreakdownCard
              costs={costs.data}
              onOpenPortal={() => portalMutation.mutate()}
            />
          ) : null}
        </TabsContent>

        {/* Tab 2: Contract & SLA */}
        <TabsContent value="contract" className="space-y-6">
          {contract.isLoading ? (
            <Skeleton className="h-80 w-full rounded-2xl" />
          ) : contract.data ? (
            <ContractDetailsCard contract={contract.data} />
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">No contract data found.</div>
          )}
        </TabsContent>

        {/* Tab 3: Plans */}
        <TabsContent value="plans" className="space-y-6">
          {plans.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[520px] w-full rounded-2xl" />
              <Skeleton className="h-[520px] w-full rounded-2xl" />
            </div>
          ) : plans.data ? (
            <BillingPlansTab catalog={plans.data} />
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">Failed to load plans.</div>
          )}
        </TabsContent>

        {/* Tab 4: Capacity Requests */}
        <TabsContent value="requests" className="space-y-6">
          <ResourceRequestCenter
            requests={requests.data ?? []}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["org-billing-requests"] })}
            isOpen={isRequestModalOpen}
            onOpenChange={setIsRequestModalOpen}
            initialType={requestModalType}
          />
        </TabsContent>

        {/* Tab 5: Invoices */}
        <TabsContent value="invoices" className="space-y-6">
          {invoices.isLoading ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : (
            <InvoiceHistoryTable
              invoices={invoices.data?.items ?? []}
              onDownload={handleDownloadInvoice}
              onPay={handlePayInvoice}
              isDownloading={downloadingId}
              isPaying={payingId}
            />
          )}
        </TabsContent>

        {/* Tab 6: Audit Ledger */}
        <TabsContent value="activity" className="space-y-6">
          <PaymentHistoryTable
            payments={payments.data ?? null}
            page={paymentsPage}
            onPageChange={setPaymentsPage}
            isLoading={payments.isLoading}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ── Page Export ───────────────────────────────────────────────────────────────
const BillingHero = dynamic(() => import('@/components/organisms/billing/BillingHero').then(m => m.BillingHero), { ssr: false })
const RentedSystemOverview = dynamic(() => import('@/components/organisms/billing/RentedSystemOverview').then(m => m.RentedSystemOverview), { ssr: false })
const CostBreakdownCard = dynamic(() => import('@/components/organisms/billing/CostBreakdownCard').then(m => m.CostBreakdownCard), { ssr: false })
const ContractDetailsCard = dynamic(() => import('@/components/organisms/billing/ContractDetailsCard').then(m => m.ContractDetailsCard), { ssr: false })
const ResourceRequestCenter = dynamic(() => import('@/components/organisms/billing/ResourceRequestCenter').then(m => m.ResourceRequestCenter), { ssr: false })
const PaymentHistoryTable = dynamic(() => import('@/components/organisms/billing/PaymentHistoryTable').then(m => m.PaymentHistoryTable), { ssr: false })
const BillingUsageMeters = dynamic(() => import('@/components/organisms/billing/BillingUsageMeters').then(m => m.BillingUsageMeters), { ssr: false })
const BillingPlansTab = dynamic(() => import('@/components/organisms/billing/BillingPlansTab').then(m => m.BillingPlansTab), { ssr: false })
const InvoiceHistoryTable = dynamic(() => import('@/components/organisms/InvoiceHistoryTable').then(m => m.InvoiceHistoryTable), { ssr: false })

export default function OrgBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
