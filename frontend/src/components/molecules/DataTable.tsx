import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({ 
  columns, 
  data, 
  emptyMessage = "No data available.",
  className
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden bg-slate-50/50 shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/60 dark:border-white/10">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-6 py-4 whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white dark:bg-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.05 }}
                  key={row.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={cn("px-6 py-4", col.className)}>
                      {col.cell 
                        ? col.cell(row) 
                        : col.accessorKey 
                          ? (row[col.accessorKey] as React.ReactNode) 
                          : null}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
