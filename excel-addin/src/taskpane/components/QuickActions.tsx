import React, { useState, useCallback } from 'react';
import { explainSelection, getChartAction, getFormulaAction, chatWithAI, detectAnomalies, generateForecast, analyzeWorkbook, getDataQuality, autoCleanData, categorizeColumn } from '../../api/dataInsightApi';
import { getSelectedRange, getWorkbookContext, getWorkbookSchema, highlightNullCells, writeDataQualityReport, clearHighlights, checkCellHasData, applyAutoClean, writeColumnResults } from '../../excel/workbook';
import { insertChart } from '../../excel/charts';
import { insertFormula } from '../../excel/formulas';
import { highlightRows } from '../../excel/formatting';
import { WorkbookReportPanel } from './WorkbookReportPanel';

/* global document */

function extractAnswer(res: any): string {
  if (!res) return '';
  if (typeof res === 'string') {
    try { const p = JSON.parse(res); return p.answer || p.explanation || p.summary || res; } catch { return res; }
  }
  if (res.answer) return res.answer;
  if (res.explanation) return res.explanation;
  if (res.summary) return res.summary;
  if (res.forecast_summary) return res.forecast_summary;
  return JSON.stringify(res).substring(0, 300);
}

// ── Inline Form ──────────────────────────────────────────────────────────────
interface FormField { key: string; label: string; placeholder: string; defaultValue?: string; hint?: string; }
interface InlineFormProps { fields: FormField[]; onSubmit: (v: Record<string,string>) => void; onCancel: () => void; title: string; icon: React.ReactNode; color: string; }

const InlineForm: React.FC<InlineFormProps> = ({ fields, onSubmit, onCancel, title, icon, color }) => {
  const [vals, setVals] = useState<Record<string,string>>(Object.fromEntries(fields.map(f => [f.key, f.defaultValue || ''])));
  return (
    <div style={{ margin: '0 12px 12px', background: '#fff', border: `1.5px solid ${color}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ background: color, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{title}</span>
      </div>
      <div style={{ padding: '14px' }}>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{f.label}</label>
            {f.hint && <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 5 }}>{f.hint}</div>}
            <input
              style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 12, border: '1.5px solid #E5E7EB', borderRadius: 6, background: '#F9FAFB', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
              placeholder={f.placeholder}
              value={vals[f.key]}
              onChange={e => setVals(p => ({ ...p, [f.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && onSubmit(vals)}
              autoFocus
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onSubmit(vals)} style={{ flex: 1, height: 36, background: color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ✦ Run AI Tool
          </button>
          <button onClick={onCancel} style={{ height: 36, padding: '0 14px', background: 'transparent', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Result Box ───────────────────────────────────────────────────────────────
const ResultBox: React.FC<{ result: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ result, type, onDismiss }) => (
  <div style={{ margin: '0 12px 12px', background: '#fff', border: `1.5px solid ${type === 'error' ? '#FCA5A5' : '#6EE7B7'}`, borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ background: type === 'error' ? '#FEF2F2' : '#ECFDF5', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {type === 'error' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, color: type === 'error' ? '#991B1B' : '#065F46' }}>
          {type === 'error' ? 'Error' : 'Done'}
        </span>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
    <div style={{ padding: '12px 14px', fontSize: 12, color: '#1F2937', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
      dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>') }}
    />
  </div>
);

// ── Loading State ────────────────────────────────────────────────────────────
const LoadingBox: React.FC<{ msg: string; step: number; totalSteps: number }> = ({ msg, step, totalSteps }) => (
  <div style={{ margin: '0 12px 12px', background: '#fff', border: '1.5px solid #D1FAE5', borderRadius: 10, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 20, height: 20, border: '2.5px solid #E5E7EB', borderTop: '2.5px solid #10B981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>{msg}</span>
    </div>
    <div style={{ background: '#F3F4F6', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: 99, width: `${Math.round((step/totalSteps)*100)}%`, transition: 'width 0.4s ease' }} />
    </div>
    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>Step {step} of {totalSteps}</div>
  </div>
);

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconAnalyzeWb = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M7 16l3-4 3 3 3-5 2 3"/>
    <circle cx="19" cy="5" r="2" fill={color} stroke="none"/>
  </svg>
);
const IconDataQuality = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconAnalyzeSel = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCreateChart = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);
const IconCreateFormula = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V5a1 1 0 0 1 1-1h3"/>
    <path d="M9 4h3a1 1 0 0 1 1 1v2"/>
    <path d="M8 12h8"/>
    <path d="M8 16h5"/>
    <path d="M4 7h16v14H4z"/>
    <path d="M15 16l3 3m0-3l-3 3"/>
  </svg>
);
const IconSummarize = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9"  x2="8"  y2="9"/>
  </svg>
);
const IconAnomalies = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconForecast = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconAutoClean = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18"/><path d="M9 3v18M15 3v18" opacity="0.4"/>
    <circle cx="19" cy="5" r="3" fill={color} stroke="none" opacity="0.8"/>
    <path d="M18 5l1 1 2-2" stroke="#fff" strokeWidth="1.5" fill="none"/>
  </svg>
);
const IconCategorize = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);

// ── Tool Card ────────────────────────────────────────────────────────────────
interface ToolCard { id: string; icon: React.ReactNode; label: string; desc: string; color: string; bg: string; span?: boolean; badge?: string; }

const TOOLS: ToolCard[] = [
  { id: 'analyze-wb',     icon: <IconAnalyzeWb    color="#10B981" />, label: 'Analyze Workbook',   desc: 'Full AI report with real stats from your dataset',      color: '#10B981', bg: '#ECFDF5', span: true, badge: 'FULL REPORT' },
  { id: 'data-quality',   icon: <IconDataQuality  color="#EF4444" />, label: 'Data Quality Scan',  desc: 'Scan nulls, highlight missing cells & write DQ report',  color: '#EF4444', bg: '#FFF1F2', span: true, badge: 'SCAN' },
  { id: 'auto-clean',     icon: <IconAutoClean    color="#059669" />, label: 'Auto-Clean Data',    desc: 'Fix nulls, remove duplicates & trim spaces automatically', color: '#059669', bg: '#ECFDF5', span: true, badge: 'FIX' },
  { id: 'analyze-sel',    icon: <IconAnalyzeSel   color="#6366F1" />, label: 'Analyze Selection',  desc: 'Explain the cells you have selected',                   color: '#6366F1', bg: '#EEF2FF' },
  { id: 'create-chart',   icon: <IconCreateChart  color="#F59E0B" />, label: 'Create Chart',       desc: 'AI picks the best chart type for your data',            color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'create-formula', icon: <IconCreateFormula color="#8B5CF6" />, label: 'Create Formula',    desc: 'Generate an Excel formula from plain English',          color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'summarize',      icon: <IconSummarize    color="#14B8A6" />, label: 'Summarize Sheet',    desc: 'Key stats, totals and business insights',               color: '#14B8A6', bg: '#F0FDFA' },
  { id: 'anomalies',      icon: <IconAnomalies    color="#F97316" />, label: 'Detect Anomalies',   desc: 'Find and highlight statistical outlier rows',           color: '#F97316', bg: '#FFF7ED' },
  { id: 'forecast',       icon: <IconForecast     color="#0EA5E9" />, label: 'Forecast Trend',     desc: 'Predict future values using your data pattern',         color: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'categorize',     icon: <IconCategorize   color="#7C3AED" />, label: 'Smart Categorize',   desc: 'AI labels sentiment or categories for any text column', color: '#7C3AED', bg: '#F5F3FF', badge: 'AI' },
];

// ── Main Component ───────────────────────────────────────────────────────────
export const QuickActions: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(3);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'success'|'error'>('success');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<string|null>(null);
  // Track whether any highlighting is active (so we can show "Clear Highlights")
  const [canClearHighlights, setCanClearHighlights] = useState(false);
  // Formula overwrite confirmation
  const [pendingFormulaVals, setPendingFormulaVals] = useState<Record<string,string> | null>(null);
  const [formulaConflict, setFormulaConflict] = useState<{ cell: string; existing: string } | null>(null);

  const startLoad = (msg: string, step: number, total: number) => {
    setLoadingMsg(msg); setLoadingStep(step); setLoadingTotal(total);
  };

  const run = useCallback(async (fn: () => Promise<string>, totalSteps = 3) => {
    setLoading(true); setResult(null); setActiveForm(null);
    try {
      const msg = await fn();
      setResult(msg); setResultType('success');
    } catch (e: any) {
      const err = e?.response?.data?.detail || e?.message || 'Unknown error. Please try again.';
      setResult(err); setResultType('error');
    }
    setLoading(false); setLoadingMsg(''); setLoadingStep(0);
  }, []);

  // ── Tool 1: Analyze Workbook ───────────────────────────────────────────────
  const handleAnalyzeWorkbook = useCallback(async () => {
    setLoading(true); setResult(null); setActiveForm(null);
    try {
      startLoad('Scanning workbook structure...', 1, 4);
      const schema = await getWorkbookSchema();
      startLoad('Running DuckDB analysis on your dataset...', 2, 4);
      const report = await analyzeWorkbook(datasetId, schema, 'comprehensive');
      startLoad('AI building your report...', 3, 4);
      const normalized = {
        ...report,
        sections: (report.sections || []).map((s: any) => ({
          heading: s.heading || s.title || 'Section',
          content: typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2),
        })),
      };
      startLoad('Report ready!', 4, 4);
      setReportData(normalized); setShowReport(true);
    } catch (e: any) {
      setResult(e?.response?.data?.detail || e?.message || 'Analysis failed.'); setResultType('error');
    }
    setLoading(false); setLoadingMsg('');
  }, [datasetId]);

  // ── Tool 2: Analyze Selection ─────────────────────────────────────────────
  const handleAnalyzeSelection = useCallback(() => run(async () => {
    startLoad('Reading your selected cells...', 1, 3);
    const sel = await getSelectedRange();
    if (!sel.headers?.length) return 'Please select at least 2 rows including a header row, then try again.';
    startLoad('AI analyzing your selection...', 2, 3);
    const res = await explainSelection(datasetId, sel);
    startLoad('Analysis complete', 3, 3);
    const explanation = extractAnswer(res) || '';
    const insights = res?.key_insights || [];
    return [explanation, ...insights.map((i: string) => `• ${i}`)].filter(Boolean).join('\n');
  }), [datasetId, run]);

  // ── Tool 3: Summarize Sheet ───────────────────────────────────────────────
  const handleSummarizeSheet = useCallback(() => run(async () => {
    startLoad('Reading sheet structure...', 1, 3);
    const ctx = await getWorkbookContext();
    startLoad('AI generating summary with real stats...', 2, 3);
    const res = await chatWithAI(datasetId, 'Give me a comprehensive business summary of this dataset. Include: total rows, key metrics with exact numbers (min/max/avg), top categories, notable patterns, and 3 actionable business insights.', ctx);
    startLoad('Summary ready', 3, 3);
    return extractAnswer(res) || 'Summary generated.';
  }), [datasetId, run]);

  // ── Tool 4: Detect Anomalies ──────────────────────────────────────────────
  const handleDetectAnomalies = useCallback(() => run(async () => {
    startLoad('Reading active sheet...', 1, 4);
    const ctx = await getWorkbookContext().catch(() => null);
    if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');
    startLoad('Running IQR outlier detection on all numeric columns...', 2, 4);
    const res = await detectAnomalies(datasetId, ctx.activeSheetName || 'Sheet1');
    startLoad('Highlighting anomalous rows...', 3, 4);
    if (res?.rows?.length > 0) {
      await highlightRows(ctx.activeSheetName, res.rows, res.color || '#FCA5A5', res.reason || 'Outlier detected');
      setCanClearHighlights(true);  // Show "Clear Highlights" button
      startLoad('Done', 4, 4);
      const details = res.details ? `\n\nExample anomalies:\n${Object.entries(res.details).slice(0,3).map(([r,c]: any) => `Row ${r}: ${c.join(', ')}`).join('\n')}` : '';
      return `Found **${res.rows.length}** anomalous row(s) — highlighted in red.\n\n${res.reason}${details}\n\n_Use "Clear Highlights" below to remove the coloring._`;
    }
    return 'No anomalies detected — your data looks clean!';
  }, 4), [datasetId, run]);

  // ── Tool 5: Create Chart ──────────────────────────────────────────────────
  const submitChart = useCallback(async (vals: Record<string,string>) => {
    await run(async () => {
      startLoad('Capturing your selection...', 1, 4);
      const sel = await getSelectedRange().catch(() => null);
      const ctx = await getWorkbookContext().catch(() => null);
      if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open and try again.');
      startLoad('AI determining best chart type...', 2, 4);
      const action = await getChartAction(datasetId, vals.question, ctx, sel);
      startLoad('Inserting chart into Excel (below your data)...', 3, 4);
      await insertChart(action.chart_action || action);
      startLoad('Chart created', 4, 4);
      return `**${action.title || 'Chart'}** created successfully!\n\nType: ${action.chart_type || 'column'}\n\nThe chart has been placed below your existing data so nothing is overwritten.`;
    }, 4);
  }, [datasetId, run]);

  // ── Tool 6: Create Formula ────────────────────────────────────────────────
  const submitFormula = useCallback(async (vals: Record<string,string>) => {
    // First: check if target cell already has data
    const targetCell = vals.cell || 'M1';
    const cellCheck = await checkCellHasData(targetCell).catch(() => ({ hasData: false, currentValue: '' }));
    if (cellCheck.hasData) {
      // Show conflict warning — don't proceed until user confirms
      setFormulaConflict({ cell: targetCell, existing: cellCheck.currentValue });
      setPendingFormulaVals(vals);
      return; // Stop here — will resume if user confirms
    }
    await doInsertFormula(vals);
  }, [datasetId, run]);

  const doInsertFormula = useCallback(async (vals: Record<string,string>) => {
    await run(async () => {
      startLoad('Reading your column structure...', 1, 3);
      const ctx = await getWorkbookContext().catch(() => null);
      if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');
      const headersCtx = `Headers: ${(ctx.columnHeaders || []).join(', ')}. Total rows: ${ctx.rowCount}`;
      startLoad('AI writing the formula...', 2, 3);
      const action = await getFormulaAction(datasetId, vals.description, `${vals.cell}. ${headersCtx}`);
      startLoad('Inserting formula into cell...', 3, 3);
      await insertFormula(action.formula_action || action);
      return `Formula inserted into **${action.cell || vals.cell}**\n\n\`${action.formula || ''}\`\n\n${action.explanation || ''}`;
    }, 3);
  }, [datasetId, run]);

  // ── Tool 7: Forecast ──────────────────────────────────────────────────────
  const submitForecast = useCallback(async (vals: Record<string,string>) => {
    await run(async () => {
      startLoad('Detecting time-series columns...', 1, 4);
      const sel = await getSelectedRange().catch(() => null);
      const ctx = await getWorkbookContext().catch(() => null);
      if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');
      startLoad('Analyzing data trend...', 2, 4);
      const res = await generateForecast(datasetId, parseInt(vals.horizon,10) || 6, ctx, sel);
      startLoad('Generating forecast chart...', 3, 4);
      await insertChart(res?.chart_action || res);
      startLoad('Forecast ready', 4, 4);
      const summary = res?.forecast_summary || extractAnswer(res) || '';
      return `**Forecast chart inserted!**\n\n${summary}\n\nChart placed below your existing data.`;
    }, 4);
  }, [datasetId, run]);

  const handleInsertReportCharts = async (actions: object[]) => {
    setLoading(true);
    try {
      for (const a of actions) await insertChart(a);
      setResult(`Inserted ${actions.length} chart(s) into your workbook.`); setResultType('success');
    } catch (e: any) {
      const msg = e?.message || 'Error inserting charts.'; setResult(msg); setResultType('error'); throw new Error(msg);
    }
    setLoading(false);
  };

  if (showReport && reportData) {
    return <WorkbookReportPanel report={reportData} onClose={() => setShowReport(false)} onInsertCharts={handleInsertReportCharts} />;
  }

  // ── Tool: Data Quality Scan ──────────────────────────────────────────────────
  const handleDataQuality = useCallback(async () => {
    await run(async () => {
      startLoad('Scanning all columns for missing values...', 1, 4);
      const ctx = await getWorkbookContext().catch(() => null);
      if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');
      const result = await getDataQuality(datasetId, ctx);

      const issues = result.columns_with_issues || [];
      const totalMissing = result.total_missing_cells || 0;

      if (totalMissing === 0) {
        startLoad('Writing quality report...', 3, 4);
        await writeDataQualityReport(result);
        startLoad('Done!', 4, 4);
        return `**Your dataset is 100% clean!**\n\nQuality Score: ${result.quality_score}%\n${result.total_rows?.toLocaleString()} rows × ${result.total_columns} columns — no missing values found.\n\nA **DQ_Report** sheet has been added to your workbook.`;
      }

      startLoad(`Highlighting ${Math.min(totalMissing, 500)} missing cells in red...`, 2, 4);
      await highlightNullCells(
        issues.map((c: any) => ({
          column: c.column,
          excel_col: c.excel_col,
          null_excel_rows: c.null_excel_rows || [],
          total_missing: c.total_missing,
        }))
      );
      setCanClearHighlights(true);  // Show "Clear Highlights" button

      startLoad('Writing DQ_Report sheet...', 3, 4);
      await writeDataQualityReport(result);
      startLoad('Done!', 4, 4);

      const worstCols = issues.slice(0, 3).map((c: any) =>
        `**${c.column}**: ${c.total_missing} missing (${c.missing_pct}%) — fill with ${c.fill_strategy}${c.fill_value != null ? ` = ${c.fill_value}` : ''}`
      ).join('\n');

      return `**Data Quality Issues Found**\n\nQuality Score: **${result.quality_score}%**\nTotal missing: **${totalMissing.toLocaleString()} cells** across **${issues.length} columns**\n\nTop issues:\n${worstCols}\n\nNull cells highlighted in **red** on your sheet\nFull report written to **DQ_Report** tab\n\n_Use "Clear Highlights" below to remove the red coloring._`;
    }, 4);
  }, [datasetId, run]);

  // ── Tool 9: Auto-Clean Data ────────────────────────────────────────────────
  const handleAutoClean = useCallback(() => run(async () => {
    startLoad('Analyzing your dataset for issues...', 1, 5);
    const ctx = await getWorkbookContext().catch(() => null);
    if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');
    const cleanResult = await autoCleanData(datasetId, ctx);
    const summary = cleanResult.summary || {};

    if (!summary.has_changes) {
      return `**Your data is already clean!**\n\nNo nulls, duplicates, or whitespace issues detected.`;
    }

    startLoad(`Applying fixes: ${summary.nulls_to_fill || 0} nulls, ${summary.duplicates_to_remove || 0} dupes, ${summary.spaces_to_trim || 0} spaces...`, 2, 5);
    startLoad('Filling null cells (shown in green)...', 3, 5);
    const applied = await applyAutoClean(cleanResult);

    startLoad('Finalizing...', 5, 5);
    setCanClearHighlights(true);

    const parts: string[] = [];
    if (applied.nulls_filled > 0)       parts.push(`**${applied.nulls_filled}** null cell(s) filled (highlighted green)`);
    if (applied.duplicates_removed > 0) parts.push(`**${applied.duplicates_removed}** duplicate row(s) removed`);
    if (applied.spaces_trimmed > 0)     parts.push(`**${applied.spaces_trimmed}** whitespace cell(s) trimmed`);

    return `**Auto-Clean Complete!**\n\nChanges made:\n• ${parts.join('\n• ')}\n\n_Green cells = auto-filled. Use "Clear Highlights" to remove the color._`;
  }, 5), [datasetId, run]);

  // ── Tool 10: Smart Categorize ─────────────────────────────────────────────
  const submitCategorize = useCallback(async (vals: Record<string,string>) => {
    const columnName = vals.column?.trim();
    const mode = (vals.mode || 'sentiment').trim().toLowerCase();

    // Validate mode input
    const resolvedMode = mode === 'categorize' ? 'categorize' : 'sentiment';

    await run(async () => {
      if (!columnName) throw new Error('Please enter a column name to classify.');

      const ctx = await getWorkbookContext().catch(() => null);
      if (!ctx) throw new Error('Could not read your Excel sheet. Please make sure a sheet with data is open.');

      let batchStart = 0;
      let definedCategories: string[] = [];
      const allLabels: string[] = [];
      let sourceExcelCol = 'A';
      let totalRows = 1;
      let stepNum = 0;

      startLoad(resolvedMode === 'sentiment'
        ? 'Classifying sentiment for first 100 rows...'
        : 'AI analyzing column to define categories...', 1, 5);

      // Batch loop — runs until has_more is false
      while (true) {
        const res = await categorizeColumn(datasetId, columnName, resolvedMode, ctx, batchStart, definedCategories);
        definedCategories = res.defined_categories || definedCategories;
        sourceExcelCol = res.excel_col || sourceExcelCol;
        totalRows = res.total_rows || totalRows;
        allLabels.push(...(res.labels || []));
        batchStart += res.batch_size || 100;
        stepNum++;

        if (!res.has_more) break;

        const pct = Math.round((allLabels.length / totalRows) * 100);
        startLoad(`Classifying... ${allLabels.length.toLocaleString()}/${totalRows.toLocaleString()} rows (${pct}%)`, Math.min(stepNum + 1, 4), 5);
      }

      startLoad(`Writing ${allLabels.length} results to Excel...`, 5, 5);
      const headerName = resolvedMode === 'sentiment' ? 'Sentiment' : 'Category';
      await writeColumnResults(sourceExcelCol, headerName, allLabels, 2);

      const categorySummary = resolvedMode === 'categorize' && definedCategories.length > 0
        ? `\n\nCategories used: **${definedCategories.join(' / ')}**` : '';

      return `**${headerName} column added!**\n\n${allLabels.length.toLocaleString()} rows classified for column "${columnName}"${categorySummary}\n\nNew "${headerName}" column written next to "${columnName}" in your sheet.`;
    }, 5);
  }, [datasetId, run]);

  // ── Form configs include new Categorize form ───────────────────────────────
  const formConfigs: Record<string,any> = {
    'create-chart': {
      title: 'Create AI Chart', icon: <IconCreateChart color="#F59E0B" />, color: '#F59E0B',
      fields: [{
        key: 'question', label: 'What do you want to visualize?',
        placeholder: 'e.g. Bar chart of churn rate by contract type',
        hint: 'Tip: First highlight the columns you want to chart, then describe it here',
      }],
      onSubmit: submitChart,
    },
    'create-formula': {
      title: 'Create AI Formula', icon: <IconCreateFormula color="#8B5CF6" />, color: '#8B5CF6',
      fields: [
        { key: 'description', label: 'Describe the formula you need', placeholder: 'e.g. Average monthly charges for churned customers', hint: 'The AI knows your column names and will write the correct Excel formula' },
        { key: 'cell', label: 'Insert into which cell?', placeholder: 'e.g. M1', defaultValue: 'M1' },
      ],
      onSubmit: submitFormula,
    },
    'forecast': {
      title: 'Forecast Trend', icon: <IconForecast color="#0EA5E9" />, color: '#0EA5E9',
      fields: [{
        key: 'horizon', label: 'Periods to forecast ahead', placeholder: '6', defaultValue: '6',
        hint: 'Tip: Highlight your date & value columns before forecasting for best results',
      }],
      onSubmit: submitForecast,
    },
    'categorize': {
      title: 'Smart Categorize', icon: <IconCategorize color="#7C3AED" />, color: '#7C3AED',
      fields: [
        {
          key: 'column', label: 'Which text column to classify?',
          placeholder: 'e.g. CustomerFeedback, Description, Notes',
          hint: 'Enter the exact column header name from your sheet. AI will read every row.',
        },
        {
          key: 'mode', label: 'Classification type', placeholder: 'sentiment',
          defaultValue: 'sentiment',
          hint: 'Type  sentiment  for Positive/Neutral/Negative, or  categorize  for AI-defined categories',
        },
      ],
      onSubmit: submitCategorize,
    },
  };

  const cardHandlers: Record<string, () => void> = {
    'analyze-wb':     handleAnalyzeWorkbook,
    'data-quality':   handleDataQuality,
    'auto-clean':     handleAutoClean,
    'analyze-sel':    handleAnalyzeSelection,
    'summarize':      handleSummarizeSheet,
    'anomalies':      handleDetectAnomalies,
    'create-chart':   () => { setResult(null); setActiveForm('create-chart'); },
    'create-formula': () => { setResult(null); setActiveForm('create-formula'); },
    'forecast':       () => { setResult(null); setActiveForm('forecast'); },
    'categorize':     () => { setResult(null); setActiveForm('categorize'); },
  };

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>AI Quick Actions</span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 99 }}>10 TOOLS</span>
      </div>

      {/* Hint bar */}
      {!loading && !result && !activeForm && (
        <div style={{ background: '#EFF6FF', borderBottom: '1px solid #DBEAFE', padding: '8px 16px', fontSize: 10.5, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span><strong>Pro tip:</strong> Select cells in Excel first, then click a tool for best results.</span>
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingBox msg={loadingMsg} step={loadingStep} totalSteps={loadingTotal} />}

      {/* Result */}
      {result && !loading && <ResultBox result={result} type={resultType} onDismiss={() => setResult(null)} />}

      {/* ── Clear Highlights Banner ──────────────────────────────────────────── */}
      {canClearHighlights && !loading && (
        <div style={{ margin: '0 12px 10px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#92400E' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span><strong>Red/yellow cells</strong> are highlighted on your sheet</span>
          </div>
          <button
            onClick={async () => { await clearHighlights(); setCanClearHighlights(false); }}
            style={{ background: '#D97706', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 11px', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Clear Highlights
          </button>
        </div>
      )}

      {/* ── Formula Cell Conflict Confirmation ──────────────────────────────── */}
      {formulaConflict && !loading && (
        <div style={{ margin: '0 12px 10px', background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A3412', marginBottom: 6 }}>Cell {formulaConflict.cell} already has data</div>
          <div style={{ fontSize: 11, color: '#7C2D12', marginBottom: 10 }}>
            Current value: <code style={{ background: '#FEE2E2', padding: '1px 5px', borderRadius: 3 }}>{formulaConflict.existing}</code><br/>
            Inserting the formula here will <strong>overwrite</strong> this value. Continue?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={async () => { const vals = pendingFormulaVals; setFormulaConflict(null); setPendingFormulaVals(null); if (vals) await doInsertFormula(vals); }}
              style={{ flex: 1, height: 32, background: '#EA580C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Yes, overwrite
            </button>
            <button
              onClick={() => { setFormulaConflict(null); setPendingFormulaVals(null); }}
              style={{ height: 32, padding: '0 14px', background: 'transparent', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Form */}
      {activeForm && !loading && formConfigs[activeForm] && (
        <InlineForm
          {...formConfigs[activeForm]}
          onCancel={() => setActiveForm(null)}
        />
      )}

      {/* Tool Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 12px 20px' }}>
        {TOOLS.map(tool => {
          const isActive = activeForm === tool.id;
          const isHovered = hoveredCard === tool.id;
          return (
            <div
              key={tool.id}
              onClick={loading ? undefined : cardHandlers[tool.id]}
              onMouseEnter={() => !loading && setHoveredCard(tool.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                gridColumn: tool.span ? '1 / -1' : undefined,
                background: isActive ? tool.bg : '#fff',
                border: `1.5px solid ${isActive || isHovered ? tool.color : '#E5E7EB'}`,
                borderRadius: 10,
                padding: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.55 : 1,
                transition: 'all 0.15s ease',
                boxShadow: isHovered || isActive ? `0 4px 16px ${tool.color}22` : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: tool.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{tool.label}</span>
                    {tool.badge && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: tool.color, background: tool.bg, border: `1px solid ${tool.color}55`, padding: '1px 6px', borderRadius: 99, letterSpacing: '0.06em' }}>{tool.badge}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6B7280', lineHeight: 1.4 }}>{tool.desc}</div>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={tool.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, opacity: isHovered || isActive ? 1 : 0.25, transition: 'opacity 0.15s' }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
