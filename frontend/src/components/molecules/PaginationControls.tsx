"use client";
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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

    const getPageNumbers = () => {
        const pages: number[] = [];
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

    const NavButton = ({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.35 : 1,
                transition: 'all 0.15s ease',
                color: '#475569',
            }}
            onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = '#10b981'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.08)'; }}
        >
            {children}
        </button>
    );

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '16px 20px',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                background: 'rgba(248,250,252,0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0 0 20px 20px',
                width: '100%',
            }}
        >
            {/* Left: rows per page + info */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {pageSizeOptions.length > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'white',
                        padding: '4px 10px 4px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Rows per page</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(val) => onPageSizeChange(Number(val))}
                        >
                            <SelectTrigger className="h-7 w-[58px] border-0 shadow-none bg-transparent text-xs font-bold text-slate-700 focus:ring-0 focus:ring-offset-0 px-1">
                                <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                {pageSizeOptions.map(size => (
                                    <SelectItem key={size} value={size.toString()} className="text-xs font-semibold cursor-pointer focus:bg-emerald-50 focus:text-emerald-700">
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    Showing{' '}
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalItems === 0 ? 0 : startItem}</span>
                    {' '}to{' '}
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{endItem}</span>
                    {' '}of{' '}
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalItems}</span>
                </div>
            </div>

            {/* Right: prev / pages / next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <NavButton onClick={handlePrev} disabled={safeCurrentPage === 1}>
                    <ChevronLeft size={16} />
                </NavButton>

                {/* Page pill track */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(241,245,249,0.9)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.07)',
                }}>
                    {getPageNumbers().map((num, i) =>
                        num === -1 ? (
                            <span key={`ellipsis-${i}`} style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <MoreHorizontal size={14} />
                            </span>
                        ) : (
                            <button
                                key={`page-${num}`}
                                onClick={() => onPageChange(num)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: safeCurrentPage === num
                                        ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                                        : 'transparent',
                                    color: safeCurrentPage === num ? 'white' : '#64748b',
                                    boxShadow: safeCurrentPage === num
                                        ? '0 4px 12px rgba(16,185,129,0.35), 0 1px 3px rgba(16,185,129,0.2)'
                                        : 'none',
                                    transform: safeCurrentPage === num ? 'scale(1.05)' : 'scale(1)',
                                }}
                                onMouseEnter={e => {
                                    if (safeCurrentPage !== num) {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)';
                                        (e.currentTarget as HTMLElement).style.color = '#0f172a';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (safeCurrentPage !== num) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLElement).style.color = '#64748b';
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {num}
                            </button>
                        )
                    )}
                </div>

                <NavButton onClick={handleNext} disabled={safeCurrentPage === safeTotalPages || totalItems === 0}>
                    <ChevronRight size={16} />
                </NavButton>
            </div>
        </div>
    );
}
