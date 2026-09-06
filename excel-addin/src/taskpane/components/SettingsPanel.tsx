import React from 'react';
import { logout } from '../../api/auth';

const S = {
  container: {
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  body: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    padding: '14px',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  datasetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    flexShrink: 0,
    boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
  },
  datasetId: {
    fontSize: '10px',
    color: '#64748B',
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '4px 8px',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 800,
    flexShrink: 0,
    letterSpacing: '-0.02em',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  accountName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
  },
  roleBadge: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '2px 6px',
    alignSelf: 'flex-start',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '10px 0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
  },
  infoLabel: {
    color: '#64748B',
    fontWeight: 600,
  },
  infoValue: {
    color: '#0F172A',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  signOutBtn: {
    width: '100%',
    height: '36px',
    backgroundColor: 'transparent',
    border: '1px solid #FECACA',
    color: '#DC2626',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background-color 0.12s',
  },
  versionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionLabel: {
    fontSize: '10px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  versionValue: {
    fontSize: '10px',
    color: '#64748B',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};

export const SettingsPanel: React.FC<{
  datasetId: string;
  datasetName?: string;
  onLogout: () => void;
  onSwitchDataset?: () => void;
}> = ({ datasetId, datasetName, onLogout, onSwitchDataset }) => {
  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const shortId = datasetId ? `...${datasetId.slice(-12)}` : 'Not connected';

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.headerBar}>
        <div style={S.headerTitle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </div>
      </div>

      <div style={S.body}>
        {/* Dataset Connection */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            Connected Dataset
          </div>

          {/* Dataset name */}
          {datasetName && (
            <div style={{
              fontSize: '13px', fontWeight: 800, color: '#0F172A',
              marginBottom: '6px', letterSpacing: '-0.01em',
            }}>
              {datasetName}
            </div>
          )}

          <div style={S.datasetRow}>
            <div style={S.dot} />
            <div style={S.datasetId}>{`...${datasetId.slice(-12)}`}</div>
          </div>
          <div style={S.divider} />
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={S.infoRow}>
              <span style={S.infoLabel}>Status</span>
              <span style={{ ...S.infoValue, color: '#059669' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                Live Connected
              </span>
            </div>
            <div style={S.infoRow}>
              <span style={S.infoLabel}>AI Provider</span>
              <span style={S.infoValue}>Groq LLaMA 3</span>
            </div>
          </div>

          {/* Unlink workbook button */}
          {onSwitchDataset && (
            <>
              <div style={S.divider} />
              <button
                onClick={onSwitchDataset}
                style={{
                  width: '100%', height: '30px', backgroundColor: 'transparent',
                  border: '1px solid #E2E8F0', color: '#0F172A', fontSize: '10px',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '5px',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  <line x1="8" y1="8" x2="16" y2="16" />
                </svg>
                Unlink Workbook
              </button>
            </>
          )}
        </div>

        {/* Account */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Account
          </div>
          <div style={S.accountRow}>
            <div style={S.avatarCircle}>DI</div>
            <div style={S.accountInfo}>
              <div style={S.accountName}>Organization Admin</div>
              <div style={S.roleBadge}>ENTERPRISE USER</div>
            </div>
          </div>
          <div style={S.divider} />
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={S.infoRow}>
              <span style={S.infoLabel}>Security</span>
              <span style={S.infoValue}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                256-bit TLS
              </span>
            </div>
            <div style={S.infoRow}>
              <span style={S.infoLabel}>Environment</span>
              <span style={S.infoValue}>Excel Add-in v1.0</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Session
          </div>
          <button style={S.signOutBtn} onClick={handleLogout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out of Data Insight
          </button>
        </div>

      </div>
    </div>
  );
};
