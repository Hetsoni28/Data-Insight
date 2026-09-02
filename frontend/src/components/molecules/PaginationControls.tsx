import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
}

export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 25, 50, 100]
}: PaginationControlsProps) {
    
    // Ensure we don't go out of bounds
    const safeTotalPages = Math.max(1, totalPages);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
    
    const startItem = (safeCurrentPage - 1) * pageSize + 1;
    const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

    const handlePrev = () => {
        if (safeCurrentPage > 1) onPageChange(safeCurrentPage - 1);
    };

    const handleNext = () => {
        if (safeCurrentPage < safeTotalPages) onPageChange(safeCurrentPage + 1);
    };

    // Calculate visible page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (safeTotalPages <= maxVisible) {
            for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
        } else {
            if (safeCurrentPage <= 3) {
                pages.push(1, 2, 3, 4, -1, safeTotalPages);
            } else if (safeCurrentPage >= safeTotalPages - 2) {
                pages.push(1, -1, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
            } else {
                pages.push(1, -1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, -1, safeTotalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-y-6 gap-x-6 py-5 px-6 border-t border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-b-3xl w-full">
            
            {/* Left side: Page Size & Info */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400">
                {pageSizeOptions.length > 1 && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 py-1 px-3 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm">
                        <span className="whitespace-nowrap font-medium text-xs">Rows per page</span>
                        <Select 
                            value={pageSize.toString()} 
                            onValueChange={(val) => onPageSizeChange(Number(val))}
                        >
                            <SelectTrigger className="h-7 w-[70px] bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold focus:ring-emerald-500">
                                <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                                {pageSizeOptions.map(size => (
                                    <SelectItem key={size} value={size.toString()} className="text-xs font-medium cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-500/20 focus:text-emerald-700 dark:focus:text-emerald-400">
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                <div className="whitespace-nowrap text-xs font-medium px-2">
                    Showing <span className="font-bold text-slate-900 dark:text-white px-0.5">{totalItems === 0 ? 0 : startItem}</span> 
                    to <span className="font-bold text-slate-900 dark:text-white px-0.5">{endItem}</span> 
                    of <span className="font-bold text-slate-900 dark:text-white px-0.5">{totalItems}</span>
                </div>
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    onClick={handlePrev}
                    disabled={safeCurrentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </Button>
                
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50/80 dark:bg-black/20 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner">
                    {getPageNumbers().map((num, i) => (
                        num === -1 ? (
                            <span key={`ellipsis-${i}`} className="w-8 flex items-center justify-center text-slate-400">
                                <MoreHorizontal className="h-4 w-4" />
                            </span>
                        ) : (
                            <div key={`page-${num}`} className="relative h-8 w-8">
                                {safeCurrentPage === num && (
                                    <motion.div
                                        layoutId="activePageBubble"
                                        className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg shadow-md shadow-emerald-500/20"
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    />
                                )}
                                <button
                                    onClick={() => onPageChange(num)}
                                    className={`relative z-10 w-full h-full flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                        safeCurrentPage === num 
                                            ? "text-white" 
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10"
                                    }`}
                                >
                                    {num}
                                </button>
                            </div>
                        )
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                    onClick={handleNext}
                    disabled={safeCurrentPage === safeTotalPages || totalItems === 0}
                >
                    <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </Button>
            </div>
        </div>
    );
}
