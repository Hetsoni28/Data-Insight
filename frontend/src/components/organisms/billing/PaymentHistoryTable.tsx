"use client"

import React from "react"
import { History, CheckCircle2, ArrowRight, Shield, CreditCard, ChevronLeft, ChevronRight } from "lucide-react"
import { PaymentPage } from "@/lib/billing.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PaymentHistoryTableProps {
  payments: PaymentPage | null
  page: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

export function PaymentHistoryTable({
  payments,
  page,
  onPageChange,
  isLoading
}: PaymentHistoryTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "invoice_settled_online":
      case "payment_succeeded":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Payment Settled</Badge>
      case "checkout_started":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Checkout</Badge>
      case "resource_request_submitted":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">Capacity Request</Badge>
      case "portal_opened":
        return <Badge variant="secondary">Portal Access</Badge>
      default:
        return <Badge variant="outline">{eventType.replace(/_/g, " ")}</Badge>
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <History className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Billing Activity & Audit Trail
            </CardTitle>
            <CardDescription className="text-xs">
              Immutable ledger of payment settlements, capacity requests, and contract operations.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {(!payments || payments.items.length === 0) ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
            <History className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No billing activity logged</p>
            <p className="text-xs text-slate-500 mt-1">
              Events such as invoice payments, contract updates, and capacity adjustments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {payments.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {getEventBadge(item.eventType)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3 text-right text-slate-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {payments.pages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Page {payments.page} of {payments.pages} ({payments.total} events)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => onPageChange(page - 1)}
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= payments.pages || isLoading}
                    onClick={() => onPageChange(page + 1)}
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
