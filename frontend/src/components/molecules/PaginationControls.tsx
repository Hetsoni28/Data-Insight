import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    pageSizeOptions = [10, 25, 50, 100]
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
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 py-4 px-4 sm:px-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-b-lg w-full">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                {pageSizeOptions.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size} className="bg-white dark:bg-card text-slate-900 dark:text-slate-100">{size}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="whitespace-nowrap text-xs sm:text-sm">
                    Showing <span className="font-medium text-slate-900 dark:text-slate-100">{totalItems === 0 ? 0 : startItem}</span> to <span className="font-medium text-slate-900 dark:text-slate-100">{endItem}</span> of <span className="font-medium text-slate-900 dark:text-slate-100">{totalItems}</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
                    onClick={handlePrev}
                    disabled={safeCurrentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((num, i) => (
                        num === -1 ? (
                            <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400">
                                <MoreHorizontal className="h-4 w-4 mx-auto" />
                            </span>
                        ) : (
                            <Button
                                key={num}
                                variant={safeCurrentPage === num ? "default" : "outline"}
                                className={`h-8 w-8 rounded-md p-0 ${
                                    safeCurrentPage === num 
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" 
                                        : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                                }`}
                                onClick={() => onPageChange(num)}
                            >
                                {num}
                            </Button>
                        )
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
                    onClick={handleNext}
                    disabled={safeCurrentPage === safeTotalPages || totalItems === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
