﻿"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  RefreshCw,
  Layers,
  FileText,
  DollarSign,
  History,
  ShieldCheck,
  CheckCircle2,
  Database
} from "lucide-react"

import {
  billingService,
  BillingSummary,
  RentalContractData,
  RentedResourcesData,
  CostBreakdownData,
  ResourceRequestItem,
  InvoicePage,
  PaymentPage,
} from "@/lib/billing.service"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

// Organism Components
import { BillingHero } from "@/components/organisms/billing/BillingHero"
import { RentedSystemOverview } from "@/components/organisms/billing/RentedSystemOverview"
import { CostBreakdownCard } from "@/components/organisms/billing/CostBreakdownCard"
import { ResourceRequestCenter } from "@/components/organisms/billing/ResourceRequestCenter"
import { ContractDetailsCard } from "@/components/organisms/billing/ContractDetailsCard"
import { PaymentHistoryTable } from "@/components/organisms/billing/PaymentHistoryTable"
import { InvoiceHistoryTable } from "@/components/organisms/InvoiceHistoryTable"

function BillingContent() {
  const searchParams = useSearchParams()

  // State
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [contract, setContract] = useState<RentalContractData | null>(null)
  const [resources, setResources] = useState<RentedResourcesData | null>(null)
  const [costs, setCosts] = useState<CostBreakdownData | null>(null)
  const [resourceRequests, setResourceRequests] = useState<ResourceRequestItem[]>([])
  const [invoices, setInvoices] = useState<InvoicePage | null>(null)
  const [payments, setPayments] = useState<PaymentPage | null>(null)

  // Loading flags
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState<string | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(1)

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestModalType, setRequestModalType] = useState<"storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom">("storage")

  // Handle URL query parameters from Stripe redirect
  useEffect(() => {
    const paymentStatus = searchParams?.get("payment")
    const billingStatus = searchParams?.get("billing")

    if (paymentStatus === "success" || billingStatus === "success") {
      toast.success("Payment received! Your invoice status has been updated.")
    } else if (paymentStatus === "cancelled" || billingStatus === "cancelled") {
      toast.info("Payment session was cancelled.")
    }
  }, [searchParams])

  // Fetch all authoritative billing data
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [sumRes, contractRes, resourcesRes, costsRes, requestsRes, invRes, payRes] = await Promise.all([
        billingService.getSummary(),
        billingService.getContract(),
        billingService.getResources(),
        billingService.getCosts(),
        billingService.getResourceRequests(),
        billingService.getInvoices(1, 10),
        billingService.getPayments(paymentsPage),
      ])

      setSummary(sumRes)
      setContract(contractRes)
      setResources(resourcesRes)
      setCosts(costsRes)
      setResourceRequests(requestsRes)
      setInvoices(invRes)
      setPayments(payRes)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to load billing & rental data.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [paymentsPage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Actions
  const handleOpenPortal = async () => {
    setIsPortalLoading(true)
    try {
      const { portal_url } = await billingService.openPortal()
      if (portal_url) {
        window.location.href = portal_url
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not open Stripe Customer Portal.")
    } finally {
      setIsPortalLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    setIsDownloading(invoiceId)
    try {
      const { pdfUrl } = await billingService.getInvoicePdf(invoiceId)
      if (pdfUrl) {
        window.open(pdfUrl, "_blank")
      } else {
        toast.info("Invoice receipt is being generated.")
      }
    } catch (err: any) {
      toast.error("Failed to retrieve invoice PDF.")
    } finally {
      setIsDownloading(null)
    }
  }

  const handlePayInvoice = async (invoiceId: string) => {
    setIsPaying(invoiceId)
    try {
      const { checkout_url } = await billingService.payInvoice(invoiceId)
      if (checkout_url) {
        window.location.href = checkout_url
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to initiate invoice payment.")
    } finally {
      setIsPaying(null)
    }
  }

  const handleOpenExpansionModal = (type: "storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom" = "storage") => {
    setRequestModalType(type)
    setIsRequestModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto min-h-screen text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Billing & Resource Rental Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authoritative management of your dedicated single-tenant database, system rental contract, resource allocations, and invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-sm w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Hero Banner Component (Emerald #133E2E) */}
      <BillingHero
        summary={summary}
        contract={contract}
        onOpenPortal={handleOpenPortal}
        onRequestCapacity={() => handleOpenExpansionModal("storage")}
        isPortalLoading={isPortalLoading}
      />

      {/* Tabbed Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <TabsTrigger value="overview" className="rounded-xl text-xs md:text-sm font-semibold">
            <Database className="h-4 w-4 mr-2" />
            Rented Resources
          </TabsTrigger>
          <TabsTrigger value="contract" className="rounded-xl text-xs md:text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Contract & SLA
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-xl text-xs md:text-sm font-semibold">
            <Layers className="h-4 w-4 mr-2" />
            Capacity Requests
            {resourceRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 font-bold">
                {resourceRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-xl text-xs md:text-sm font-semibold">
            <DollarSign className="h-4 w-4 mr-2" />
            Invoices & Statements
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl text-xs md:text-sm font-semibold">
            <History className="h-4 w-4 mr-2" />
            Audit Ledger
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Resources */}
        <TabsContent value="overview" className="space-y-6">
          <RentedSystemOverview
            resources={resources}
            onRequestExpansion={handleOpenExpansionModal}
          />
          <CostBreakdownCard
            costs={costs}
            onOpenPortal={handleOpenPortal}
          />
        </TabsContent>

        {/* Tab 2: Contract Details & SLA */}
        <TabsContent value="contract" className="space-y-6">
          <ContractDetailsCard contract={contract} />
        </TabsContent>

        {/* Tab 3: Resource Capacity Requests */}
        <TabsContent value="requests" className="space-y-6">
          <ResourceRequestCenter
            requests={resourceRequests}
            onRefresh={() => fetchData(true)}
            isOpen={isRequestModalOpen}
            onOpenChange={setIsRequestModalOpen}
            initialType={requestModalType}
          />
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices" className="space-y-6">
          <InvoiceHistoryTable
            invoices={invoices?.items || []}
            onDownload={handleDownloadInvoice}
            onPay={handlePayInvoice}
            isDownloading={isDownloading}
            isPaying={isPaying}
          />
        </TabsContent>

        {/* Tab 5: Audit Activity Ledger */}
        <TabsContent value="activity" className="space-y-6">
          <PaymentHistoryTable
            payments={payments}
            page={paymentsPage}
            onPageChange={(p) => setPaymentsPage(p)}
            isLoading={isRefreshing}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
