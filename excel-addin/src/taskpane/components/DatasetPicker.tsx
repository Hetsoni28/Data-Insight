import React, { useEffect, useState } from 'react';
import { getDatasets } from '../../api/dataInsightApi';

interface Dataset {
  id: string;
  name: string;
  file_type: string;
  status: string;
  row_count: number | null;
  column_count: number | null;
  data_quality_score: number | null;
  description?: string | null;
}

const FILE_TYPE_ICON: Record<string, React.ReactNode> = {
  csv: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  xlsx: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </svg>
  ),
  json: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

const S = {
  container: {
    backgroundColor: '#F8FAFC',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '14px',
  },
  welcomeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  headerTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  headerSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  searchWrap: {
    padding: '10px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    height: '34px',
    paddingLeft: '32px',
    paddingRight: '10px',
    fontSize: '11px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '22px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
  },
  body: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  datasetCard: (hovered: boolean) => ({
    backgroundColor: '#FFFFFF',
    border: hovered ? '1px solid #10B981' : '1px solid #E2E8F0',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.12s',
    boxShadow: hovered ? '0 2px 12px rgba(16,185,129,0.12)' : 'none',
  }),
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  fileIconWrap: (type: string) => ({
    width: '26px',
    height: '26px',
    backgroundColor: type === 'xlsx' ? '#ECFDF5' : type === 'csv' ? '#F0FDF4' : '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  dsName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.3,
  },
  statusBadge: (status: string) => ({
    fontSize: '8px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 6px',
    backgroundColor: status === 'ready' ? '#ECFDF5' : status === 'processing' ? '#FFF7ED' : '#F1F5F9',
    color: status === 'ready' ? '#059669' : status === 'processing' ? '#D97706' : '#64748B',
    border: `1px solid ${status === 'ready' ? '#A7F3D0' : status === 'processing' ? '#FDE68A' : '#E2E8F0'}`,
    flexShrink: 0,
  }),
  metaRow: {
    display: 'flex',
    gap: '10px',
  },
  metaItem: {
    fontSize: '10px',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  metaValue: {
    color: '#64748B',
    fontWeight: 600,
  },
  qualityBar: {
    height: '3px',
    backgroundColor: '#E2E8F0',
    marginTop: '8px',
    overflow: 'hidden',
  },
  qualityFill: (score: number) => ({
    height: '100%',
    width: `${score}%`,
    backgroundColor: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
  }),
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
    color: '#94A3B8',
    fontSize: '12px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #E2E8F0',
    borderTop: '2px solid #10B981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '10px',
    textAlign: 'center' as const,
  },
  emptyTitle: { fontSize: '13px', fontWeight: 700, color: '#334155' },
  emptyDesc: { fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#94A3B8',
    padding: '6px 4px 2px',
  },
};

export const DatasetPicker: React.FC<{
  onSelect: (datasetId: string, datasetName: string) => void;
  onLogout: () => void;
}> = ({ onSelect, onLogout }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filtered, setFiltered] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDatasets();
        // API returns { status, data: [...] } or just an array
        const list: Dataset[] = Array.isArray(res) ? res : (res.data || res.items || []);
        // Only show ready datasets
        const ready = list.filter((d: Dataset) => d.status === 'ready' || !d.status);
        setDatasets(ready);
        setFiltered(ready);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load datasets. Please try again.');
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(datasets);
    } else {
      const q = search.toLowerCase();
      setFiltered(datasets.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.file_type || '').toLowerCase().includes(q)
      ));
    }
  }, [search, datasets]);

  const formatRows = (n: number | null) => {
    if (n == null) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.welcomeRow}>
          <img src="/assets/logo.svg" alt="Data Insight" height="24" />
          <div>
            <div style={S.headerTitle}>Choose a Dataset</div>
            <div style={S.headerSub}>Select from your organization's datasets</div>
          </div>
        </div>
      </div>

      {/* Search */}
      {!loading && datasets.length > 0 && (
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            style={S.searchInput}
            placeholder="Search datasets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Body */}
      <div style={S.body}>
        {loading && (
          <div style={S.loadingWrap}>
            <div style={S.spinner} />
            <span>Loading your datasets...</span>
          </div>
        )}

        {error && !loading && (
          <div style={S.loadingWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ color: '#EF4444', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={S.emptyWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <div style={S.emptyTitle}>{search ? 'No matches found' : 'No datasets yet'}</div>
            <div style={S.emptyDesc}>
              {search ? `No datasets match "${search}"` : 'Upload a dataset on the Data Insight web platform first.'}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div style={S.sectionLabel}>{filtered.length} DATASET{filtered.length !== 1 ? 'S' : ''} AVAILABLE</div>
            {filtered.map(ds => (
              <div
                key={ds.id}
                style={S.datasetCard(hovered === ds.id)}
                onClick={() => onSelect(ds.id, ds.name)}
                onMouseEnter={() => setHovered(ds.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={S.cardTop}>
                  <div style={S.nameRow}>
                    <div style={S.fileIconWrap(ds.file_type || 'csv')}>
                      {FILE_TYPE_ICON[ds.file_type?.toLowerCase() || 'csv'] || FILE_TYPE_ICON.csv}
                    </div>
                    <div style={S.dsName}>{ds.name}</div>
                  </div>
                  <span style={S.statusBadge(ds.status)}>
                    {(ds.status || 'READY').toUpperCase()}
                  </span>
                </div>

                <div style={S.metaRow}>
                  <div style={S.metaItem}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span style={S.metaValue}>{formatRows(ds.row_count)}</span> rows
                  </div>
                  <div style={S.metaItem}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                    <span style={S.metaValue}>{ds.column_count ?? '—'}</span> cols
                  </div>
                  <div style={S.metaItem}>
                    <span style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, color: '#64748B' }}>
                      {ds.file_type || 'CSV'}
                    </span>
                  </div>
                </div>

                {/* Quality bar */}
                {ds.data_quality_score != null && (
                  <div style={S.qualityBar}>
                    <div style={S.qualityFill(ds.data_quality_score)} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #E2E8F0',
        padding: '10px 12px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>
          Data Insight AI · Excel Add-in
        </span>
        <button
          onClick={onLogout}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '10px',
            color: '#EF4444',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
