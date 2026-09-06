import React, { useEffect, useState } from 'react';
import { isLoggedIn, logout } from '../api/auth';
import { getDatasetId, unlinkDataset } from '../excel/workbook';
import { LoginPanel } from './components/LoginPanel';
import { ChatPanel } from './components/ChatPanel';
import { QuickActions } from './components/QuickActions';
import { SettingsPanel } from './components/SettingsPanel';
import { DatasetPicker } from './components/DatasetPicker';

/* global document */

type AppState = 'INITIALIZING' | 'NOT_LOGGED_IN' | 'PICK_DATASET' | 'LOGGED_IN_NO_DATASET' | 'LOGGED_IN_DATASET_FOUND';
type TabValue = 'chat' | 'actions' | 'settings';

const S = {
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#F8FAFC',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoText: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em',
  },
  logoAccent: {
    color: '#10B981',
  },
  datasetBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '2px 8px',
    letterSpacing: '0.01em',
  },
  nav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '0 16px',
    display: 'flex',
    gap: '0',
    flexShrink: 0,
  },
  tab: {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#64748B',
    borderBottom: '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  tabActive: {
    color: '#10B981',
    borderBottom: '2px solid #10B981',
  },
  content: {
    flexGrow: 1,
    overflow: 'auto',
  },
  initWrap: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#F8FAFC',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2.5px solid #E2E8F0',
    borderTop: '2.5px solid #10B981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  initText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  noDatasetWrap: {
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center' as const,
  },
  noDatasetIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('INITIALIZING');
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabValue>('chat');

  const checkState = async () => {
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        setAppState('NOT_LOGGED_IN');
        return;
      }

      const isInExcel = typeof Excel !== 'undefined';

      if (isInExcel) {
        // Inside real Excel — try to read dataset ID from workbook custom property
        const id = await getDatasetId();
        if (id) {
          setDatasetId(id);
          setAppState('LOGGED_IN_DATASET_FOUND');
        } else {
          // Logged in but no dataset linked to this workbook yet — let them pick
          setAppState('PICK_DATASET');
        }
      } else {
        // Browser / dev mode — always show dataset picker (no hardcoded dataset)
        setAppState('PICK_DATASET');
      }
    } catch {
      setAppState('NOT_LOGGED_IN');
    }
  };

  const handleDatasetSelect = (id: string, name: string) => {
    setDatasetId(id);
    setDatasetName(name);
    setAppState('LOGGED_IN_DATASET_FOUND');
  };

  const handleLogout = async () => {
    await logout();
    setDatasetId(null);
    setDatasetName('');
    setAppState('NOT_LOGGED_IN');
  };

  useEffect(() => {
    checkState();
  }, []);

  if (appState === 'INITIALIZING') {
    return (
      <div style={S.initWrap}>
        <div style={S.spinner} />
        <span style={S.initText}>Loading Data Insight...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (appState === 'NOT_LOGGED_IN') {
    return <LoginPanel onLoginSuccess={checkState} />;
  }

  if (appState === 'PICK_DATASET') {
    return (
      <DatasetPicker
        onSelect={handleDatasetSelect}
        onLogout={handleLogout}
      />
    );
  }

  if (appState === 'LOGGED_IN_NO_DATASET') {
    return (
      <div style={S.root}>
        <div style={S.noDatasetWrap}>
          <div style={S.noDatasetIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>No Workbook Connected</p>
            <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>
              Open an Excel workbook that has been linked to Data Insight to start using AI assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: TabValue; label: string; icon: React.ReactNode }[] = [
    {
      key: 'chat',
      label: 'Chat',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    },
    {
      key: 'actions',
      label: 'Actions',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    },
  ];

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logoMark}>
          <img src="/assets/logo.svg" alt="Data Insight" height="24" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {datasetName && (
            <span
              title={datasetName}
              style={{
                fontSize: '9px', fontWeight: 700, color: '#64748B',
                maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {datasetName}
            </span>
          )}
        </div>
      </div>

      {/* Tab Nav */}
      <nav style={S.nav}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={S.content}>
        {activeTab === 'chat' && datasetId && <ChatPanel datasetId={datasetId} />}
        {activeTab === 'actions' && datasetId && <QuickActions datasetId={datasetId} />}
        {activeTab === 'settings' && datasetId && (
          <SettingsPanel
            datasetId={datasetId}
            datasetName={datasetName}
            onLogout={handleLogout}
            onSwitchDataset={async () => {
              await unlinkDataset();
              setDatasetId(null);
              setDatasetName('');
              setAppState('PICK_DATASET');
            }}
          />
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
