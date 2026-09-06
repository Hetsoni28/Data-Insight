import React, { useState } from 'react';

/* global document */

export interface WorkbookReportPanelProps {
  report: {
    title: string;
    generated_at: string;
    dataset_name: string;
    sections: Array<{ heading: string; content: string; data?: any }>;
    actions: Array<object>;
  };
  onClose: () => void;
  onInsertCharts: (actions: object[]) => Promise<void>;
}

const getSectionIcon = (heading: string) => {
  if (heading.includes('Executive Summary')) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16l3-4 3 3 3-5 2 3"/></svg>
  );
  if (heading.includes('Metrics')) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  );
  if (heading.includes('Trends')) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  );
  if (heading.includes('Recommendations')) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  );
};

const S = {
  container: {
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    padding: '14px 14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flexShrink: 0,
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'white',
    marginBottom: '4px',
    width: 'fit-content',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'white',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  headerMeta: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.8)',
    margin: 0,
  },
  body: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    transition: 'background-color 0.1s',
  },
  sectionHeaderOpen: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  chevron: (open: boolean) => ({
    width: '14px',
    height: '14px',
    color: '#94A3B8',
    transition: 'transform 0.2s',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0,
  }),
  sectionBody: {
    padding: '12px',
    borderLeft: '3px solid #10B981',
  },
  sectionContent: {
    fontSize: '11px',
    color: '#334155',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    padding: '10px 12px',
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  btnPrimary: {
    flex: 1,
    height: '34px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
  },
  btnSecondary: {
    height: '34px',
    backgroundColor: 'transparent',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 14px',
  },
  emptyContent: {
    fontSize: '11px',
    color: '#94A3B8',
    fontStyle: 'italic',
    padding: '4px 0',
  },
};

export const WorkbookReportPanel: React.FC<WorkbookReportPanelProps> = ({ report, onClose, onInsertCharts }) => {
  const [openSections, setOpenSections] = useState<Set<number>>(
    new Set(report.sections.map((_, i) => i))
  );
  const [inserting, setInserting] = useState(false);
  const [insertDone, setInsertDone] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);

  const toggleSection = (i: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleInsert = async () => {
    setInserting(true);
    setInsertError(null);
    try {
      await onInsertCharts(report.actions);
      setInsertDone(true);
    } catch (e: any) {
      setInsertError(e?.message || 'Failed to insert charts. Please try again.');
    }
    setInserting(false);
  };

  const formattedDate = (() => {
    try {
      return new Date(report.generated_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return report.generated_at;
    }
  })();

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerBadge}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          AI ANALYSIS REPORT
        </div>
        <h2 style={S.headerTitle}>{report.title || 'Workbook Analysis'}</h2>
        <p style={S.headerMeta}>Dataset: <strong>{report.dataset_name}</strong></p>
        <p style={S.headerMeta}>Generated: {formattedDate}</p>
      </div>

      {/* Sections */}
      <div style={S.body}>
        {report.sections.map((section, i) => {
          const isOpen = openSections.has(i);
          const iconNode = getSectionIcon(section.heading);
          const hasContent = section.content && section.content.trim().length > 3;

          return (
            <div key={i} style={S.sectionCard}>
              <div
                style={{ ...S.sectionHeader, ...(isOpen ? S.sectionHeaderOpen : {}) }}
                onClick={() => toggleSection(i)}
              >
                <div style={S.sectionTitle}>
                  <div style={{ color: '#059669', display: 'flex' }}>{iconNode}</div>
                  <span>{section.heading}</span>
                </div>
                <svg style={S.chevron(isOpen)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isOpen && (
                <div style={S.sectionBody}>
                  {hasContent
                    ? <div
                        style={S.sectionContent}
                        dangerouslySetInnerHTML={{
                          __html: section.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }}
                      />
                    : <p style={S.emptyContent}>No content generated for this section.</p>
                  }
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {report.sections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '12px' }}>
            No sections were generated. Please try again.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ flexShrink: 0 }}>

        {/* Insert success banner */}
        {insertDone && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#ECFDF5',
            borderTop: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#059669',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Chart{report.actions.length > 1 ? 's' : ''} inserted into your workbook successfully!
          </div>
        )}

        {/* Insert error banner */}
        {insertError && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            borderTop: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#DC2626',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {insertError}
          </div>
        )}

        <div style={S.footer}>
          {report.actions && report.actions.length > 0 && !insertDone && (
            <button
              style={{
                ...S.btnPrimary,
                opacity: inserting ? 0.7 : 1,
                cursor: inserting ? 'not-allowed' : 'pointer',
              }}
              onClick={handleInsert}
              disabled={inserting}
            >
              {inserting ? (
                <>
                  <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Inserting...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
                  </svg>
                  Insert Charts ({report.actions.length})
                </>
              )}
            </button>
          )}
          {insertDone && (
            <div style={{ ...S.btnPrimary, backgroundColor: '#059669', cursor: 'default', flex: 1, justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Charts Inserted ✓
            </div>
          )}
          <button style={S.btnSecondary} onClick={onClose}>
            ← Back
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

