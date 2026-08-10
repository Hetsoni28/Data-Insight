"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/molecules/InvoiceStatusBadge"
import { Button } from "@/components/ui/button"
import { Download, CreditCard, ExternalLink } from "lucide-react"

export interface InvoiceData {
  id: string
  stripeInvoiceId: string
  amount: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  periodStart: string | null
  periodEnd: string | null
  invoiceDate: string | null
}

interface InvoiceHistoryTableProps {
  invoices: InvoiceData[]
  onDownload: (id: string) => void
  onPay?: (id: string) => void
  isDownloading: string | null
  isPaying?: string | null
}

export function InvoiceHistoryTable({
  invoices,
  onDownload,
  onPay,
  isDownloading,
  isPaying
}: InvoiceHistoryTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    // Check if amount is in dollars or cents (if > 100000 and has no decimals, might be cents, but our DB stores floats like 12500.0)
    const val = amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F17] shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Contract Invoices & Statements</CardTitle>
        <CardDescription className="text-xs">
          View, pay, and download tax receipts for your dedicated database and system rental invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5/30">
            <div className="p-3 bg-white dark:bg-white/5 rounded-full shadow-sm mb-3">
              <Download className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">No invoices generated yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Your billing invoices will appear here once the billing cycle settlement is generated.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-white/5">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Invoice Date</TableHead>
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Billing Period</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(invoice.invoiceDate)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status !== "paid" && onPay && (
                          <Button
                            size="sm"
                            onClick={() => onPay(invoice.id)}
                            disabled={isPaying === invoice.id}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            {isPaying === invoice.id ? "Loading..." : "Pay Now"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(invoice.id)}
                          disabled={isDownloading === invoice.id || invoice.status !== "paid"}
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 text-xs font-medium"
                        >
                          {isDownloading === invoice.id ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
