"use client"

import React from "react"
import { motion } from "framer-motion"
import { History, ChevronLeft, ChevronRight } from "lucide-react"
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
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">Payment Settled</Badge>
      case "checkout_started":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">Checkout</Badge>
      case "resource_request_submitted":
        return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">Capacity Request</Badge>
      case "portal_opened":
        return <Badge variant="secondary" className="font-bold">Portal Access</Badge>
      default:
        return <Badge variant="outline" className="font-bold">{eventType.replace(/_/g, " ")}</Badge>
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                Billing Activity & Audit Trail
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Immutable ledger of payment settlements, capacity requests, and contract operations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {(!payments || payments.items.length === 0) ? (
            <div className="p-12 text-center rounded-2xl bg-slate-50/50 dark:bg-white/5 border-2 border-dashed border-slate-200/80 dark:border-white/10">
              <History className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No billing activity logged</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Events such as invoice payments, contract updates, and capacity adjustments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                    <tr className="text-slate-700 dark:text-slate-300 uppercase font-extrabold tracking-wider">
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {payments.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getEventBadge(item.eventType)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {payments.pages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Page {payments.page} of {payments.pages} ({payments.total} events)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isLoading}
                      onClick={() => onPageChange(page - 1)}
                      className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 dark:border-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= payments.pages || isLoading}
                      onClick={() => onPageChange(page + 1)}
                      className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 dark:border-white/10"
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
    </motion.div>
  )
}
