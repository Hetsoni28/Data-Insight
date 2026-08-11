"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/molecules/InvoiceStatusBadge"
import { Button } from "@/components/ui/button"
import { Download, CreditCard, FileText } from "lucide-react"

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "•"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white">Contract Invoices & Statements</CardTitle>
              <CardDescription className="text-xs font-medium">
                View, pay, and download tax receipts for your dedicated database and system rental invoices.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl shadow-sm mb-3">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No invoices generated yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-medium">
                Your billing invoices will appear here once the billing cycle settlement is generated.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                  <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                    <TableHead className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Invoice Date</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Billing Period</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-medium">
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-colors">
                      <TableCell className="font-extrabold text-slate-900 dark:text-white">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {formatDate(invoice.periodStart)} • {formatDate(invoice.periodEnd)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== "paid" && onPay && (
                            <Button
                              size="sm"
                              onClick={() => onPay(invoice.id)}
                              disabled={isPaying === invoice.id}
                              className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                              {isPaying === invoice.id ? "Loading..." : "Pay Now"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(invoice.id)}
                            disabled={isDownloading === invoice.id || invoice.status !== "paid"}
                            className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 text-xs font-extrabold rounded-xl transition-all"
                          >
                            {isDownloading === invoice.id ? (
                              <span className="animate-pulse">Loading...</span>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 mr-1.5" />
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
    </motion.div>
  )
}
